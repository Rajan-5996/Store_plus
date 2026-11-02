"""Everything the store page shows for one store: economics, trend, costs, capacity, funnel, stock, mix, neighbours."""
import math
import re
from statistics import median
from typing import Any

from app.core.db import query
from app.core.filters import Filters
from app.services.common import store_metrics
from app.services.network import NEAR_BREAKEVEN

CAUSE_SKILL = {
    "Stock-out": "inventory-intelligence",
    "Weak demand": "store-utilisation",
    "Picking queue": "operational-efficiency",
    "Overlap": "network-optimisation",
}


def normalise_code(code: str) -> str | None:
    """'524', '#524' or ' 524 ' -> '#524'."""
    m = re.fullmatch(r"#?\s*(\d{3})", code.strip())
    return f"#{m.group(1)}" if m else None


def status_of(pnl_day: float) -> str:
    return "profit" if pnl_day > NEAR_BREAKEVEN else "mid" if pnl_day > -NEAR_BREAKEVEN else "loss"


def _km(a: dict, b: dict) -> float:
    dlat, dlng = (a["lat"] - b["lat"]) * 111.0, (a["lng"] - b["lng"]) * 111.0 * math.cos(math.radians(a["lat"]))
    return math.hypot(dlat, dlng)


def store_list(f: Filters) -> list[dict[str, Any]]:
    """One light row per store, for search and pickers."""
    return [
        {"code": s["code"], "area": s["area"], "city": s["city"], "ordersDay": round(s["orders_day"]),
         "pnlDay": round(s["pnl_day"]), "status": status_of(s["pnl_day"])}
        for s in store_metrics(f)
    ]


def _peers(mine: dict, everyone: list[dict]) -> dict[str, Any]:
    same = [s for s in everyone if s["format"] == mine["format"]]
    med = lambda rows, k: round(median(r[k] for r in rows), 2) if rows else None  # noqa: E731
    ranked = sorted(everyone, key=lambda s: s["pnl_day"])
    return {
        "network": {"ordersDay": med(everyone, "orders_day"), "cpo": med(everyone, "cpo"), "pnlDay": med(everyone, "pnl_day"),
                    "opexDay": med(everyone, "opex_day"), "stores": len(everyone)},
        "format": {"name": mine["format"], "ordersDay": med(same, "orders_day"), "cpo": med(same, "cpo"),
                   "pnlDay": med(same, "pnl_day"), "opexDay": med(same, "opex_day"), "stores": len(same)},
        "rankFromWorst": next(i for i, s in enumerate(ranked, 1) if s["store_id"] == mine["store_id"]),
    }


def _series(sid: int, f: Filters) -> dict[str, Any]:
    rows = query(
        f"select date::varchar as d, delivered, (margin + fees + ad - var_cost - wastage - opex) as pnl "
        f"from store_day where store_id = {sid} and {f.dates()} order by date"
    )
    return {"dates": [r["d"] for r in rows], "orders": [r["delivered"] or 0 for r in rows],
            "pnl": [round(r["pnl"] or 0) for r in rows]}


def _hourly(sid: int, f: Filters) -> list[dict[str, Any]]:
    return query(
        f"select hour, round(sum(orders_accepted) * 1.0 / count(distinct date), 1) as orders, "
        f"round(sum(processing_capacity_orders) / count(distinct date), 1) as capacity, "
        f"round(sum(orders_lost_busy_mode) * 1.0 / count(distinct date), 2) as lost, "
        f"round(avg(avg_pick_queue_wait_min), 2) as queue_min from fact_store_hourly_ops "
        f"where store_id = {sid} and {f.dates()} group by hour order by hour"
    )


def _ops(sid: int, f: Filters) -> dict[str, Any]:
    r = (query(
        f"select round(sum(orders_accepted) * 1.0 / nullif(sum(processing_capacity_orders), 0), 3) as util, "
        f"round(sum(busy_mode_minutes) / count(distinct date), 1) as busy_min, "
        f"round(sum(orders_lost_busy_mode) * 1.0 / count(distinct date), 1) as lost_day, "
        f"round(avg(avg_pick_queue_wait_min), 2) as queue_min, round(avg(pickers_on_floor), 1) as pickers, "
        f"round(avg(packers_on_floor), 1) as packers from fact_store_hourly_ops where store_id = {sid} and {f.dates()}"
    ) or [{}])[0]
    return {"utilisation": r.get("util"), "busyMinDay": r.get("busy_min"), "lostOrdersDay": r.get("lost_day"),
            "queueMin": r.get("queue_min"), "pickers": r.get("pickers"), "packers": r.get("packers")}


def _funnel(sid: int, f: Filters) -> dict[str, Any]:
    r = (query(
        f"select sum(app_sessions) as sessions, sum(add_to_cart_sessions) as cart, sum(checkout_sessions) as checkout, "
        f"sum(orders_placed) as placed, sum(orders_abandoned_oos) as oos, sum(orders_lost_busy_mode) as busy "
        f"from fact_store_sessions_daily where store_id = {sid} and {f.dates()}"
    ) or [{}])[0]
    sessions = r.get("sessions") or 0
    return {"sessions": sessions, "addToCart": r.get("cart") or 0, "checkout": r.get("checkout") or 0, "orders": r.get("placed") or 0,
            "lostStockout": r.get("oos") or 0, "lostBusy": r.get("busy") or 0,
            "conversion": round((r.get("placed") or 0) / sessions, 4) if sessions else None}


def _stock(sid: int, f: Filters) -> dict[str, Any]:
    out = query(
        f"select k.sku_name as sku, k.l1_category as category, sum(i.lost_demand_units) as lost_units, "
        f"count(*) filter (where i.oos_minutes > 0) as oos_days from fact_inventory_daily i join dim_sku k using (sku_id) "
        f"where i.store_id = {sid} and {f.dates('i.date')} group by 1, 2 order by lost_units desc limit 6"
    )
    waste = query(
        f"select reason, round(sum(value_at_cost_inr)) as value from fact_wastage where store_id = {sid} and {f.dates()} "
        f"group by 1 order by 2 desc"
    )
    return {"topStockouts": out, "wastage": waste, "wastageTotal": sum(w["value"] or 0 for w in waste)}


def _mix(sid: int, f: Filters) -> list[dict[str, Any]]:
    rows = query(
        f"select k.l1_category as category, sum(s.revenue) as revenue, sum(s.revenue - s.cost) as margin "
        f"from sku_day s join dim_sku k using (sku_id) where s.store_id = {sid} and {f.dates('s.date')} "
        f"group by 1 order by revenue desc"
    )
    total = sum(r["revenue"] or 0 for r in rows) or 1
    return [{"category": r["category"], "share": round(r["revenue"] / total, 4),
             "marginPct": round(100 * r["margin"] / r["revenue"], 1) if r["revenue"] else 0} for r in rows]


def _nearby(mine: dict, everyone: list[dict]) -> list[dict[str, Any]]:
    near = sorted(((_km(mine, s), s) for s in everyone if s["store_id"] != mine["store_id"]), key=lambda t: t[0])
    return [{"code": s["code"], "area": s["area"], "km": round(km, 1), "ordersDay": round(s["orders_day"]),
             "pnlDay": round(s["pnl_day"])} for km, s in near if km <= 15][:4]


def store_detail(code: str, f: Filters) -> dict[str, Any] | None:
    """The full store view (without AI actions), or None when the code is unknown."""
    norm = normalise_code(code)
    everyone = store_metrics(f)
    mine = next((s for s in everyone if s["code"] == norm), None)
    if not mine:
        return None
    sid, days = mine["store_id"], mine["days"] or 1
    before = next((s for s in store_metrics(f, prev=True) if s["store_id"] == sid), None)
    scores = sorted(mine["cause_scores"].items(), key=lambda kv: -kv[1])
    top = max(v for _, v in scores) or 1
    be = mine["breakeven"]
    return {
        "range": {"start": str(f.start), "end": str(f.end), "days": f.days},
        "store": {"code": mine["code"], "area": mine["area"], "city": mine["city"], "cityCode": mine["city_code"],
                  "format": mine["format"], "status": status_of(mine["pnl_day"]), "operating": mine["status"],
                  "launchDate": str(mine["launch_date"]), "areaSqft": mine["area_sqft"], "lat": mine["lat"], "lng": mine["lng"]},
        "kpis": {"ordersDay": mine["orders_day"], "ordersDeltaPct": (100 * (mine["orders_day"] / before["orders_day"] - 1)) if before and before["orders_day"] else None,
                 "pnlDay": mine["pnl_day"], "pnlDeltaDay": (mine["pnl_day"] - before["pnl_day"]) if before else None,
                 "cpo": mine["cpo"], "opexDay": mine["opex_day"], "breakEvenOrders": be,
                 "gapOrders": (be - mine["orders_day"]) if be else None, "cmPct": mine["cm_pct"],
                 "aov": mine["gov"] / mine["delivered"] if mine["delivered"] else None},
        "peers": _peers(mine, everyone),
        "cause": {"label": mine["cause"], "skill": CAUSE_SKILL[mine["cause"]],
                  "scores": [{"label": k, "pct": round(100 * v / top), "value": round(v, 2)} for k, v in scores]},
        "costs": [{"label": k, "perDay": round(mine[c] / days), "pct": round(100 * mine[c] / mine["opex"], 1) if mine["opex"] else 0}
                  for k, c in (("Staff", "staff"), ("Rent", "rent"), ("Electricity", "elec"), ("Other operating", "other_opex"))],
        "series": _series(sid, f), "hourly": _hourly(sid, f), "ops": _ops(sid, f), "funnel": _funnel(sid, f),
        "stock": _stock(sid, f), "mix": _mix(sid, f), "nearby": _nearby(mine, everyone),
    }
