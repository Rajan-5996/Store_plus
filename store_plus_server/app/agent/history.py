"""Pulse AI chat history, saved in the app's DuckDB store (app/core/store.py) so a conversation survives a server restart.

Every turn is kept; only the last few of a thread are fed back to the model (`history_turns` in settings.py).
"""
from app.core import store


def recent_turns(thread_id: str, n: int) -> list[tuple[str, str]]:
    """The last `n` question/answer pairs of a conversation, oldest first."""
    rows = store.query(
        "select question, answer from (select * from chat_turns where thread_id = ? order by id desc limit ?) order by id",
        (thread_id, n),
    )
    return [(r["question"], r["answer"]) for r in rows]


def save_turn(thread_id: str, screen: str | None, question: str, answer: str, tools: list[str]) -> None:
    store.query(
        "insert into chat_turns (thread_id, created_at, screen, question, answer, tools) values (?, ?, ?, ?, ?, ?)",
        (thread_id, store.utc_now(), screen, question, answer, tools),
    )


def list_threads(limit: int = 50) -> list[dict]:
    """Saved conversations, most recently active first: title (its first question), questions asked, last activity."""
    rows = store.query(
        "select thread_id, left(arg_min(question, id), 140) as title, count(*) as questions, max(created_at) as updated_at "
        "from chat_turns group by thread_id order by max(id) desc limit ?",
        (limit,),
    )
    return [{"id": r["thread_id"], "title": r["title"], "questions": r["questions"], "updatedAt": store.iso(r["updated_at"])} for r in rows]


def thread_turns(thread_id: str) -> list[dict]:
    """Every question and answer of one conversation, oldest first (empty when nothing was saved under the id)."""
    rows = store.query("select question, answer, tools, screen, created_at from chat_turns where thread_id = ? order by id", (thread_id,))
    return [{"question": r["question"], "answer": r["answer"], "tools": r["tools"], "screen": r["screen"], "createdAt": store.iso(r["created_at"])}
            for r in rows]


def delete_thread(thread_id: str) -> int:
    """Forget a conversation; returns how many turns were removed."""
    return len(store.query("delete from chat_turns where thread_id = ? returning id", (thread_id,)))
