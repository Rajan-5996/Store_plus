"""The transfer log: moves of orders, stock or staff hours between stores that a user decided to plan, and their status.

Saved in the app's DuckDB store (app/core/store.py) so the log survives restarts.
"""
from typing import Any

from app.core import store


def _row(r: dict[str, Any]) -> dict[str, Any]:
    return {"id": r["id"], "createdAt": store.iso(r["created_at"]), "updatedAt": store.iso(r["updated_at"]), "kind": r["kind"],
            "item": r["item"], "quantity": r["quantity"], "unit": r["unit"], "reason": r["reason"], "status": r["status"],
            "from": {"code": r["from_code"], "area": r["from_area"]}, "to": {"code": r["to_code"], "area": r["to_area"]}}


def list_transfers() -> list[dict[str, Any]]:
    return [_row(r) for r in store.query("select * from transfers order by id desc")]


def add_transfer(t: dict[str, Any]) -> dict[str, Any]:
    """Log a move. Logging the same open move again (same kind, item, from and to) returns the existing entry."""
    with store.lock:  # the duplicate check and the insert must not interleave with another request
        dup = store.query(
            "select * from transfers where status = 'planned' and kind = ? and coalesce(item, '') = ? and from_code = ? and to_code = ?",
            (t["kind"], t.get("item") or "", t["from_code"], t["to_code"]),
        )
        if dup:
            return _row(dup[0])
        now = store.utc_now()
        rows = store.query(
            "insert into transfers (created_at, updated_at, kind, item, quantity, unit, from_code, from_area, to_code, to_area, reason) "
            "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) returning *",
            (now, now, t["kind"], t.get("item"), t["quantity"], t["unit"], t["from_code"], t["from_area"], t["to_code"], t["to_area"],
             t.get("reason", "")),
        )
        return _row(rows[0])


def set_status(transfer_id: int, status: str) -> dict[str, Any] | None:
    rows = store.query("update transfers set status = ?, updated_at = ? where id = ? returning *", (status, store.utc_now(), transfer_id))
    return _row(rows[0]) if rows else None
