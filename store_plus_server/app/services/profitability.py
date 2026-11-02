from app.core.filters import Filters
from app.services.common import is_profitable, share, store_metrics


def profitability(f: Filters) -> dict:
    stores = store_metrics(f)
    losing = [s for s in stores if not is_profitable(s)]
    delivered = sum(s["delivered"] for s in stores)
    contrib = sum(s["contrib"] for s in stores)
    days = max((s["days"] for s in stores), default=1)
    costs = {
        "Rent": sum(s["rent"] for s in stores),
        "Staff": sum(s["staff"] for s in stores),
        "Utilities": sum(s["elec"] for s in stores),
        "Other opex": sum(s["other_opex"] for s in stores),
    }
    total_cost = sum(costs.values())
    ranked = sorted(costs.items(), key=lambda kv: -kv[1])
    focus = min(stores, key=lambda s: s["pnl_day"]) if stores else None
    return {
        "kpis": {
            "totalStores": len(stores),
            "aboveBreakEven": len(stores) - len(losing),
            "dailyNetworkLoss": sum(s["pnl_day"] for s in losing),
            "contributionPerOrder": share(contrib, delivered),
            "contributionMarginPct": share(sum(s["contrib"] - s["opex"] for s in stores), sum(s["gov"] for s in stores)) * 100,
            "topCostDrivers": [ranked[0][0], ranked[1][0]] if len(ranked) > 1 else [],
        },
        "focusStore": focus
        and {
            "code": focus["code"], "area": focus["area"], "city": focus["city"],
            "ordersDay": focus["orders_day"], "contributionPerOrder": focus["cpo"],
            "dailyContribution": focus["orders_day"] * focus["cpo"], "opexDay": focus["opex_day"],
            "breakEvenOrders": focus["breakeven"], "pnlDay": focus["pnl_day"],
        },
        "costBreakdown": [{"label": k, "pct": share(v, total_cost) * 100, "perDay": v / days} for k, v in costs.items()],
        "stores": [
            {"code": s["code"], "area": s["area"], "city": s["city"], "pnlDay": s["pnl_day"], "ordersDay": s["orders_day"]}
            for s in sorted(stores, key=lambda s: s["pnl_day"])
        ],
    }
