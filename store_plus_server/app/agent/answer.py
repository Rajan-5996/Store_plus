"""Parsing the model's reply: find the SQL it asks for, and strip working-out from a final answer.

The model sometimes narrates, writes several `SQL:` lines, or invents `<details>` "SQL Result" tables. Only the
first query is ever run (by us), and anything the model wrote as a result is discarded.
"""
import re

_SQL_START = re.compile(r"(?im)^[ \t>*`-]*SQL:[ \t]*")
_STOP = re.compile(r"\n\s*\n|<details|\n[ \t>*`-]*SQL:", re.I)
_DETAILS = re.compile(r"<details.*?</details>", re.S | re.I)
_SQL_LINE = re.compile(r"(?im)^[ \t>*`-]*SQL:.*(?:\n(?![ \t]*\n|#).*)*")  # a SQL: line and its continuation lines
_HEADING = re.compile(r"(?m)^#{1,3} \S")


def requested_sql(reply: str) -> str | None:
    """The first query the model asked for (it may follow narration), or None if the reply is a final answer."""
    m = _SQL_START.search(reply)
    if not m:
        return None
    rest = reply[m.end():]
    stop = _STOP.search(rest)
    sql = (rest[: stop.start()] if stop else rest).strip().strip("`").strip().rstrip(";").strip()
    return sql or None


def clean_answer(reply: str) -> str:
    """The final answer without SQL lines, invented result tables or narration that came before the report."""
    dirty = bool(_SQL_START.search(reply)) or "<details" in reply.lower()
    text = _SQL_LINE.sub("", _DETAILS.sub("", reply))
    if dirty:
        h = _HEADING.search(text)
        if h:
            text = text[h.start():]  # drop "Let me check..." chatter before the report
    return re.sub(r"\n{3,}", "\n\n", text).strip()
