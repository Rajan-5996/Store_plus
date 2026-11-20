import json

from fastapi import APIRouter, HTTPException, Path, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.filters import RangeKey

router = APIRouter(prefix="/api/agent", tags=["agent"])

class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    thread_id: str = Field(default="default", max_length=64)
    screen: str | None = Field(default=None, max_length=32)  # dashboard page the question was asked on


class ChatOut(BaseModel):
    answer: str
    tools: list[str]


@router.post("/chat", response_model=ChatOut)
def chat(body: ChatIn) -> ChatOut:
    """Ask the Pulse main agent a question. The same `thread_id` continues the conversation."""
    from app.agent.engine import ask  # imported lazily so the dashboard API starts without the agent code

    try:
        out = ask(body.message, body.thread_id, body.screen)
    except Exception as e:  # noqa: BLE001 - report model / rate-limit problems to the UI
        raise HTTPException(status_code=502, detail=f"The agent could not answer: {e}") from e
    return ChatOut(answer=str(out["answer"]), tools=[c["tool"] for c in out["tool_calls"]])


@router.get("/actions")
def actions(screen: str = Query(max_length=32), city: str = Query("all", max_length=8), range: RangeKey = Query("30d"), refresh: bool = False):
    """AI-written "Recommended actions" for a dashboard screen (cached for 30 minutes; `refresh=true` asks the model again)."""
    from app.agent.recommend import ActionsError, DomoError, screen_actions

    try:
        return screen_actions(screen, city, range, refresh)
    except (ActionsError, DomoError) as e:
        raise HTTPException(status_code=404 if "Unknown screen" in str(e) else 502, detail=str(e)) from e


@router.get("/threads")
def threads(limit: int = Query(50, ge=1, le=200)):
    """Saved conversations for the History menu, most recently active first (title = the first question)."""
    from app.agent.history import list_threads

    return list_threads(limit)


@router.get("/threads/{thread_id}")
def thread(thread_id: str = Path(max_length=64)):
    """Every question and answer of one conversation, oldest first; send its id as `thread_id` to carry on with it."""
    from app.agent.history import thread_turns

    return thread_turns(thread_id)


@router.delete("/threads/{thread_id}")
def forget_thread(thread_id: str = Path(max_length=64)):
    from app.agent.history import delete_thread

    return {"deleted": delete_thread(thread_id)}


@router.post("/chat/stream")
def chat_stream(body: ChatIn) -> StreamingResponse:
    """Same as /chat, but streams progress as server-sent events: `step` lines while the agent works, then `answer`."""
    from app.agent.engine import ask_stream  # lazy: keep the dashboard API independent of the agent code

    def events():
        for event in ask_stream(body.message, body.thread_id, body.screen):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
