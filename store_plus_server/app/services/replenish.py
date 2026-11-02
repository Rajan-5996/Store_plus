"""When to replenish, and how much: stock-outs timed against the hours in which a product actually sells.

For a store's most-missed products we rebuild a typical day from the data: hourly sales shape (order timestamps), the three
inbound slots (06:00, 15:00, 18:00) and the opening stock. Walking the day hour by hour shows when the shelf runs dry, and
searching the smallest extra delivery that keeps it stocked through the demand peak gives an exact slot and quantity.
"""
import math
from typing import Any

from app.core.db import query
from app.core.filters import Filters
from app.services.common import store_metrics
from app.services.store_detail import normalise_code

ORDER = [*range(6, 24), 0, 1]  # a business day: opens 06:00, last orders just after midnight
SLOTS = {6: "in0600", 15: "in1500", 18: "in1800"}  # inbound delivery slots (start of the hour)
PEAK_HOURS = 3
MAX_ITEMS = 4


def _t(h: int) -> float:
    return h if h >= 6 else h + 24  # position on the business-day clock


def clock(t: float) -> str:
    """12.67 -> '12:40 PM' (business-day clock, so 24.5 is 12:30 AM)."""
    h, m = int(t) % 24, round((t - int(t)) * 60)
    if m == 60:
        h, m = (h + 1) % 24, 0
    return f"{h % 12 or 12}:{m:02d} {'AM' if h < 12 else 'PM'}"


def _hour_label(h: int) -> str:
    return f"{h % 12 or 12} {'AM' if h < 12 else 'PM'}"


def simulate(opening: float, inbound: dict[int, float], demand: dict[int, float]) -> tuple[list[dict[str, float]], float | None, float]:
    """Walk the day: stock after each hour, the clock time it first runs out (or None) and the demand left unserved."""
    stock, rows, runout, unmet = opening, [], None, 0.0
    for h in ORDER:
        stock += inbound.get(h, 0.0)
        need = demand.get(h, 0.0)
        sold = min(stock, need)
        if need > stock + 1e-9 and runout is None:
            runout = _t(h) + (stock / need if need else 0.0)
        unmet += need - sold
        rows.append({"hour": h, "demand": need, "delivery": inbound.get(h, 0.0), "stockStart": stock, "stockEnd": stock - sold})
        stock -= sold
    return rows, runout, unmet


def _shares(sid: int, sku_id: int, f: Filters) -> dict[int, float]:
    rows = query(
        f"select extract(hour from o.order_created_at)::int as h, sum(i.quantity) as units from fact_order_items i "
        f"join fact_orders o using (order_id) where o.store_id = {sid} and i.sku_id = {sku_id} and {f.dates('o.business_date')} "
        f"and o.order_status = 'Delivered' group by 1"
    )
    total = sum(r["units"] for r in rows) or 1
    return {r["h"]: r["units"] / total for r in rows}


def _peak(shares: dict[int, float]) -> tuple[int, float]:
    """The PEAK_HOURS consecutive hours (on the business-day clock) that carry the most sales: (start hour, share)."""
    best = max(range(len(ORDER) - PEAK_HOURS + 1), key=lambda i: sum(shares.get(h, 0) for h in ORDER[i : i + PEAK_HOURS]))
    return ORDER[best], sum(shares.get(h, 0) for h in ORDER[best : best + PEAK_HOURS])


def _extra_needed(opening: float, inbound: dict[int, float], demand: dict[int, float], slot: int, total: float) -> int:
    """Smallest extra delivery at `slot` (rounded up to 5 units) that leaves at most 2% of the day's demand unserved."""
    step = max(1.0, total / 200)
    q = 0.0
    while q <= 3 * total:
        _, _, unmet = simulate(opening, {**inbound, slot: inbound.get(slot, 0.0) + q}, demand)
        if unmet <= 0.02 * total:
            return int(math.ceil(q / 5.0) * 5)
        q += step
    return int(math.ceil(3 * total / 5.0) * 5)


def _uplifts(sid: int, sku_id: int, city_id: int, f: Filters, base: float) -> list[dict[str, Any]]:
    """How much more this product sells on event days, weekends and heavy-rain days, from the store's own history."""
    rows = query(
        f"select i.date, i.sold_qty + i.lost_demand_units as d, c.is_weekend as wk, "
        f"(c.festival_name is not null or c.is_salary_window or c.is_diwali_buildup or c.is_navratri) as ev, coalesce(w.heavy_rain_flag, false) as rain "
        f"from fact_inventory_daily i join dim_calendar c on c.date = i.date left join fact_weather_daily w on w.date = i.date and w.city_id = {city_id} "
        f"where i.store_id = {sid} and i.sku_id = {sku_id} and {f.dates('i.date')}"
    )
    out = []
    for key, label in (("ev", "Festival and salary-window days"), ("wk", "Weekends"), ("rain", "Heavy-rain days")):
        yes = [r["d"] for r in rows if r[key]]
        no = [r["d"] for r in rows if not r[key]]
        if len(yes) >= 3 and len(no) >= 3 and sum(no):
            pct = (sum(yes) / len(yes)) / (sum(no) / len(no)) - 1
            if pct >= 0.08:
                out.append({"label": label, "days": len(yes), "upliftPct": round(100 * pct), "demandDay": round(base * (1 + pct))})
    return out


def _plan_for(sid: int, city_id: int, r: dict[str, Any], f: Filters) -> dict[str, Any] | None:
    days = query(
        f"select opening_qty, inbound_qty_0600 as in0600, inbound_qty_1500 as in1500, inbound_qty_1800 as in1800, "
        f"sold_qty + lost_demand_units as d, oos_minutes, lost_demand_units as lost from fact_inventory_daily "
        f"where store_id = {sid} and sku_id = {r['sku_id']} and {f.dates()}"
    )
    out_days = [x for x in days if (x["oos_minutes"] or 0) > 0] or days
    mean = lambda rows, k: sum((x[k] or 0) for x in rows) / max(len(rows), 1)  # noqa: E731
    shares = _shares(sid, r["sku_id"], f)
    if not shares or not days:
        return None
    opening = mean(out_days, "opening_qty")
    inbound = {h: mean(out_days, k) for h, k in SLOTS.items()}
    total = mean(out_days, "d")
    demand = {h: total * shares.get(h, 0.0) for h in ORDER}
    rows, runout, unmet = simulate(opening, inbound, demand)
    peak_h, peak_share = _peak(shares)
    plan = None
    if runout is not None:
        slot = max((s for s in SLOTS if s <= int(runout) - 1), default=6)
        extra = _extra_needed(opening, inbound, demand, slot, total)
        fixed, _, after = simulate(opening, {**inbound, slot: inbound[slot] + extra}, demand)
        plan = {"slot": f"{slot:02d}:00", "arrives": clock(slot), "extraUnits": extra, "unmetAfter": round(after, 1),
                "curveAfter": [round(x["stockEnd"], 1) for x in fixed]}
    events = _uplifts(sid, r["sku_id"], city_id, f, total)
    if plan:  # how many units the same slot needs on those busier days
        for e in events:
            k = 1 + e["upliftPct"] / 100
            e["extraUnits"] = _extra_needed(opening, inbound, {h: v * k for h, v in demand.items()}, slot, total * k)
    return {
        "sku": r["sku"], "category": r["category"], "lostDay": round(r["lost_day"], 1), "demandDay": round(total),
        "measuredOutMinutes": round(mean([x for x in days if (x["oos_minutes"] or 0) > 0], "oos_minutes")) if any((x["oos_minutes"] or 0) > 0 for x in days) else 0,
        "outDays": sum(1 for x in days if (x["oos_minutes"] or 0) > 0), "days": len(days),
        "peak": {"from": peak_h, "to": (peak_h + PEAK_HOURS) % 24, "fromLabel": _hour_label(peak_h), "toLabel": _hour_label((peak_h + PEAK_HOURS) % 24),
                 "sharePct": round(100 * peak_share)},
        "runsOutAt": clock(runout) if runout is not None else None, "unmetDay": round(unmet, 1), "plan": plan,
        "events": events,
        "curve": [{"hour": x["hour"], "label": _hour_label(x["hour"]), "demand": round(x["demand"], 1), "delivery": round(x["delivery"]),
                   "stock": round(x["stockEnd"], 1), "stockAfter": plan["curveAfter"][i] if plan else round(x["stockEnd"], 1)}
                  for i, x in enumerate(rows)],
    }


def replenishment_for(code: str, f: Filters) -> dict[str, Any] | None:
    norm = normalise_code(code)
    mine = next((s for s in store_metrics(f) if s["code"] == norm), None)
    if not mine:
        return None
    sid = mine["store_id"]
    top = query(
        f"select i.sku_id, k.sku_name as sku, k.l1_category as category, sum(i.lost_demand_units) * 1.0 / {f.days} as lost_day "
        f"from fact_inventory_daily i join dim_sku k using (sku_id) where i.store_id = {sid} and {f.dates('i.date')} "
        f"group by 1, 2, 3 having sum(i.lost_demand_units) > 0 order by lost_day desc limit {MAX_ITEMS}"
    )
    city_id = query(f"select city_id from dim_store where store_id = {sid}")[0]["city_id"]
    items = [p for r in top if (p := _plan_for(sid, city_id, r, f))]
    return {"store": norm, "slots": ["06:00", "15:00", "18:00"], "items": items}
