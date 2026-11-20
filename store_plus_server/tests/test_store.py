"""The saved app state (app/core/store.py): transfer log and chat history in a DuckDB file."""
import sqlite3

import pytest

from app.agent.history import recent_turns, save_turn
from app.core import store
from app.services import transfers

MOVE = {"kind": "Stock", "item": "Tomato 1 kg", "quantity": 8, "unit": "units", "from_code": "#740", "from_area": "Kondapur",
        "to_code": "#744", "to_area": "Kukatpally", "reason": "stock-out"}


def test_transfers_and_chat_survive_a_restart(tmp_path):
    path = tmp_path / "storepulse.duckdb"
    store.open_store(path)
    t = transfers.add_transfer(MOVE)
    transfers.set_status(t["id"], "done")
    for i in range(5):
        save_turn("thread-a", "overview", f"q{i}", f"a{i}", ["store_profile"])
    save_turn("thread-b", None, "other", "chat", [])
    store.close_store()

    store.open_store(path)  # as after a server restart
    [saved] = transfers.list_transfers()
    assert saved["id"] == t["id"] and saved["status"] == "done" and saved["createdAt"] == t["createdAt"]
    assert saved["createdAt"].endswith("+00:00")
    assert recent_turns("thread-a", 4) == [("q1", "a1"), ("q2", "a2"), ("q3", "a3"), ("q4", "a4")]  # last 4, oldest first
    assert recent_turns("thread-b", 4) == [("other", "chat")] and recent_turns("nobody", 4) == []
    assert transfers.add_transfer(MOVE)["id"] == t["id"] + 1  # ids keep counting after a restart


def test_history_lists_opens_and_deletes_conversations():
    from app.agent.history import delete_thread, list_threads, thread_turns

    save_turn("old", "overview", "Which stores lose money?", "#524 and #610", ["dashboard_summary"])
    save_turn("new", None, "How is Pune doing?", "Fine", [])
    save_turn("old", "overview", "Why #524?", "Rent", ["store_profile"])  # "old" is now the most recently active
    listed = list_threads()
    assert [(t["id"], t["title"], t["questions"]) for t in listed] == [("old", "Which stores lose money?", 2), ("new", "How is Pune doing?", 1)]
    assert listed[0]["updatedAt"].endswith("+00:00")
    turns = thread_turns("old")
    assert [(t["question"], t["tools"], t["screen"]) for t in turns] == [
        ("Which stores lose money?", ["dashboard_summary"], "overview"), ("Why #524?", ["store_profile"], "overview")]
    assert thread_turns("nobody") == []
    assert delete_thread("old") == 2 and delete_thread("old") == 0
    assert [t["id"] for t in list_threads()] == ["new"] and recent_turns("old", 4) == []


def test_invalid_status_is_refused_by_the_table():
    t = transfers.add_transfer(MOVE)
    with pytest.raises(Exception, match="(?i)check"):
        transfers.set_status(t["id"], "lost")


def test_old_sqlite_log_is_imported_once(tmp_path):
    old = sqlite3.connect(tmp_path / "transfers.db")
    old.execute(
        "create table transfers (id integer primary key autoincrement, created_at text not null, kind text not null, item text, "
        "quantity real not null, unit text not null, from_code text not null, from_area text not null, to_code text not null, "
        "to_area text not null, reason text not null default '', status text not null default 'planned', updated_at text not null)"
    )
    for status in ("done", "planned"):
        old.execute(
            "insert into transfers (created_at, kind, item, quantity, unit, from_code, from_area, to_code, to_area, reason, status, updated_at) "
            "values ('2026-11-05T10:00:00+00:00', 'Stock', 'Milk', 5, 'units', '#740', 'Kondapur', '#744', 'Kukatpally', '', ?, "
            "'2026-11-06T08:30:00+00:00')",
            (status,),
        )
    old.commit()
    old.close()

    path = tmp_path / "storepulse.duckdb"
    store.open_store(path)
    rows = transfers.list_transfers()
    assert [(r["id"], r["status"]) for r in rows] == [(2, "planned"), (1, "done")]
    assert rows[0]["createdAt"] == "2026-11-05T10:00:00+00:00" and rows[0]["updatedAt"] == "2026-11-06T08:30:00+00:00"
    assert transfers.add_transfer({**MOVE, "item": "Bread"})["id"] == 3
    store.close_store()

    store.open_store(path)  # the next start does not import the rows again
    assert len(transfers.list_transfers()) == 3
