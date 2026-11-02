"""Rebalancing moves around one store: which nearby store should send demand, staff hours or stock to which.

Every move is computed from the data (hourly capacity and lost orders, staff cost per order, SKU cover days), never guessed.
"""
import math
from statistics import median
from typing import Any

from app.core.db import query
from app.core.filters import Filters
from app.services.common import store_metrics
from app.services.store_detail import normalise_code

RADIUS_KM = 12.0  # how far demand or stock can realistically be redirected
MIN_LOST = 3.0  # orders/day lost to busy mode before a store counts as constrained
SPARE_UTIL = 0.75  # staffed utilisation below this means spare capacity


def _km(a: dict, b: dict) -> float:
    return math.hypot((a["lat"] - b["lat"]) * 111.0, (a["lng"] - b["lng"]) * 111.0 * math.cos(math.radians(a["lat"])))


def _hourly(ids: list[int], f: Filters) -> dict[int, dict[int, dict[str, float]]]:
    """store -> hour -> average orders, capacity and lost orders per day."""
    rows = query(
        f"select store_id, hour, sum(orders_accepted) * 1.0 / count(distinct date) as acc, "
        f"sum(processing_capacity_orders) / count(distinct date) as cap, "
        f"sum(orders_lost_busy_mode) * 1.0 / count(distinct date) as lost, avg(busy_mode_minutes) as busy "
        f"from fact_store_hourly_ops where store_id in ({','.join(map(str, ids))}) and {f.dates()} group by 1, 2"
    )
    out: dict[int, dict[int, dict[str, float]]] = {}
    for r in rows:
        out.setdefault(r["store_id"], {})[r["hour"]] = {k: float(r[k] or 0) for k in ("acc", "cap", "lost", "busy")}
    return out


def _totals(hours: dict[int, dict[str, float]]) -> dict[str, float]:
    acc, cap = sum(h["acc"] for h in hours.values()), sum(h["cap"] for h in hours.values())
    return {"lost": sum(h["lost"] for h in hours.values()), "util": acc / cap if cap else 0.0,
            "busy": sum(h["busy"] for h in hours.values())}


def _allocate(pool: dict[int, float], rooms: list[tuple[Any, dict[int, float]]]) -> list[tuple[Any, float]]:
    """Share per-hour `pool` (orders to place) across partners, nearest first, each limited by its own per-hour room.

    Both sides are consumed, so the same order is never counted for two partners.
    """
    pool = dict(pool)
    out = []
    for key, room in rooms:
        moved = 0.0
        for hr in list(pool):
            take = min(pool[hr], room.get(hr, 0.0))
            pool[hr] -= take
            room[hr] = room.get(hr, 0.0) - take
            moved += take
        out.append((key, moved))
    return out


def _allocate_donors(donors: list[tuple[float, dict]], hours: dict, spare: dict[int, float]) -> list[tuple[tuple[float, dict], float]]:
    out = []
    for km, s in donors:
        pool = {hr: h["lost"] for hr, h in hours.get(s["store_id"], {}).items()}
        moved = 0.0
        for hr, lost in pool.items():
            take = min(lost, spare.get(hr, 0.0))
            spare[hr] = spare.get(hr, 0.0) - take
            moved += take
        out.append(((km, s), moved))
    return out


def _spare(hours: dict[int, dict[str, float]]) -> dict[int, float]:
    return {hr: max(0.0, h["cap"] - h["acc"]) for hr, h in hours.items()}


def _hour(h: int) -> str:
    return f"{h % 12 or 12} {'AM' if h < 12 else 'PM'}"


def _peak_hours(hours: dict[int, dict[str, float]], n: int = 3) -> str:
    """The hours in which a store loses the most orders, for example '7 PM, 8 PM, 9 PM'."""
    top = sorted((hr for hr, h in hours.items() if h["lost"] > 0), key=lambda hr: -hours[hr]["lost"])[:n]
    return ", ".join(_hour(hr) for hr in sorted(top)) or "busy hours"


def _inr(v: float) -> str:
    return f"₹{v / 1000:.1f}K" if abs(v) >= 1000 else f"₹{v:.0f}"


def _stock(sid: int, near: list[dict], f: Filters) -> list[dict[str, Any]]:
    """SKU-level transfers between the store and nearby stores: stock-outs on one side, surplus cover on the other."""
    ids = [sid, *(n["store_id"] for n in near)]
    rows = query(
        f"select i.store_id, i.sku_id, k.sku_name as sku, k.base_selling_price - k.cost_price as unit_margin, "
        f"sum(i.lost_demand_units) * 1.0 / {f.days} as lost_day, avg(i.sold_qty) as sold_day, "
        f"max(i.closing_qty) filter (where i.date = date '{f.end}') as closing "
        f"from fact_inventory_daily i join dim_sku k using (sku_id) where i.store_id in ({','.join(map(str, ids))}) "
        f"and {f.dates('i.date')} group by 1, 2, 3, 4"
    )
    by: dict[int, dict[int, dict]] = {}
    for r in rows:
        by.setdefault(r["store_id"], {})[r["sku_id"]] = r
    meta = {n["store_id"]: n for n in near}
    moves: list[dict[str, Any]] = []

    def surplus(r: dict) -> float:
        return (r["closing"] or 0) - 3 * (r["sold_day"] or 0)  # the sender keeps three days of cover

    def move(direction: str, donor: dict, receiver: dict, other: dict, units: int) -> dict[str, Any]:
        return {"direction": direction, "other": other, "sku": donor["sku"], "units": units, "donor": donor, "receiver": receiver}

    mine = by.get(sid, {})
    for sku, r in sorted(mine.items(), key=lambda kv: -(kv[1]["lost_day"] or 0)):  # S is short, a neighbour has surplus
        if (r["lost_day"] or 0) < 1:
            break
        best = max(((surplus(by[n["store_id"]][sku]), n) for n in near if sku in by.get(n["store_id"], {})
                    and (by[n["store_id"]][sku]["lost_day"] or 0) < 0.5), key=lambda t: t[0], default=None)
        if best and best[0] >= 5:
            units = min(math.ceil(r["lost_day"] * 3), int(best[0]))
            moves.append(move("in", by[best[1]["store_id"]][sku], r, best[1], units))
    for sku, r in mine.items():  # S has surplus, a neighbour is short
        if surplus(r) < 20:
            continue
        short = max(((by[n["store_id"]][sku]["lost_day"] or 0, n) for n in near if sku in by.get(n["store_id"], {})),
                    key=lambda t: t[0], default=None)
        if short and short[0] >= 1:
            moves.append(move("out", r, by[short[1]["store_id"]][sku], short[1], min(math.ceil(short[0] * 3), int(surplus(r)))))
    return [m | {"other": meta[m["other"]["store_id"]]} for m in moves[:5]]


def _stock_move(m: dict, me: dict, side) -> dict[str, Any]:
    d, r, u = m["donor"], m["receiver"], m["units"]
    other = side(m["other"], m["other"]["km"])
    a, b = (other, me) if m["direction"] == "in" else (me, other)
    held = d["closing"] or 0
    sold = d["sold_day"] or 0
    after = (held - u) / sold if sold else None
    short = r["lost_day"] or 0
    value = short * (r["unit_margin"] or 0)
    reason = f"{b['code']} lost {short:.1f} units/day of this item to stock-outs. {a['code']} holds {held:.0f} units"
    if sold:
        reason += f" ({held / sold:.0f} days of its own sales), so sending {u} still leaves it {after:.0f} days of cover."
    else:
        reason += f" and can spare {u}."
    facts = [["Short at " + b["code"], f"{short:.1f} units/day lost"], ["Stock at " + a["code"], f"{held:.0f} units"],
             ["Covers", f"{u / short:.0f} days of the shortfall" if short else "the shortfall"]]
    if after is not None:
        facts.append(["Sender keeps", f"{after:.0f} days of cover"])
    if value:
        facts.append(["Margin recovered", f"≈ {_inr(value)}/day"])
    return {"kind": "Stock", "from": a, "to": b, "amount": u, "unit": "units", "item": m["sku"], "reason": reason, "facts": facts}


def rebalance_for(code: str, f: Filters) -> dict[str, Any] | None:
    norm = normalise_code(code)
    everyone = store_metrics(f)
    mine = next((s for s in everyone if s["code"] == norm), None)
    if not mine:
        return None
    near = sorted(((_km(mine, s), s) for s in everyone if s["store_id"] != mine["store_id"]), key=lambda t: t[0])
    near = [(km, s) for km, s in near if km <= RADIUS_KM][:4]
    hours = _hourly([mine["store_id"], *(s["store_id"] for _, s in near)], f)
    me_h = hours.get(mine["store_id"], {})
    me_t = _totals(me_h)
    spc = lambda s: (s["staff"] / (s["days"] or 1)) / max(s["orders_day"], 1)  # noqa: E731 - staff cost per order
    med_spc = median(spc(s) for s in everyone)
    moves: list[dict[str, Any]] = []

    def side(s: dict, km: float) -> dict[str, Any]:
        return {"code": s["code"], "area": s["area"], "km": round(km, 1)}

    def demand(donor: dict, d_h: dict, d_km: float, receiver: dict, r_h: dict, r_km: float, n: float) -> dict[str, Any]:
        d_t, r_t = _totals(d_h), _totals(r_h)
        worth = n * donor["cpo"]
        km = max(d_km, r_km)
        return {"kind": "Demand", "from": side(donor, d_km), "to": side(receiver, r_km), "amount": round(n), "unit": "orders/day",
                "reason": (f"{donor['code']} turns away {d_t['lost']:.0f} orders/day at busy hours (peak {_peak_hours(d_h)}). "
                           f"{receiver['code']}, {km:.1f} km away, is at {r_t['util']:.0%} utilisation and has room for {n:.0f} of them in those hours."),
                "facts": [["Lost at " + donor["code"], f"{d_t['lost']:.0f} orders/day"], ["Busy hours", _peak_hours(d_h)],
                          [receiver["code"] + " utilisation", f"{r_t['util']:.0%}"],
                          ["Contribution", f"≈ {_inr(worth)}/day at ₹{donor['cpo']:.0f}/order"]]}

    me = side(mine, 0)
    min_move = 3  # orders/day below which a redirect is not worth suggesting
    if me_t["lost"] >= MIN_LOST:  # S is constrained: send its busy-hour orders to neighbours with room, nearest first
        rooms = [((km, s), _spare(hours.get(s["store_id"], {}))) for km, s in near if _totals(hours.get(s["store_id"], {}))["util"] < SPARE_UTIL]
        for (km, s), n in _allocate({hr: h["lost"] for hr, h in me_h.items()}, rooms):
            if n >= min_move:
                moves.append(demand(mine, me_h, 0, s, hours[s["store_id"]], km, n))
    if me_t["util"] < SPARE_UTIL and me_t["lost"] < MIN_LOST:  # S has room and is not itself constrained: take busy-hour orders from neighbours
        donors = [(km, s) for km, s in near if _totals(hours.get(s["store_id"], {}))["lost"] >= MIN_LOST]
        for (km, s), n in _allocate_donors(donors, hours, _spare(me_h)):
            if n >= min_move:
                moves.append(demand(s, hours[s["store_id"]], km, mine, me_h, km, n))
    for km, s in near:
        t = _totals(hours.get(s["store_id"], {}))
        for donor, d_km, recv, r_km, r_t in ((mine, 0, s, km, t), (s, km, mine, 0, me_t)):
            if spc(donor) >= 1.3 * med_spc and r_t["lost"] >= MIN_LOST and spc(recv) < 1.1 * med_spc:
                excess = (spc(donor) - med_spc) * donor["orders_day"]
                moves.append({"kind": "Staff", "from": side(donor, d_km), "to": side(recv, r_km), "amount": round(excess),
                              "unit": "₹/day staff cost above median",
                              "reason": (f"{donor['code']} spends ₹{spc(donor):.0f} of staff cost per order against a network median of ₹{med_spc:.0f}, "
                                         f"while {recv['code']} loses {r_t['lost']:.0f} orders/day at busy hours. Shift picker hours to {recv['code']}."),
                              "facts": [[donor["code"] + " staff cost/order", f"₹{spc(donor):.0f}"], ["Network median", f"₹{med_spc:.0f}"],
                                        [recv["code"] + " lost orders", f"{r_t['lost']:.0f}/day"], ["Excess cost", f"≈ {_inr(excess)}/day"]]})
    for m in _stock(mine["store_id"], [s | {"km": km} for km, s in near], f):
        moves.append(_stock_move(m, me, side))
    order = {"Demand": 0, "Stock": 1, "Staff": 2}
    moves.sort(key=lambda m: (order[m["kind"]], -m["amount"]))
    return {"store": me["code"], "radiusKm": RADIUS_KM, "moves": moves[:7]}
