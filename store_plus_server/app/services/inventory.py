import math

from app.core.db import one, query
from app.core.filters import Filters

SLOW_COVER_DAYS = 7  # stock covering more than a week of sales counts as slow-moving in quick commerce


def _cover_cte(f: Filters) -> str:
    """Store x SKU rows on the last day: closing stock, average daily sales, days of cover."""
    return f"""
      cover as (
        select i.store_id, i.sku_id, i.closing_qty, i.system_forecast_units as forecast,
          a.avg_sold, i.closing_qty / nullif(a.avg_sold, 0) as cover_days,
          i.closing_qty < i.system_forecast_units * 0.5 as on_hand_low
        from fact_inventory_daily i
        join (select store_id, sku_id, avg(sold_qty) as avg_sold from fact_inventory_daily
              where {f.where()} group by 1, 2) a using (store_id, sku_id)
        where i.date = date '{f.end}' and {f.stores('i.store_id')}
      )"""


def inventory(f: Filters) -> dict:
    stock = one(f"""
      select avg(case when oos_minutes > 0 then 1.0 else 0.0 end) as rate from fact_inventory_daily
      where {f.where()}""")
    risk = one(f"""
      with {_cover_cte(f)}
      select sum(c.closing_qty * k.cost_price) filter (where k.is_perishable and c.cover_days > k.shelf_life_days * 0.5) as at_risk,
        count(distinct c.sku_id) filter (where c.cover_days > {SLOW_COVER_DAYS}) as slow_skus,
        count(*) filter (where c.closing_qty < c.forecast * 0.5 and c.avg_sold >= 1) as alerts
      from cover c join dim_sku k using (sku_id)""")
    cats = query(f"""
      select k.l1_category as label, 1 - avg(case when i.oos_minutes > 0 then 1.0 else 0.0 end) as availability
      from fact_inventory_daily i join dim_sku k using (sku_id)
      where {f.where('i.date', 'i.store_id')} group by 1 order by availability desc""")
    return {
        "kpis": {
            "stockoutRate": stock["rate"],
            "atRiskValue": risk["at_risk"] or 0,
            "slowSkus": risk["slow_skus"] or 0,
            "replenishmentAlerts": risk["alerts"] or 0,
        },
        "categoryHealth": [{"label": c["label"], "pct": c["availability"] * 100} for c in cats],
        "queue": _queue(f),
    }


def _queue(f: Filters) -> list[dict]:
    rows = query(f"""
      with {_cover_cte(f)}
      select s.store_code as code, k.sku_name as sku, k.is_perishable, k.shelf_life_days,
        c.closing_qty as on_hand, c.forecast, c.cover_days, c.avg_sold, c.on_hand_low
      from cover c join dim_sku k using (sku_id) join dim_store s using (store_id)
      where c.avg_sold >= 3 and (c.on_hand_low or (k.is_perishable and c.cover_days > k.shelf_life_days * 0.5))
      order by case when c.on_hand_low then 0 else 1 end, c.cover_days limit 60""")
    out: list[dict] = []
    seen_kind: dict[str, int] = {}
    for r in rows:
        stockout = r["on_hand_low"]
        kind = "stockout" if stockout else "ageing"
        if seen_kind.get(kind, 0) >= 4:
            continue
        seen_kind[kind] = seen_kind.get(kind, 0) + 1
        need = max(1, math.ceil((r["forecast"] or r["avg_sold"]) * 2 - r["on_hand"]))
        out.append(
            {
                "code": r["code"], "sku": r["sku"], "onHand": r["on_hand"],
                "forecast": round(r["forecast"] or r["avg_sold"]),
                "risk": "Stockout risk" if stockout else "Ageing risk",
                "action": f"Replenish {need} units" if stockout else "Review transfer / markdown",
            }
        )
    return out
