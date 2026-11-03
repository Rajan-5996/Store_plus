import math

from app.core.db import query
from app.core.filters import Filters
from app.services.common import store_metrics

OVERLAP_PAIR_MIN = 0.15  # share of the smaller store's hexes that the other store also serves
POCKET_MIN_SESSIONS = 3000  # unserviceable app sessions/day around one store for it to count as a pocket
NEAR_BREAKEVEN = 1500  # |daily P&L| under this (INR) is "near break-even"
AFFLUENT = 4.2  # mean affluence index of a pocket (scale ~3.5-4.5) above which it is a new-store candidate
RIVAL_KM = 3  # a rival dark store within this distance competes for the same customers (as get_competitor_pressure)


def network(f: Filters) -> dict:
    stores = store_metrics(f)
    pairs = _overlap_pairs(f)
    pockets = _pockets(f)
    rivals = _rivals(f)
    return {
        "kpis": {
            "stores": len(stores),
            "highOverlapPairs": len(pairs),
            "underservedPockets": len(pockets),
            "expansionCandidates": sum(1 for p in pockets if p["affluence"] >= AFFLUENT),
        },
        "warehouses": [_warehouse(s, rivals) for s in stores],
        "competitors": [_competitor(c, stores, f) for c in rivals],
        "scorecard": _scorecard(pairs, pockets),
    }


def _warehouse(s: dict, rivals: list[dict]) -> dict:
    pnl = s["pnl_day"]
    status = "profit" if pnl > NEAR_BREAKEVEN else "mid" if pnl > -NEAR_BREAKEVEN else "loss"
    note = "Healthy, strong demand" if status == "profit" else "Near break-even" if status == "mid" else f"Weak: {s['cause'].lower()}"
    near = [{"id": c["id"], "brand": c["brand"], "km": round(_km(s, c), 1)} for c in rivals if c["city_code"] == s["city_code"]]
    return {
        "id": s["code"], "name": s["area"], "city": s["city"], "cityCode": s["city_code"],
        "lng": s["lng"], "lat": s["lat"], "status": status, "orders": round(s["orders_day"]),
        "pnlDay": pnl, "note": note,
        "rivals": sorted((r for r in near if r["km"] <= RIVAL_KM), key=lambda r: r["km"]),
    }


def _rivals(f: Filters) -> list[dict]:
    """Competitor dark stores open by the end of the window, in the selected city."""
    return query(f"""
      select c.competitor_store_id as id, coalesce(nullif(c.brand, ''), 'Other') as brand,
        c.latitude as lat, c.longitude as lng, c.open_date, d.city_code
      from dim_competitor_store c join dim_city d using (city_id)
      where c.open_date <= date '{f.end}'
        and {('c.city_id = ' + str(f.city_id)) if f.city_id is not None else 'true'}
      order by c.competitor_store_id""")


def _competitor(c: dict, stores: list[dict], f: Filters) -> dict:
    near = min((s for s in stores if s["city_code"] == c["city_code"]), key=lambda s: _km(s, c), default=None)
    return {
        "id": c["id"], "brand": c["brand"], "cityCode": c["city_code"], "lng": c["lng"], "lat": c["lat"],
        "opened": c["open_date"].isoformat(), "isNew": c["open_date"] >= f.start,
        "near": None if near is None else {"id": near["code"], "name": near["area"], "km": round(_km(near, c), 1)},
    }


def _km(a: dict, b: dict) -> float:
    """Great-circle distance in km between two points with lat/lng keys."""
    la, lb = math.radians(a["lat"]), math.radians(b["lat"])
    h = math.sin((lb - la) / 2) ** 2 + math.cos(la) * math.cos(lb) * math.sin(math.radians(b["lng"] - a["lng"]) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def _overlap_pairs(f: Filters) -> list[dict]:
    return query(f"""
      with c as (select store_id, hex_id from dim_store_hex_coverage
                 where (valid_to is null or valid_to >= date '{f.start}') and valid_from <= date '{f.end}'
                   and {f.stores()}),
      n as (select store_id, count(*) as hexes from c group by 1)
      select a.store_id as a_id, b.store_id as b_id, sa.store_code as a_code, sa.locality as a_area,
        sb.store_code as b_code, sb.locality as b_area, count(*) as shared,
        count(*) * 1.0 / least(na.hexes, nb.hexes) as share
      from c a join c b on a.hex_id = b.hex_id and a.store_id < b.store_id
      join n na on na.store_id = a.store_id join n nb on nb.store_id = b.store_id
      join dim_store sa on sa.store_id = a.store_id join dim_store sb on sb.store_id = b.store_id
      group by a.store_id, b.store_id, sa.store_code, sa.locality, sb.store_code, sb.locality, na.hexes, nb.hexes
      having count(*) * 1.0 / least(na.hexes, nb.hexes) >= {OVERLAP_PAIR_MIN}
      order by share desc""")


def _pockets(f: Filters) -> list[dict]:
    """Unserviceable hexes grouped around their nearest store: each group is one underserved demand pocket."""
    rows = query(f"""
      with u as (
        select d.hex_id, avg(d.unserviceable_sessions) as unserved
        from fact_hex_demand_daily d join dim_hex h using (hex_id)
        where not d.is_serviceable and {f.dates('d.date')}
          and {('h.city_id = ' + str(f.city_id)) if f.city_id is not None else 'true'}
        group by 1)
      select u.unserved, h.affluence_index as affluence, near.locality as near_area, near.store_code as near_code
      from u join dim_hex h using (hex_id)
      cross join lateral (
        select s.locality, s.store_code from dim_store s where s.city_id = h.city_id
        order by (s.latitude - h.latitude) ^ 2 + (s.longitude - h.longitude) ^ 2 limit 1) near""")
    groups: dict[str, dict] = {}
    for r in rows:
        g = groups.setdefault(r["near_code"], {"near_area": r["near_area"], "near_code": r["near_code"], "unserved": 0.0, "hexes": 0, "aff": 0.0})
        g["unserved"] += r["unserved"]
        g["hexes"] += 1
        g["aff"] += r["affluence"] or 0
    pockets = [{**g, "affluence": g["aff"] / g["hexes"]} for g in groups.values() if g["unserved"] >= POCKET_MIN_SESSIONS]
    return sorted(pockets, key=lambda p: -p["unserved"])


def _scorecard(pairs: list[dict], pockets: list[dict]) -> list[dict]:
    rows = []
    for p in pairs[:3]:
        high = p["share"] >= 0.3
        rows.append(
            {
                "name": f"{p['a_area']} {p['a_code']} / {p['b_area']} {p['b_code']}",
                "demand": "High", "coverage": "Strong", "overlap": "High" if high else "Medium",
                "investment": "Low / operational", "recommendation": "Test zone and capacity balancing",
            }
        )
    for k, p in enumerate(pockets[:3]):
        rows.append(
            {
                "name": f"Pocket near {p['near_area']} ({p['near_code']})",
                "demand": "High" if p["unserved"] >= 4000 else "Medium", "coverage": "Low", "overlap": "Low",
                "investment": "To estimate",
                "recommendation": "Validate new-store feasibility" if p["affluence"] >= AFFLUENT else "Extend nearest store zone",
            }
        )
    return rows
