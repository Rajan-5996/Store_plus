"""The dashboard's own numbers, compacted for the model: identical to what each screen shows."""
from typing import Any

from app.core.filters import get_filters
from app.services import inventory, network, operations, overview, productmix, profitability, utilisation

SCREENS = {
    "overview": overview.overview,
    "utilisation": utilisation.utilisation,
    "inventory": inventory.inventory,
    "operations": operations.operations,
    "profitability": profitability.profitability,
    "network": network.network,
    "productmix": productmix.productmix,
}


def _round(o: Any) -> Any:
    if isinstance(o, float):
        return round(o, 2)
    if isinstance(o, dict):
        return {k: _round(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_round(v) for v in o]
    return o


def _compact(screen: str, d: dict) -> dict:
    """Drop chart series and long lists; keep KPIs and the rows that matter."""
    d = dict(d)
    if screen == "overview":
        d.pop("weekly", None)
        d["lossTrend"] = {"days": len(d["lossTrend"]), "worstDayPnl": min((p["pnl"] for p in d["lossTrend"]), default=None)}
    elif screen == "utilisation":
        stores = d.pop("stores")
        d.pop("table", None)
        d["lowestUtilisation"] = sorted(stores, key=lambda s: s["utilisation"])[:6]
        d["mostBusyMode"] = sorted(stores, key=lambda s: -s["busyMinDay"])[:6]
    elif screen == "inventory":
        d["categoryHealth"] = sorted(d["categoryHealth"], key=lambda c: c["pct"])[:6]
        d["queue"] = d["queue"][:6]
    elif screen == "operations":
        q = d.pop("queueByHour")
        peak = max(range(len(q["values"])), key=lambda i: q["values"][i])
        d["slowestHour"] = {"hour": q["hours"][peak], "minutes": q["values"][peak]}
    elif screen == "profitability":
        stores = d.pop("stores")
        d["worstStores"], d["bestStores"] = stores[:6], stores[-4:]
    elif screen == "network":
        ws = sorted(d.pop("warehouses"), key=lambda w: w["pnlDay"])
        d["worstStores"], d["bestStores"] = ws[:6], ws[-4:]
    return d


def dashboard_summary(screen: str, city: str = "all", range: str = "30d") -> dict:
    """Compact summary of one dashboard screen for a city (code or 'all') and range (7d, 30d, 90d)."""
    return _round(_compact(screen, SCREENS[screen](get_filters(city=city, range=range))))
