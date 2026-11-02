"""Per-store metrics shared by several pages: P&L, break-even and the likely cause of weakness."""
from statistics import median
from typing import Any

from app.core.db import query
from app.core.filters import Filters
from app.core.mart import CONTRIB

CAUSES = ["Stock-out", "Weak demand", "Picking queue", "Overlap"]


def store_metrics(f: Filters, prev: bool = False) -> list[dict[str, Any]]:
    """One row per store for the filter window, with orders/day, P&L/day, break-even and a likely cause."""
    rows = query(f"""
      with d as (
        select store_id, count(*) as days, sum(delivered) as delivered, sum(gov) as gov,
          sum({CONTRIB}) as contrib, sum(opex) as opex, sum(rent) as rent, sum(staff) as staff,
          sum(elec) as elec, sum(other_opex) as other_opex
        from store_day where {f.where(prev=prev)} group by 1
      ), s as (
        select store_id, avg(orders_abandoned_oos) as oos, avg(orders_lost_busy_mode) as busy,
          avg(orders_placed) as placed
        from fact_store_sessions_daily where {f.where(prev=prev)} group by 1
      ), cov as (
        select store_id, avg(case when n > 1 then 1.0 else 0.0 end) as overlap
        from (select c.store_id, c.hex_id,
                (select count(*) from dim_store_hex_coverage x
                  where x.hex_id = c.hex_id and (x.valid_to is null or x.valid_to >= date '{f.start}')
                    and x.valid_from <= date '{f.end}') as n
              from dim_store_hex_coverage c
              where c.valid_to is null or c.valid_to >= date '{f.start}')
        group by 1
      )
      select st.store_id, st.store_code as code, st.locality as area, c.city_name as city, c.city_code,
        st.store_format as format, st.latitude as lat, st.longitude as lng, st.status_as_of_2026_10_31 as status,
        st.launch_date, st.area_sqft, st.design_capacity_orders_per_hour as design_cap,
        d.days, d.delivered, d.gov, d.contrib, d.opex, d.rent, d.staff, d.elec, d.other_opex,
        s.oos, s.busy, s.placed, coalesce(cov.overlap, 0) as overlap
      from d join dim_store st using (store_id) join dim_city c using (city_id)
      left join s using (store_id) left join cov using (store_id)
      order by st.store_code""")
    out = []
    for r in rows:
        days = r["days"] or 1
        orders_day = r["delivered"] / days
        cpo = r["contrib"] / r["delivered"] if r["delivered"] else 0
        opex_day = r["opex"] / days
        r.update(
            orders_day=orders_day,
            cpo=cpo,
            opex_day=opex_day,
            pnl_day=(r["contrib"] - r["opex"]) / days,
            breakeven=opex_day / cpo if cpo > 0 else None,
            cm_pct=(r["contrib"] - r["opex"]) / r["gov"] * 100 if r["gov"] else 0,
        )
        out.append(r)
    _assign_causes(out)
    return out


def _assign_causes(stores: list[dict[str, Any]]) -> None:
    """Pick, for each store, the factor that is furthest out of line with the network median."""
    if not stores:
        return

    def rate(r: dict[str, Any], k: str) -> float:
        return (r[k] or 0) / (r["placed"] or 1)

    med = {k: median(rate(r, k) for r in stores) or 1e-6 for k in ("oos", "busy")}
    med_orders = median(r["orders_day"] for r in stores)
    med_overlap = max(median(r["overlap"] for r in stores), 0.05)
    for r in stores:
        score = {
            "Stock-out": rate(r, "oos") / med["oos"],
            "Picking queue": rate(r, "busy") / med["busy"],
            "Overlap": r["overlap"] / med_overlap,
            "Weak demand": med_orders / max(r["orders_day"], 1),
        }
        r["cause"] = max(score, key=score.get)
        r["cause_scores"] = score


def is_profitable(r: dict[str, Any]) -> bool:
    return r["pnl_day"] > 0


def share(a: float, b: float) -> float:
    return a / b if b else 0.0
