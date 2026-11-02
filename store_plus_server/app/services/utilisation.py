from app.core.db import query
from app.core.filters import Filters
from app.services.common import share

SPARE_BELOW = 0.70  # staffed utilisation under this means the store can absorb more orders
CONSTRAINED_BUSY_MIN = 65  # busy-mode minutes/day above this means peak hours are constrained


def utilisation(f: Filters) -> dict:
    rows = query(f"""
      with h as (
        select store_id, count(distinct date) as days, sum(orders_accepted) as accepted,
          sum(processing_capacity_orders) as capacity, sum(busy_mode_minutes) as busy_min,
          sum(orders_lost_busy_mode) as lost, max_by(hour, orders_accepted * 1.0 / nullif(processing_capacity_orders, 0)) as peak_hour
        from fact_store_hourly_ops where {f.where()} group by 1
      ), o as (
        select store_id, avg(orders_abandoned_oos) as oos from fact_store_sessions_daily
        where {f.where()} group by 1
      )
      select s.store_code as code, s.locality as area, h.days, h.accepted, h.capacity, h.busy_min, h.lost,
        h.peak_hour, o.oos
      from h join dim_store s using (store_id) left join o using (store_id) order by h.accepted / h.days desc""")
    stores = []
    for r in rows:
        d = r["days"] or 1
        util = share(r["accepted"], r["capacity"])
        busy_day = r["busy_min"] / d
        constraint, action = _constraint(util, busy_day, r["oos"] or 0, r["peak_hour"])
        stores.append(
            {
                "code": r["code"], "area": r["area"], "ordersDay": r["accepted"] / d, "capacityDay": r["capacity"] / d,
                "utilisation": util, "busyMinDay": busy_day, "lostDay": r["lost"] / d,
                "constraint": constraint, "action": action,
            }
        )
    tot_acc = sum(r["accepted"] for r in rows)
    tot_cap = sum(r["capacity"] for r in rows)
    return {
        "kpis": {
            "avgUtilisation": share(tot_acc, tot_cap),
            "spareCapacityStores": sum(1 for s in stores if s["utilisation"] < SPARE_BELOW),
            "constrainedStores": sum(1 for s in stores if s["busyMinDay"] >= CONSTRAINED_BUSY_MIN),
            "potentialOrdersDay": sum(s["lostDay"] for s in stores),
        },
        "stores": stores,
        "table": stores[:8],
    }


def _constraint(util: float, busy_day: float, oos_day: float, peak_hour: int | None) -> tuple[str, str]:
    if busy_day >= CONSTRAINED_BUSY_MIN:
        hr = f"{peak_hour % 12 or 12}–{(peak_hour + 1) % 12 or 12} {'AM' if (peak_hour or 0) < 12 else 'PM'}" if peak_hour is not None else "peak hours"
        return "Peak picking queue", f"Review {hr} throughput"
    if util < SPARE_BELOW:
        return "Demand coverage", "Analyse catchment demand"
    if oos_day >= 20:
        return "Stock availability", "Check replenishment"
    return "Balanced", "Maintain and monitor"
