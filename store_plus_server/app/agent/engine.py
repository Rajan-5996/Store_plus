"""The StorePulse agent engine: gather the data from DuckDB, ask Domo AI, run any SQL it requests, answer.

No agent framework: one retrieval step feeds the model the numbers, then a short loop of at most `max_rounds`
SQL requests. Typically that is a single Domo call, so there is no per-step token limit to hit.
"""
import logging

from app.agent.answer import clean_answer, requested_sql
from app.agent.domo_client import DomoError, make_client
from app.agent.history import recent_turns, save_turn
from app.agent.prompt import build_input, build_system
from app.agent.retrieval import build_context
from app.agent.settings import get_settings
from app.agent.sqltool import run_sql, schema_text

log = logging.getLogger(__name__)

def ask_stream(question: str, thread_id: str = "default", screen: str | None = None):
    """Yields progress events: `step` lines while it works, then one `answer` (or an `error`)."""
    s = get_settings()
    client = make_client()
    yield {"type": "step", "text": "Reading your question"}
    try:
        ctx = build_context(question, screen)
        for text in ctx.steps:
            yield {"type": "step", "text": text}
        system = build_system(ctx.skills)
        prompt = build_input(schema_text(), ctx.render(), recent_turns(thread_id, s.history_turns), question)
        tools = list(ctx.tools)

        yield {"type": "step", "text": "Preparing a demo answer" if s.use_mock else "Asking Domo AI"}
        rounds = 0
        while True:
            reply = client.generate(prompt, system).strip()
            sql = requested_sql(reply)
            if sql is None:
                break
            if rounds >= s.max_rounds:  # out of queries: force an answer from what we have
                prompt += "\n\n=== NO MORE QUERIES ===\nAnswer now using only the data above."
                reply = client.generate(prompt, system).strip()
                break
            rounds += 1
            tools.append("run_sql")
            yield {"type": "step", "text": "Running a query on the store data"}
            prompt += f"\n\n=== QUERY RESULT {rounds} ===\nSQL: {sql}\n{run_sql(sql)}\n=== END RESULT ===\nAnswer now, or request one more query."
            yield {"type": "step", "text": "Writing the answer"}
    except DomoError as e:
        yield {"type": "error", "message": str(e)}
        return
    except Exception as e:  # noqa: BLE001 - never leave the UI hanging
        yield {"type": "error", "message": f"The agent could not answer: {e}"}
        return
    answer = clean_answer(reply) or "I could not produce an answer. Please try rephrasing."
    try:
        save_turn(thread_id, screen, question, answer, tools)  # what the user saw, so History shows the same answer
    except Exception:  # noqa: BLE001 - a failed save must not lose the answer the user is waiting for
        log.exception("could not save chat turn for thread %s", thread_id)
    yield {"type": "answer", "answer": answer, "tools": tools}


def ask(question: str, thread_id: str = "default", screen: str | None = None) -> dict:
    """Blocking version of `ask_stream`: returns the answer and the data tools used, or raises on failure."""
    answer, tools = "", []
    for e in ask_stream(question, thread_id, screen):
        if e["type"] == "error":
            raise RuntimeError(e["message"])
        if e["type"] == "answer":
            answer, tools = e["answer"], e["tools"]
    return {"answer": answer, "tool_calls": [{"tool": t, "args": {}} for t in tools]}
