"""Store-level facts pulled from DuckDB when a question names a store."""
import re
from statistics import median
from typing import Any

from app.agent.summaries import _round
from app.core.db import query
from app.core.filters import get_filters
from app.services.common import store_metrics


def find_stores(text: str) -> list[dict[str, Any]]:
    """Stores mentioned in the text by code (#412) or locality (HSR Layout)."""
    codes = {f"#{c}" for c in re.findall(r"#\s?(\d{3})", text)}
    rows = query(
        "select s.store_id, s.store_code, s.locality, c.city_name as city, c.city_code, s.store_format as format, "
        "s.launch_date::varchar as launch_date, s.closure_date::varchar as closure_date, s.area_sqft, "
        "s.design_capacity_orders_per_hour as design_capacity_per_hour from dim_store s join dim_city c using (city_id)"
    )
    low = text.lower()
    return [r for r in rows if r["store_code"] in codes or r["locality"].lower() in low][:3]


def store_profile(store: dict[str, Any], range: str = "30d") -> dict[str, Any]:
    """One store against the network: P&L, break-even, likely cause, capacity, stock-outs, wastage."""
    f = get_filters(city="all", range=range)
    everyone = store_metrics(f)
    mine = next((s for s in everyone if s["store_id"] == store["store_id"]), None)
    sid = store["store_id"]
    profile: dict[str, Any] = {"store": store, "period": f"{f.start} to {f.end}"}
    if mine:
        profile["pnl"] = {
            k: mine[k]
            for k in ("orders_day", "cpo", "opex_day", "pnl_day", "breakeven", "cm_pct", "cause", "overlap", "rent", "staff", "elec")
        }
        profile["pnl"]["cause_scores"] = mine["cause_scores"]
        profile["network_median"] = {
            "orders_day": median(s["orders_day"] for s in everyone),
            "cpo": median(s["cpo"] for s in everyone),
            "pnl_day": median(s["pnl_day"] for s in everyone),
        }
    profile["capacity"] = query(
        f"select round(sum(orders_accepted) * 1.0 / nullif(sum(processing_capacity_orders), 0), 3) as staffed_utilisation, "
        f"round(sum(busy_mode_minutes) / count(distinct date), 1) as busy_min_per_day, "
        f"round(sum(orders_lost_busy_mode) * 1.0 / count(distinct date), 1) as orders_lost_busy_per_day, "
        f"round(avg(avg_pick_queue_wait_min), 2) as avg_pick_queue_wait_min "
        f"from fact_store_hourly_ops where store_id = {sid} and {f.dates()}"
    )[:1]
    profile["top_stockouts"] = query(
        f"select k.sku_name, sum(i.lost_demand_units) as lost_units, count(*) filter (where i.oos_minutes > 0) as oos_days "
        f"from fact_inventory_daily i join dim_sku k using (sku_id) where i.store_id = {sid} and {f.dates('i.date')} "
        f"group by 1 order by lost_units desc limit 5"
    )
    profile["wastage_by_reason"] = query(
        f"select reason, round(sum(value_at_cost_inr)) as value_inr from fact_wastage "
        f"where store_id = {sid} and {f.dates()} group by 1 order by 2 desc"
    )
    return _round(profile)
