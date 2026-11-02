"""Agent tests: run offline against the real parquet data, with the Domo AI client mocked (no token, no network)."""
import httpx
import pytest

from app.agent import domo_client, engine
from app.agent.retrieval import build_context, pick_screens
from app.agent.sql_guard import check_sql
from app.core.db import init_db


@pytest.fixture(scope="module", autouse=True)
def database():
    init_db()


@pytest.fixture
def mock_mode(monkeypatch):
    monkeypatch.setenv("DOMO_MOCK", "1")


def test_sql_guard_allows_select_and_blocks_the_rest():
    assert check_sql("select count(*) from store_day") is None
    for bad in ["drop table store_day", "select * from read_csv('x.csv')", "select 1; select 2", "copy store_day to 'x'"]:
        assert check_sql(bad)


def test_screens_follow_the_question_and_page():
    assert pick_screens("which stores have stock-outs?", None)[0] == "inventory"
    assert "profitability" in pick_screens("why are we losing money", "overview")
    assert pick_screens("hello", "network") == ["network"]
    assert pick_screens("hello", None) == ["overview"]


def test_store_question_feeds_store_data():
    ctx = build_context("Why is store #524 losing money?", "overview")
    assert any("Store #524" in title for title, _ in ctx.sections)
    assert "store_profile" in ctx.tools and "store-profitability" in ctx.skills


def test_engine_answers_in_mock_mode(mock_mode):
    events = list(engine.ask_stream("How many stores are above break-even?", "t-mock", "overview"))
    kinds = [e["type"] for e in events]
    assert kinds[0] == "step" and kinds[-1] == "answer"
    assert "Demo mode" in events[-1]["answer"]


def test_engine_runs_sql_the_model_asks_for(mock_mode):
    events = list(engine.ask_stream("sql: select count(*) as n from store_day", "t-sql"))
    assert events[-1]["type"] == "answer" and "run_sql" in events[-1]["tools"]
    assert "3066" in events[-1]["answer"]


def test_domo_request_shape(monkeypatch):
    monkeypatch.setenv("DOMO_INSTANCE", "acme")
    monkeypatch.setenv("DOMO_DEVELOPER_TOKEN", "tok")
    monkeypatch.setenv("DOMO_MOCK", "0")
    seen = {}

    def fake_post(url, json, headers, timeout):
        seen.update(url=url, json=json, headers=headers)
        return httpx.Response(200, json={"output": "hello", "modelId": "m"})

    monkeypatch.setattr(domo_client.httpx, "post", fake_post)
    assert domo_client.make_client().generate("hi", system="be brief") == "hello"
    assert seen["url"] == "https://acme.domo.com/api/ai/v1/text/generation"
    assert seen["headers"]["X-DOMO-Developer-Token"] == "tok"
    assert seen["json"] == {"input": "hi", "system": "be brief"}


def test_domo_auth_failure_is_reported(monkeypatch):
    monkeypatch.setenv("DOMO_INSTANCE", "acme")
    monkeypatch.setenv("DOMO_DEVELOPER_TOKEN", "bad")
    monkeypatch.setenv("DOMO_MOCK", "0")
    monkeypatch.setattr(domo_client.httpx, "post", lambda *a, **k: httpx.Response(401, json={}))
    events = list(engine.ask_stream("hi", "t-auth"))
    assert events[-1]["type"] == "error" and "token" in events[-1]["message"]


def test_sql_found_after_narration_and_result_tables_dropped():
    from app.agent.answer import clean_answer, requested_sql

    reply = (
        "I'll start with the worst stores.\n\nSQL: SELECT store_id FROM dim_store\n\n"
        "<details><summary>SQL Result</summary>\nstore_id\n24\n</details>\nSQL: SELECT 2"
    )
    assert requested_sql(reply) == "SELECT store_id FROM dim_store"
    final = "Let me check.\n\nSQL: select 1\n\n<details>x</details>\n\n## Verdict\n#524 loses ₹52K/day"
    out = clean_answer(final)
    assert out.startswith("## Verdict") and "SQL" not in out and "details" not in out
    assert requested_sql("## Verdict\nAll good") is None
    assert clean_answer("Plain **answer**") == "Plain **answer**"


def test_actions_json_is_parsed_and_sanitised():
    import pytest

    from app.agent.recommend import ActionsError, _parse

    reply = 'Sure!\n```json\n{"actions":[{"title":"Cut staff","why":"x","impact":"","priority":"URGENT","stores":["#524 and #525","bad"]},{"why":"no title"}]}\n```'
    out = _parse(reply)
    assert len(out) == 1 and out[0]["priority"] == "medium" and out[0]["stores"] == ["#524", "#525"]
    with pytest.raises(ActionsError):
        _parse("no json here")


def test_store_detail_and_actions_in_mock_mode(monkeypatch):
    from app.agent.recommend import store_actions
    from app.core.db import init_db
    from app.core.filters import get_filters
    from app.services.store_detail import normalise_code, store_detail

    monkeypatch.setenv("DOMO_MOCK", "1")
    init_db()
    assert normalise_code(" 524 ") == "#524" and normalise_code("abc") is None
    d = store_detail("524", get_filters(city="all", range="30d"))
    assert d and d["store"]["code"] == "#524" and len(d["series"]["dates"]) == 30 and d["costs"]
    assert store_detail("999", get_filters(city="all", range="30d")) is None
    out = store_actions("524", "30d", refresh=True)
    assert out["source"] == "mock" and out["actions"]


def test_rebalance_moves_do_not_double_count(monkeypatch):
    from app.core.db import init_db
    from app.core.filters import get_filters
    from app.services.rebalance import rebalance_for

    init_db()
    f = get_filters(city="all", range="30d")
    out = rebalance_for("740", f)
    assert out and out["store"] == "#740"
    sent = [m for m in out["moves"] if m["kind"] == "Demand" and m["from"]["code"] == "#740"]
    lost = 29  # #740 loses ~29 orders/day to busy mode; the shares sent to neighbours must add up to at most that
    assert sent and sum(m["amount"] for m in sent) <= lost + 1
    assert all(m["from"]["code"] != m["to"]["code"] for m in out["moves"])
    assert not any(m["kind"] == "Demand" and m["to"]["code"] == "#740" for m in out["moves"])  # a constrained store does not also receive
    assert rebalance_for("999", f) is None


def test_transfer_log_roundtrip(tmp_path, monkeypatch):
    from app.services import transfers

    monkeypatch.setattr(transfers, "DB_PATH", tmp_path / "t.db")
    move = {"kind": "Stock", "item": "Tomato 1 kg", "quantity": 8, "unit": "units", "from_code": "#740", "from_area": "Kondapur",
            "to_code": "#744", "to_area": "Kukatpally", "reason": "stock-out"}
    first = transfers.add_transfer(move)
    assert first["status"] == "planned" and first["from"]["code"] == "#740" and first["item"] == "Tomato 1 kg"
    assert transfers.add_transfer(move)["id"] == first["id"]  # logging the same open move twice does not duplicate it
    assert transfers.set_status(first["id"], "done")["status"] == "done"
    assert len(transfers.list_transfers()) == 1 and transfers.set_status(999, "done") is None
    assert transfers.add_transfer(move)["id"] != first["id"]  # once done, the same move can be logged again


def test_replenishment_timing_matches_the_data():
    from app.core.db import init_db
    from app.core.filters import get_filters
    from app.services.replenish import clock, replenishment_for, simulate

    assert clock(19.5) == "7:30 PM" and clock(24.5) == "12:30 AM"
    rows, runout, unmet = simulate(10, {6: 0, 15: 0, 18: 0}, {6: 4, 7: 4, 8: 4})  # 10 units, 12 wanted
    assert runout is not None and 8 <= runout < 9 and round(unmet) == 2 and rows[-1]["stockEnd"] == 0

    init_db()
    out = replenishment_for("740", get_filters(city="all", range="30d"))
    assert out and out["items"], "store 740 has stock-outs, so there is something to time"
    it = out["items"][0]
    assert it["runsOutAt"] and it["plan"] and it["plan"]["extraUnits"] > 0 and it["plan"]["slot"] in ("06:00", "15:00", "18:00")
    assert it["plan"]["unmetAfter"] <= 0.03 * it["demandDay"] + 1  # the plan really keeps the shelf stocked
    assert replenishment_for("999", get_filters(city="all", range="30d")) is None
