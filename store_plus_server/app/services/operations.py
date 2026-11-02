from app.core.db import one, query
from app.core.filters import Filters

HOURS = list(range(8, 24))  # chart window: 8 AM to 11 PM
_EVIDENCE = {
    "peak": ("Pick events, queue length, shift roster", "Peak-hour picker or re-slotting", "Orders/hour, pick time, pause minutes"),
    "pause": ("Busy-mode log and order funnel", "Staffing / process review", "Pause minutes and orders lost"),
    "thru": ("Order funnel and staffing", "Shift / process review", "Throughput and cost/order"),
    "ok": ("Pick and pack timestamps", "Monitor and benchmark vs peers", "Pick time and on-time rate"),
}


def operations(f: Filters) -> dict:
    pick = one(f"""
      select median(date_diff('second', picking_started_at, picking_completed_at)) / 60.0 as med_pick
      from fact_orders where order_status = 'Delivered' and picking_started_at is not null
        and picking_completed_at is not null and {f.where('business_date')}""")
    tot = one(f"""
      select sum(busy_mode_minutes) / nullif(count(distinct store_id || date), 0) as pause_day,
        sum(orders_accepted) / nullif(sum(pickers_on_floor), 0) as per_picker_hr
      from fact_store_hourly_ops where {f.where()} and orders_accepted > 0""")
    queue_wait = one(f"""select max(q) as peak from (select hour, avg(avg_pick_queue_wait_min) as q
                         from fact_store_hourly_ops where {f.where()} group by 1)""")
    by_hour = {
        r["hr"]: r["m"]
        for r in query(f"""select hour(order_accepted_at) as hr,
                             avg(date_diff('second', order_accepted_at, picking_completed_at)) / 60.0 as m
                           from fact_orders where order_status = 'Delivered' and {f.where('business_date')}
                           group by 1""")
    }
    queue = [by_hour.get(h, 0) or 0 for h in HOURS]
    peak_i = max(range(len(queue)), key=lambda i: queue[i]) if queue else 0
    return {
        "kpis": {
            "medianPickMin": pick.get("med_pick"),
            "peakQueueMin": queue_wait.get("peak"),
            "pauseMinDay": tot.get("pause_day"),
            "ordersPerPickerHour": tot.get("per_picker_hr"),
        },
        "queueByHour": {"hours": HOURS, "values": queue, "peak": [max(0, peak_i - 1), min(len(queue) - 1, peak_i + 1)]},
        "candidates": _candidates(f),
    }


def _candidates(f: Filters) -> list[dict]:
    rows = query(f"""
      select s.store_code as code, max(h.q) as peak_q, arg_max(h.hour, h.q) as peak_hour, p.busy_day, p.per_picker
      from (select store_id, hour, avg(avg_pick_queue_wait_min) as q from fact_store_hourly_ops
            where {f.where()} group by 1, 2) h
      join (select store_id, sum(busy_mode_minutes) / count(distinct date) as busy_day,
              sum(orders_accepted) / nullif(sum(pickers_on_floor), 0) as per_picker
            from fact_store_hourly_ops where {f.where()} group by 1) p using (store_id)
      join dim_store s using (store_id) group by s.store_code, p.busy_day, p.per_picker
      order by peak_q desc limit 6""")
    out = []
    for r in rows:
        hr = r["peak_hour"]
        label = f"{hr % 12 or 12} {'AM' if hr < 12 else 'PM'}"
        if r["peak_q"] >= 5:
            key, issue = "peak", f"Pick queue peaks at {r['peak_q']:.1f} min around {label}"
        elif r["busy_day"] >= 25:
            key, issue = "pause", f"Orders paused ~{r['busy_day']:.0f} min/day (busy mode)"
        elif r["per_picker"] and r["per_picker"] < 12:
            key, issue = "thru", f"Low throughput: {r['per_picker']:.1f} orders per picker-hour"
        else:
            key, issue = "ok", f"Queue peaks at {r['peak_q']:.1f} min around {label}"
        evidence, intervention, measure = _EVIDENCE[key]
        out.append({"code": r["code"], "issue": issue, "evidence": evidence, "intervention": intervention, "measure": measure})
    return out
