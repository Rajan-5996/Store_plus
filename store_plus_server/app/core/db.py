"""DuckDB access: every parquet file is exposed as a view, plus an in-memory store-day mart."""
import threading
from typing import Any

import duckdb

from app.core.config import DATA_DIR
from app.core.mart import SKU_DAY_SQL, STORE_DAY_SQL

_con: duckdb.DuckDBPyConnection | None = None
_lock = threading.Lock()


def init_db() -> None:
    """Create the connection, register one view per parquet file and build the store-day mart."""
    global _con
    con = duckdb.connect()
    for path in sorted(DATA_DIR.glob("*/*.parquet")):
        con.execute(f"create view {path.stem} as select * from read_parquet('{path.as_posix()}')")
    con.execute(STORE_DAY_SQL)
    con.execute(SKU_DAY_SQL)
    _con = con


def query(sql: str) -> list[dict[str, Any]]:
    """Run a read-only query on a fresh cursor and return rows as dicts."""
    if _con is None:
        raise RuntimeError("database not initialised")
    with _lock:
        cur = _con.cursor()
    try:
        rel = cur.execute(sql)
        cols = [d[0] for d in rel.description]
        return [dict(zip(cols, row)) for row in rel.fetchall()]
    finally:
        cur.close()


def one(sql: str) -> dict[str, Any]:
    rows = query(sql)
    return rows[0] if rows else {}
