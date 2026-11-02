from statistics import median

from app.core.db import query
from app.core.filters import Filters
from app.core.mart import CONTRIB
from app.services.common import CAUSES, is_profitable, store_metrics


def _delta(now: float, before: float) -> float | None:
    return (now - before) / before * 100 if before else None


def overview(f: Filters) -> dict:
    stores = store_metrics(f)
    prev = store_metrics(f, prev=True)
    losing = [s for s in stores if not is_profitable(s)]
    losing_ids = {s["store_id"] for s in losing}
    avg_orders = sum(s["orders_day"] for s in stores) / len(stores) if stores else 0
    prev_avg = sum(s["orders_day"] for s in prev) / len(prev) if prev else 0
    return {
        "range": {"start": str(f.start), "end": str(f.end), "days": f.days},
        "kpis": {
            "totalStores": len(stores),
            "aboveBreakEven": len(stores) - len(losing),
            "losingStores": len(losing),
            "dailyNetworkLoss": sum(s["pnl_day"] for s in losing),
            "avgOrdersPerStoreDay": avg_orders,
            "ordersDeltaPct": _delta(avg_orders, prev_avg),
        },
        "weekly": _weekly_candles(f, stores),
        "causes": [{"label": c, "value": sum(1 for s in losing if s["cause"] == c)} for c in CAUSES],
        "lossTrend": _loss_trend(f, losing_ids),
        "topLosers": [
            {"id": s["code"], "area": s["area"], "city": s["city"], "lossPerDay": s["pnl_day"], "cause": s["cause"]}
            for s in sorted(losing, key=lambda s: s["pnl_day"])[:5]
        ],
    }


def _weekly_candles(f: Filters, stores: list[dict]) -> dict:
    """Median orders per store by day, rolled into weekly open/high/low/close candles (whole data span)."""
    rows = query(f"select date, median(delivered) as m from store_day where {f.stores()} group by 1 order by 1")
    weeks: dict[int, list[float]] = {}
    for i, r in enumerate(rows):
        weeks.setdefault(i // 7, []).append(r["m"])
    candles = [{"open": w[0], "close": w[-1], "high": max(w), "low": min(w)} for w in weeks.values() if len(w) >= 3]
    be = [s["breakeven"] for s in stores if s["breakeven"]]
    return {"candles": candles, "breakEven": median(be) if be else None}


def _loss_trend(f: Filters, losing_ids: set[int]) -> list[dict]:
    """Daily P&L summed over loss-making stores, last 30 days of the data."""
    if not losing_ids:
        return []
    ids = ",".join(str(i) for i in losing_ids)
    return query(f"""
      select date::varchar as date, sum({CONTRIB} - opex) as pnl from store_day
      where store_id in ({ids}) and date > (select max(date) from store_day) - 30 group by 1 order by 1""")
