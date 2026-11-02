from app.core.db import one, query
from app.core.filters import Filters
from app.core.mart import CONTRIB  # noqa: F401  (kept for parity with other services)

LOW_MARGIN_PCT = 8.0  # SKUs earning less product margin than this (% of revenue) are low-contribution
NULL_SEARCH_MIN = 40  # un-ranged search terms with at least this many searches are assortment gaps


def productmix(f: Filters) -> dict:
    basket = one(f"""
      select sum(gov) / nullif(sum(delivered), 0) as aov from store_day where {f.where()}""")
    skus = one(f"""
      with k as (select sku_id, sum(revenue) as rev, sum(revenue - cost) as m from sku_day
                 where {f.where()} group by 1)
      select count(*) filter (where m / nullif(rev, 0) * 100 < {LOW_MARGIN_PCT}) as low, count(*) as n from k""")
    cats = one(f"""
      select count(distinct k.l2_category) as n from sku_day d join dim_sku k using (sku_id) where {f.where()}""")
    gaps = one(f"""
      select count(*) as n from (select search_term from fact_search_null_daily
        where not catalogue_match and {f.where()} group by 1 having sum(searches) >= {NULL_SEARCH_MIN})""")
    return {
        "kpis": {
            "avgBasketValue": basket["aov"],
            "categoriesAnalysed": cats["n"],
            "lowContributionSkus": skus["low"],
            "assortmentOpportunities": gaps["n"],
        },
        "categoryProfile": _category_profile(f),
        "table": _table(f),
    }


def _category_profile(f: Filters) -> list[dict]:
    rows = query(f"""
      select k.l1_category as label, sum(d.revenue - d.cost) / nullif(sum(d.revenue), 0) * 100 as margin_pct,
        sum(d.revenue) as revenue
      from sku_day d join dim_sku k using (sku_id) where {f.where('d.date', 'd.store_id')}
      group by 1 order by revenue desc limit 8""")
    return [{"label": r["label"], "marginPct": r["margin_pct"], "revenue": r["revenue"]} for r in rows]


def _trend(now: float, before: float, up: str, down: str, flat: str, tol: float = 0.03) -> str:
    if not before:
        return flat
    ch = (now - before) / abs(before)
    return up if ch > tol else down if ch < -tol else flat


def _table(f: Filters) -> list[dict]:
    rows = query(f"""
      with cur as (
        select k.l2_category as cat, sum(d.revenue) as rev, sum(d.revenue - d.cost) as m from sku_day d
        join dim_sku k using (sku_id) where {f.where('d.date', 'd.store_id')} group by 1),
      prv as (
        select k.l2_category as cat, sum(d.revenue) as rev, sum(d.revenue - d.cost) as m from sku_day d
        join dim_sku k using (sku_id) where {f.where('d.date', 'd.store_id', prev=True)} group by 1),
      av as (
        select k.l2_category as cat, 1 - sum(i.oos_minutes) / (count(*) * 1200.0) as availability
        from fact_inventory_daily i join dim_sku k using (sku_id)
        where {f.where('i.date', 'i.store_id')} group by 1)
      select cur.cat, cur.rev, cur.m, prv.rev as prev_rev, prv.m as prev_m, av.availability
      from cur left join prv using (cat) left join av using (cat) order by cur.rev desc limit 6""")
    out = []
    for r in rows:
        margin, prev_margin = r["m"] / r["rev"], (r["prev_m"] / r["prev_rev"]) if r["prev_rev"] else 0
        sales = _trend(r["rev"], r["prev_rev"], "Growing", "Declining", "Stable")
        contrib = "Strong" if margin >= 0.22 else "Low per unit" if margin < 0.12 else "Moderate"
        if _trend(margin, prev_margin, "", "Under pressure", "") == "Under pressure":
            contrib = "Under pressure"
        avail = r["availability"] or 0
        availability = "Good" if avail >= 0.97 else "Variable"
        out.append(
            {
                "category": r["cat"], "sales": sales, "contribution": contrib, "availability": availability,
                **_decision(sales, contrib, availability),
            }
        )
    return out


def _decision(sales: str, contrib: str, availability: str) -> dict:
    if contrib == "Under pressure":
        return {"opportunity": "Review sourcing, discounts and wastage", "decision": "Analyse SKU economics"}
    if availability == "Variable":
        return {"opportunity": "Fix availability before pushing volume", "decision": "Review replenishment"}
    if sales == "Growing" and contrib == "Strong":
        return {"opportunity": "Expand relevant assortment", "decision": "Test selected SKUs"}
    if contrib == "Low per unit":
        return {"opportunity": "Basket attachment", "decision": "Bundle / cross-sell test"}
    return {"opportunity": "Hold range and watch margin", "decision": "Maintain"}
