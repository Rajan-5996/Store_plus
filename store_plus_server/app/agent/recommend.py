"""Agent-written "Recommended actions" for a dashboard screen or for one store.

One Domo call per (scope, filters), fed with the same DuckDB numbers the page shows, answered as strict JSON.
Results are cached so page loads are instant after the first one; `refresh=True` asks the model again.
"""
import json
import re
import threading
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from app.agent.domo_client import DomoError, make_client
from app.agent.prompt import build_system_from
from app.agent.retrieval import SCREEN_SKILL
from app.agent.settings import get_settings
from app.agent.summaries import SCREENS, dashboard_summary
from app.core.filters import get_filters
from app.services.rebalance import rebalance_for
from app.services.replenish import replenishment_for
from app.services.store_detail import normalise_code, store_detail

TTL_S = 1800
_cache: dict[tuple, tuple[float, dict]] = {}
_locks: dict[tuple, threading.Lock] = defaultdict(threading.Lock)

RULES = """You write the "Recommended actions" panel of the StorePulse AI dashboard for a quick-commerce dark-store network.
Use ONLY the figures in DATA. Never invent numbers, store codes or names.
Reply with ONE JSON object and nothing else (no markdown, no code fences, no commentary):
{"actions":[{"title":"...","why":"...","impact":"...","priority":"high","stores":["#524"]}]}
- {count} actions, ordered by expected impact.
- title: imperative, at most 8 words.
- why: at most 22 words, plain language, citing figures from DATA.
- impact: at most 9 words; a quantified effect (rupees/day, orders/day, %) only if DATA supports it, otherwise "to be sized".
- priority: "high", "medium" or "low".
- stores: store codes (like #524) from DATA that the action targets; [] when it is network-wide.
- If DATA has rebalanceMoves, turn the best ones into actions that name the FROM and TO store, the amount and the unit.
- If DATA has replenishment, every stock action must give the delivery slot and clock time, the extra units, and the demand peak it protects (for example: add 40 units to the 6 PM slot before the 6-9 PM peak).
Currency is INR; write large amounts in lakh/crore (for example ₹2.9L). Data is synthetic, 1 Aug to 31 Oct 2026.
Domain guidance (follow its severity rules and guardrails; ignore mentions of tools and output formats):
{skills}"""


class ActionsError(RuntimeError):
    """The model did not return usable actions."""


def _parse(text: str) -> list[dict[str, Any]]:
    """Pull the JSON object out of the reply (tolerating fences or chatter) and validate each action."""
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        raise ActionsError("The model did not return JSON.")
    try:
        raw = json.loads(text[start : end + 1]).get("actions", [])
    except (ValueError, AttributeError) as e:
        raise ActionsError("The model returned malformed JSON.") from e
    out = []
    for a in raw if isinstance(raw, list) else []:
        if not isinstance(a, dict) or not str(a.get("title", "")).strip():
            continue
        prio = str(a.get("priority", "medium")).lower()
        stores = a.get("stores") if isinstance(a.get("stores"), list) else []
        out.append({
            "title": str(a["title"]).strip()[:120],
            "why": str(a.get("why", "")).strip()[:300],
            "impact": str(a.get("impact", "")).strip()[:120],
            "priority": prio if prio in ("high", "medium", "low") else "medium",
            "stores": [c for c in dict.fromkeys(re.findall(r"#\d{3}", " ".join(map(str, stores))))][:4],
        })
    if not out:
        raise ActionsError("The model returned no actions.")
    return out[:5]


def _generate(scope: str, data: dict, skills: list[str], count: str = "3 to 5") -> dict[str, Any]:
    client = make_client()
    system = build_system_from(RULES.replace("{count}", count), skills)
    prompt = f"=== DATA ({scope}) ===\n{json.dumps(data, default=str, separators=(',', ':'))[:14000]}\n\n=== FORMAT: JSON ===\nReturn the JSON object now."
    last: ActionsError | None = None
    for _ in range(2):  # one retry if the reply is not valid JSON
        try:
            actions = _parse(client.generate(prompt, system))
            return {"actions": actions, "source": "mock" if get_settings().use_mock else "domo",
                    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds")}
        except ActionsError as e:
            last = e
            prompt += "\n\nYour last reply was not valid JSON. Reply with the JSON object only."
    raise last or ActionsError("No actions.")


def _cached(key: tuple, refresh: bool, build) -> dict[str, Any]:
    with _locks[key]:  # concurrent page loads share one model call
        hit = _cache.get(key)
        if hit and not refresh and time.time() - hit[0] < TTL_S:
            return hit[1]
        result = build()
        _cache[key] = (time.time(), result)
        return result


def screen_actions(screen: str, city: str = "all", range: str = "30d", refresh: bool = False) -> dict[str, Any]:
    if screen not in SCREENS:
        raise ActionsError(f"Unknown screen '{screen}'.")
    key = ("screen", "v2", screen, city.lower(), range, get_settings().use_mock)
    return _cached(key, refresh, lambda: _generate(f"{screen} screen, city {city}, {range}", dashboard_summary(screen, city, range), [SCREEN_SKILL[screen]]))


def _compact_store(d: dict[str, Any], moves: list[dict[str, Any]], replenish: list[dict[str, Any]]) -> dict[str, Any]:
    s = d["series"]
    week = lambda xs, a, b: round(sum(xs[a:b]) / max(len(xs[a:b]), 1), 1)  # noqa: E731
    hours = sorted(d["hourly"], key=lambda h: -(h["queue_min"] or 0))[:2]
    return {
        "store": d["store"], "range": d["range"], "kpis": d["kpis"], "peers": d["peers"], "cause": d["cause"],
        "costsPerDay": d["costs"], "ops": d["ops"], "funnel": d["funnel"], "stock": d["stock"], "topCategories": d["mix"][:5],
        "nearbyStores": d["nearby"], "rebalanceMoves": moves, "replenishment": replenish,
        "trend": {"ordersDayFirst7": week(s["orders"], 0, 7), "ordersDayLast7": week(s["orders"], -7, None),
                  "pnlDayFirst7": week(s["pnl"], 0, 7), "pnlDayLast7": week(s["pnl"], -7, None)},
        "slowestHours": [{"hour": h["hour"], "queueMin": h["queue_min"], "lostOrdersDay": h["lost"]} for h in hours],
    }


def _timing(code: str, f) -> list[dict[str, Any]]:
    """The replenishment plans without the hourly curves, small enough for the prompt."""
    out = (replenishment_for(code, f) or {}).get("items", [])
    return [{k: v for k, v in it.items() if k != "curve"} for it in out[:3]]


def store_actions(code: str, range: str = "30d", refresh: bool = False) -> dict[str, Any]:
    norm = normalise_code(code)
    f = get_filters(city="all", range=range)
    detail = store_detail(code, f) if norm else None
    if not detail:
        raise ActionsError(f"Unknown store '{code}'.")
    key = ("store", "v3", norm, range, get_settings().use_mock)
    skills = [detail["cause"]["skill"], "store-profitability"]
    return _cached(key, refresh, lambda: _generate(f"store {norm}, {range}", _compact_store(detail, (rebalance_for(norm, f) or {}).get("moves", []), _timing(norm, f)), list(dict.fromkeys(skills)), "3 to 4"))


__all__ = ["ActionsError", "DomoError", "screen_actions", "store_actions"]
