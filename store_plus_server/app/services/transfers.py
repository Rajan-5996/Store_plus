"""The transfer log: moves of orders, stock or staff hours between stores that a user decided to plan, and their status.

Kept in a small SQLite file (storage/transfers.db, git-ignored) so the log survives restarts.
"""
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parents[2] / "storage" / "transfers.db"
STATUSES = ("planned", "done", "cancelled")

_SCHEMA = """
create table if not exists transfers (
  id integer primary key autoincrement, created_at text not null, kind text not null, item text, quantity real not null,
  unit text not null, from_code text not null, from_area text not null, to_code text not null, to_area text not null,
  reason text not null default '', status text not null default 'planned', updated_at text not null
)"""


def _con() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute(_SCHEMA)
    return con


def _row(r: sqlite3.Row) -> dict[str, Any]:
    return {"id": r["id"], "createdAt": r["created_at"], "updatedAt": r["updated_at"], "kind": r["kind"], "item": r["item"],
            "quantity": r["quantity"], "unit": r["unit"], "reason": r["reason"], "status": r["status"],
            "from": {"code": r["from_code"], "area": r["from_area"]}, "to": {"code": r["to_code"], "area": r["to_area"]}}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def list_transfers() -> list[dict[str, Any]]:
    with _con() as con:
        return [_row(r) for r in con.execute("select * from transfers order by id desc")]


def add_transfer(t: dict[str, Any]) -> dict[str, Any]:
    """Log a move. Logging the same open move again (same kind, item, from and to) returns the existing entry."""
    with _con() as con:
        dup = con.execute(
            "select * from transfers where status = 'planned' and kind = ? and coalesce(item, '') = ? and from_code = ? and to_code = ?",
            (t["kind"], t.get("item") or "", t["from_code"], t["to_code"]),
        ).fetchone()
        if dup:
            return _row(dup)
        now = _now()
        cur = con.execute(
            "insert into transfers (created_at, kind, item, quantity, unit, from_code, from_area, to_code, to_area, reason, status, updated_at) "
            "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned', ?)",
            (now, t["kind"], t.get("item"), t["quantity"], t["unit"], t["from_code"], t["from_area"], t["to_code"], t["to_area"],
             t.get("reason", ""), now),
        )
        return _row(con.execute("select * from transfers where id = ?", (cur.lastrowid,)).fetchone())


def set_status(transfer_id: int, status: str) -> dict[str, Any] | None:
    with _con() as con:
        con.execute("update transfers set status = ?, updated_at = ? where id = ?", (status, _now(), transfer_id))
        r = con.execute("select * from transfers where id = ?", (transfer_id,)).fetchone()
        return _row(r) if r else None
