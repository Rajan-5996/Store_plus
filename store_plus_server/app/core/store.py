"""Saved app state: the transfer log and the Pulse AI chat history, in a DuckDB file (storage/storepulse.duckdb, git-ignored).

This is its own connection, apart from the in-memory analytics database in db.py, so SQL written by the model cannot
read it. DuckDB lets only one process open the file for writing: run the server as a single process (no `--workers`).
The CLI and the tests use an in-memory store instead.
"""
import sqlite3
import threading
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import duckdb

from app.core.config import STORAGE_DIR

DB_PATH = STORAGE_DIR / "storepulse.duckdb"
OLD_TRANSFERS_DB = "transfers.db"  # the SQLite log used before, next to the store file: imported once, then left in place

_SCHEMA = """
create sequence if not exists transfer_id;
create table if not exists transfers (
  id integer primary key default nextval('transfer_id'),
  created_at timestamp not null,  -- UTC
  updated_at timestamp not null,  -- UTC
  kind varchar not null, item varchar, quantity double not null, unit varchar not null,
  from_code varchar not null, from_area varchar not null, to_code varchar not null, to_area varchar not null,
  reason varchar not null default '',
  status varchar not null default 'planned' check (status in ('planned', 'done', 'cancelled'))
);
create sequence if not exists chat_turn_id;
create table if not exists chat_turns (
  id bigint primary key default nextval('chat_turn_id'),
  thread_id varchar not null,
  created_at timestamp not null,  -- UTC
  screen varchar,  -- dashboard page the question was asked on
  question varchar not null,
  answer varchar not null,
  tools varchar[] not null  -- data tools the agent used for the answer
);
"""

_TRANSFER_COLS = "created_at, updated_at, kind, item, quantity, unit, from_code, from_area, to_code, to_area, reason, status"

_con: duckdb.DuckDBPyConnection | None = None
lock = threading.RLock()  # one statement at a time; hold it across a read-then-write that must not interleave


def open_store(path: Path | str | None = None) -> None:
    """Open the store (default DB_PATH), creating the file and tables if needed. ":memory:" keeps it in RAM (CLI, tests)."""
    global _con
    close_store()
    path = path or DB_PATH
    in_memory = str(path) == ":memory:"
    if not in_memory:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
    try:
        con = duckdb.connect(str(path))
    except duckdb.IOException as e:
        raise RuntimeError(f"Cannot open {path}. If another server process is running, stop it: only one process can use the file. ({e})") from e
    con.execute(_SCHEMA)
    if not in_memory:
        _import_sqlite_log(con, Path(path).with_name(OLD_TRANSFERS_DB))
    with lock:
        _con = con


def close_store() -> None:
    global _con
    with lock:
        if _con is not None:
            _con.close()
            _con = None


def query(sql: str, params: list | tuple = ()) -> list[dict[str, Any]]:
    """Run one statement and return its rows as dicts (use `returning *` to get back what an insert or update wrote)."""
    with lock:
        if _con is None:
            raise RuntimeError("store not open: call open_store() first")
        rel = _con.execute(sql, params)
        if rel.description is None:
            return []
        cols = [d[0] for d in rel.description]
        return [dict(zip(cols, row)) for row in rel.fetchall()]


def utc_now() -> datetime:
    """Now in UTC, to the second, as the naive timestamp the tables store."""
    return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


def iso(ts: datetime) -> str:
    """A stored UTC timestamp as ISO text, e.g. 2026-11-11T09:30:00+00:00."""
    return ts.replace(tzinfo=timezone.utc).isoformat()


def _import_sqlite_log(con: duckdb.DuckDBPyConnection, old: Path) -> None:
    """Copy the transfer log from the old SQLite file, once: only while the DuckDB table is still empty.

    Rows go in by id order, so they keep their ids (the old log had no deletes, so its ids run 1..n).
    """
    if not old.exists() or con.execute("select count(*) from transfers").fetchone()[0]:
        return
    with closing(sqlite3.connect(old)) as src:
        try:
            rows = src.execute(f"select {_TRANSFER_COLS} from transfers order by id").fetchall()
        except sqlite3.OperationalError:  # no transfers table in it
            return

    def utc(text: str) -> datetime:
        return datetime.fromisoformat(text).astimezone(timezone.utc).replace(tzinfo=None)

    if rows:
        con.executemany(
            f"insert into transfers ({_TRANSFER_COLS}) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [(utc(r[0]), utc(r[1]), *r[2:]) for r in rows],
        )
