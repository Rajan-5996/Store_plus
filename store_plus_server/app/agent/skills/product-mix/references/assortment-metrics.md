# Product mix — assortment metrics and SQL

DuckDB SQL via `db.py`, named parameters `$store_id`, `$city_id`, `$start`, `$end`, `$top_n`, `$min_support`.

## 1. Definitions

| Metric | Formula |
|---|---|
| Sales ₹ | Σ quantity × unit_selling_price (delivered lines) |
| Margin ₹ | Σ quantity × (unit_selling_price − unit_cost) |
| Margin % | margin ₹ ÷ sales ₹ |
| Discount vs MRP | Σ quantity × (unit_mrp − unit_selling_price) |
| Penetration | orders containing the category ÷ all delivered orders |
| OOS-adjusted demand | sold_qty + lost_demand_units (fact_inventory_daily) |
| Support(A,B) | orders with A and B ÷ all orders |
| Confidence(A→B) | orders with A and B ÷ orders with A |
| Lift(A,B) | support(A,B) ÷ (support(A) × support(B)); > 1.2 = meaningful affinity |
| Assortment index | store category share of sales ÷ city category share of sales |
| Null-search rate | searches with no result per 1,000 orders |

## 2. Optional pre-build: delivered lines with attributes (store × day × SKU)

```sql
CREATE OR REPLACE TABLE mart_store_sku_day AS
SELECT o.store_id, o.business_date AS date, i.sku_id, sum(i.quantity) AS units,
       sum(i.quantity * i.unit_selling_price) AS sales, sum(i.quantity * (i.unit_selling_price - i.unit_cost)) AS margin,
       sum(i.quantity * (i.unit_mrp - i.unit_selling_price)) AS discount_vs_mrp, count(DISTINCT o.order_id) AS orders
FROM fact_order_items i JOIN fact_orders o USING (order_id)
WHERE o.order_status = 'Delivered' GROUP BY ALL;
```

## 3. `get_category_performance`

```sql
WITH c AS (
  SELECT k.l2_category, k.l1_category, count(DISTINCT o.order_id) AS orders_with_cat,
         sum(i.quantity) AS units, sum(i.quantity * i.unit_selling_price) AS sales,
         sum(i.quantity * (i.unit_selling_price - i.unit_cost)) AS margin
  FROM fact_order_items i JOIN fact_orders o USING (order_id) JOIN dim_sku k USING (sku_id)
  WHERE o.store_id = $store_id AND o.order_status = 'Delivered'
    AND o.business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL),
t AS (SELECT count(*) AS orders FROM fact_orders WHERE store_id = $store_id AND order_status = 'Delivered'
      AND business_date BETWEEN $start::DATE AND $end::DATE)
SELECT c.*, margin / sales AS margin_pct, sales / sum(sales) OVER () AS share_of_sales,
       margin / sum(margin) OVER () AS share_of_margin, orders_with_cat / t.orders AS penetration
FROM c, t ORDER BY sales DESC;
```

## 4. `get_sku_ranking`

```sql
WITH s AS (
  SELECT i.sku_id, sum(i.quantity) AS units, sum(i.quantity * i.unit_selling_price) AS sales,
         sum(i.quantity * (i.unit_selling_price - i.unit_cost)) AS margin
  FROM fact_order_items i JOIN fact_orders o USING (order_id)
  WHERE o.store_id = $store_id AND o.order_status = 'Delivered'
    AND o.business_date BETWEEN $start::DATE AND $end::DATE GROUP BY i.sku_id),
inv AS (
  SELECT sku_id, sum(lost_demand_units) AS lost_units, avg((oos_minutes > 0)::INT) AS oos_rate
  FROM fact_inventory_daily WHERE store_id = $store_id AND date BETWEEN $start::DATE AND $end::DATE GROUP BY sku_id)
SELECT k.sku_name, k.brand, k.l2_category, s.*, s.margin / s.sales AS margin_pct, inv.lost_units, inv.oos_rate
FROM s JOIN dim_sku k USING (sku_id) LEFT JOIN inv USING (sku_id)
ORDER BY s.sales DESC LIMIT $top_n;
```

For bottom SKUs order ascending and **exclude** rows with `oos_rate > 0.2` (low sales caused by availability).

## 5. `get_margin_quadrant`

```sql
WITH s AS (
  SELECT i.sku_id, sum(i.quantity * i.unit_selling_price) AS sales,
         sum(i.quantity * (i.unit_selling_price - i.unit_cost)) / sum(i.quantity * i.unit_selling_price) AS margin_pct
  FROM fact_order_items i JOIN fact_orders o USING (order_id)
  WHERE o.store_id = $store_id AND o.order_status = 'Delivered'
    AND o.business_date BETWEEN $start::DATE AND $end::DATE GROUP BY i.sku_id),
m AS (SELECT median(sales) AS med_sales, median(margin_pct) AS med_margin FROM s)
SELECT CASE WHEN sales >= med_sales AND margin_pct >= med_margin THEN 'Stars'
            WHEN sales >= med_sales THEN 'Traffic builders'
            WHEN margin_pct >= med_margin THEN 'Niche profit' ELSE 'Review' END AS quadrant,
       count(*) AS skus, sum(sales) AS sales
FROM s, m GROUP BY quadrant ORDER BY sales DESC;
```

Return SKU lists per quadrant (top 10 by sales) for the frontend.

## 6. `get_basket_affinity` (category level)

```sql
WITH oc AS (
  SELECT DISTINCT o.order_id, k.l2_category AS cat
  FROM fact_order_items i JOIN fact_orders o USING (order_id) JOIN dim_sku k USING (sku_id)
  WHERE o.store_id = $store_id AND o.order_status = 'Delivered'
    AND o.business_date BETWEEN $start::DATE AND $end::DATE),
n AS (SELECT count(DISTINCT order_id) AS total FROM oc),
single AS (SELECT cat, count(*) AS cnt FROM oc GROUP BY cat),
pair AS (SELECT a.cat AS a, b.cat AS b, count(*) AS both_cnt
         FROM oc a JOIN oc b ON a.order_id = b.order_id AND a.cat < b.cat GROUP BY ALL)
SELECT p.a, p.b, p.both_cnt, p.both_cnt / n.total AS support,
       p.both_cnt / sa.cnt AS confidence_a_to_b, p.both_cnt / sb.cnt AS confidence_b_to_a,
       (p.both_cnt / n.total) / ((sa.cnt / n.total) * (sb.cnt / n.total)) AS lift
FROM pair p, n JOIN single sa ON sa.cat = p.a JOIN single sb ON sb.cat = p.b
WHERE p.both_cnt / n.total >= $min_support AND p.both_cnt >= 200
ORDER BY lift DESC LIMIT 25;
```

SKU-level affinity: same query with `sku_id` instead of `l2_category`, on a shorter period (≤ 4 weeks).

## 7. `get_assortment_fit`

```sql
WITH sc AS (
  SELECT o.store_id, k.l2_category, sum(i.quantity * i.unit_selling_price) AS sales
  FROM fact_order_items i JOIN fact_orders o USING (order_id) JOIN dim_sku k USING (sku_id)
  JOIN dim_store s ON s.store_id = o.store_id
  WHERE s.city_id = (SELECT city_id FROM dim_store WHERE store_id = $store_id)
    AND o.order_status = 'Delivered' AND o.business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL),
shares AS (SELECT store_id, l2_category, sales / sum(sales) OVER (PARTITION BY store_id) AS share FROM sc),
city AS (SELECT l2_category, avg(share) AS city_share FROM shares GROUP BY l2_category)
SELECT s.l2_category, s.share AS store_share, c.city_share, s.share / c.city_share AS index_vs_city
FROM shares s JOIN city c USING (l2_category)
WHERE s.store_id = $store_id ORDER BY index_vs_city;
```

Index < 0.75 = under-indexed (check ranging and OOS); > 1.33 = local strength.

## 8. `get_null_search_gaps`

```sql
WITH st AS (
  SELECT n.store_id, n.search_term, sum(n.searches) AS searches, bool_or(n.catalogue_match) AS any_match
  FROM fact_search_null_daily n JOIN dim_store s USING (store_id)
  WHERE s.city_id = (SELECT city_id FROM dim_store WHERE store_id = $store_id)
    AND n.date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL),
ord AS (SELECT store_id, count(*) AS orders FROM fact_orders WHERE order_status = 'Delivered'
        AND business_date BETWEEN $start::DATE AND $end::DATE GROUP BY store_id),
r AS (SELECT st.*, 1000 * st.searches / ord.orders AS per_1000_orders FROM st JOIN ord USING (store_id))
SELECT search_term, bool_or(any_match) AS any_match,
       max(CASE WHEN store_id = $store_id THEN per_1000_orders END) AS this_store,
       median(CASE WHEN store_id <> $store_id THEN per_1000_orders END) AS city_peers_median
FROM r GROUP BY search_term HAVING this_store IS NOT NULL
ORDER BY this_store DESC LIMIT 20;
```

`any_match = false` → product not in catalogue (sourcing opportunity). Term high here but low at city peers
→ peers range it, this store does not (ranging gap). Cross-check `dim_sku.available_cities`.

## 9. `get_dead_stock`

```sql
SELECT i.sku_id, k.sku_name, k.l2_category, count(*) AS days_ranged,
       sum(i.sold_qty + i.lost_demand_units) AS demand_units, avg((i.oos_minutes > 0)::INT) AS oos_rate,
       avg(i.closing_qty) * k.cost_price AS avg_stock_value_inr
FROM fact_inventory_daily i JOIN dim_sku k USING (sku_id)
WHERE i.store_id = $store_id AND i.date BETWEEN $start::DATE AND $end::DATE
GROUP BY i.sku_id, k.sku_name, k.l2_category, k.cost_price
HAVING sum(i.sold_qty + i.lost_demand_units) / count(*) < 0.15 AND avg((i.oos_minutes > 0)::INT) < 0.2
ORDER BY avg_stock_value_inr DESC NULLS LAST;
```

## 10. `get_price_position`

```sql
SELECT k.l2_category, p.competitor_brand, count(*) AS checks,
       avg((p.our_price - p.competitor_price) / p.competitor_price) AS avg_premium_vs_rival,
       avg((p.our_price > p.competitor_price * 1.02)::INT) AS share_dearer_by_2pct
FROM fact_competitor_price_checks p JOIN dim_sku k USING (sku_id)
WHERE p.city_id = $city_id AND p.check_date BETWEEN $start::DATE AND $end::DATE AND p.competitor_in_stock
GROUP BY ALL ORDER BY share_dearer_by_2pct DESC;
```

Positive premium = we are dearer. Note missing check weeks (gaps in `check_date`) as a data gap.
