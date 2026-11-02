"""Read-only SQL for the model, plus a compact schema listing so it can write correct queries."""
import json
from datetime import date, datetime
from decimal import Decimal
from functools import lru_cache
from typing import Any

from app.agent.settings import get_settings
from app.agent.sql_guard import check_sql
from app.core import db


def _json(o: Any) -> Any:
    if isinstance(o, (date, datetime)):
        return o.isoformat()
    if isinstance(o, Decimal):
        return float(o)
    return str(o)


def run_sql(sql: str) -> str:
    """Run one read-only SELECT and return rows as JSON text; errors come back as text so the model can fix the query."""
    limit = get_settings().max_rows
    problem = check_sql(sql)
    if problem:
        return f"Error: {problem}"
    try:
        rows = db.query(f"select * from ({sql.strip().rstrip(';')}) limit {limit + 1}")
    except Exception as e:  # noqa: BLE001 - surface the message to the model
        return f"Error: {e}"
    more = len(rows) > limit
    rows = [{k: round(v, 4) if isinstance(v, float) else v for k, v in r.items()} for r in rows[:limit]]
    return json.dumps({"row_count": len(rows), "more_rows_available": more, "rows": rows}, default=_json)


@lru_cache(maxsize=1)
def schema_text() -> str:
    """`table(col type, ...)` for every table and mart: the data catalog in a form the model can query against."""
    cols = db.query(
        "select table_name, column_name, data_type from information_schema.columns "
        "where table_schema = 'main' order by table_name, ordinal_position"
    )
    tables: dict[str, list[str]] = {}
    for c in cols:
        tables.setdefault(c["table_name"], []).append(f"{c['column_name']} {c['data_type'].lower()}")
    return "\n".join(f"{t}({', '.join(cs)})" for t, cs in tables.items())
