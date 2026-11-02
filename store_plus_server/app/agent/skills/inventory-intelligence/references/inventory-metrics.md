# Inventory intelligence — metrics and SQL

DuckDB SQL via `db.py`, named parameters `$store_id`, `$city_id`, `$start`, `$end`, `$as_of`, `$top_n`.

## 1. Definitions

| Metric | Formula |
|---|---|
| Demand (units) | sold_qty + lost_demand_units |
| OOS rate | share of store-SKU-days with oos_minutes > 0 |
| OOS minutes share | oos_minutes ÷ (1,200 operating minutes) |
| Lost sales ₹ | lost_demand_units × dim_sku.base_selling_price |
| Forecast bias | Σ system_forecast_units ÷ Σ demand (1.0 = unbiased) |
| Days of cover | closing_qty ÷ average daily demand over last 7 days |
| Target cover | fresh ≈ 1.3 days, other perishables ≈ 1.5, ambient ≈ 2.6, slow movers/direct vendor ≈ 6–8 |
| Fill rate | Σ qty_received ÷ Σ qty_ordered |
| Zero-fill lines | share of PO lines with qty_received = 0 (supplier stock-out) |
| Wastage % | wastage ₹ at cost ÷ sales ₹ at selling price (same scope) |
| Breach hour | Chiller reading > 5 °C, Freezer reading > −15 °C |

## 2. `get_availability_summary`

```sql
SELECT k.l2_category, count(*) AS sku_days, avg((i.oos_minutes > 0)::INT) AS oos_rate,
       avg(i.oos_minutes) AS avg_oos_minutes, sum(i.lost_demand_units) AS lost_units,
       sum(i.lost_demand_units * k.base_selling_price) AS lost_sales_inr,
       sum(i.lost_demand_units) / nullif(sum(i.sold_qty + i.lost_demand_units), 0) AS lost_share_of_demand
FROM fact_inventory_daily i JOIN dim_sku k USING (sku_id)
WHERE i.store_id = $store_id AND i.date BETWEEN $start::DATE AND $end::DATE
GROUP BY k.l2_category ORDER BY lost_sales_inr DESC;
```

Network median per category for comparison:

```sql
WITH s AS (
  SELECT i.store_id, k.l2_category, avg((i.oos_minutes > 0)::INT) AS oos_rate
  FROM fact_inventory_daily i JOIN dim_sku k USING (sku_id)
  WHERE i.date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL)
SELECT l2_category, median(oos_rate) AS network_median_oos_rate FROM s GROUP BY l2_category;
```

## 3. `get_top_stockouts`

```sql
WITH s AS (
  SELECT i.sku_id, k.sku_name, k.l2_category,
         sum((i.oos_minutes > 0)::INT) AS oos_days, count(*) AS days,
         sum(i.lost_demand_units) AS lost_units,
         sum(i.lost_demand_units * k.base_selling_price) AS lost_sales_inr,
         sum(i.system_forecast_units) / nullif(sum(i.sold_qty + i.lost_demand_units), 0) AS forecast_bias
  FROM fact_inventory_daily i JOIN dim_sku k USING (sku_id)
  WHERE i.store_id = $store_id AND i.date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL),
v AS (
  SELECT sku_id, any_value(vendor_id) AS vendor_id,
         sum(qty_received) / nullif(sum(qty_ordered), 0) AS fill_rate
  FROM fact_purchase_orders
  WHERE store_id = $store_id AND po_date BETWEEN $start::DATE AND $end::DATE GROUP BY sku_id)
SELECT s.*, v.vendor_id, v.fill_rate
FROM s LEFT JOIN v USING (sku_id)
ORDER BY lost_sales_inr DESC LIMIT $top_n;
```

## 4. `get_forecast_bias`

```sql
SELECT k.l2_category,
       sum(i.system_forecast_units) / nullif(sum(i.sold_qty + i.lost_demand_units), 0) AS forecast_bias,
       avg((i.oos_minutes > 0)::INT) AS oos_rate, sum(i.wasted_qty) / nullif(sum(i.sold_qty), 0) AS waste_ratio
FROM fact_inventory_daily i JOIN dim_sku k USING (sku_id)
WHERE i.store_id = $store_id AND i.date BETWEEN $start::DATE AND $end::DATE
GROUP BY k.l2_category ORDER BY forecast_bias;
```

Note the forecast is trained on past **sales**, so after stock-outs it drifts down (censored demand).
Bias < 0.9 together with high OOS is the classic under-forecast loop.

## 5. `get_overstock`

```sql
WITH d AS (
  SELECT sku_id, avg(sold_qty + lost_demand_units) AS avg_demand_7d
  FROM fact_inventory_daily
  WHERE store_id = $store_id AND date BETWEEN $as_of::DATE - INTERVAL 6 DAY AND $as_of::DATE GROUP BY sku_id)
SELECT i.sku_id, k.sku_name, k.l2_category, k.storage_type, k.shelf_life_days, i.closing_qty,
       d.avg_demand_7d, i.closing_qty / nullif(d.avg_demand_7d, 0) AS days_of_cover,
       i.closing_qty * k.cost_price AS stock_value_at_cost_inr
FROM fact_inventory_daily i JOIN dim_sku k USING (sku_id) JOIN d USING (sku_id)
WHERE i.store_id = $store_id AND i.date = $as_of::DATE
  AND (i.closing_qty / nullif(d.avg_demand_7d, 0) > greatest(3 * CASE WHEN k.is_perishable THEN 1.5 ELSE 2.6 END, 10)
       OR (k.is_perishable AND i.closing_qty / nullif(d.avg_demand_7d, 0) > k.shelf_life_days))
ORDER BY stock_value_at_cost_inr DESC NULLS LAST;
```

SKUs with zero recent demand return NULL cover — list them separately as "no demand in 7 days".

## 6. `get_wastage`

```sql
WITH w AS (
  SELECT w.reason, k.l2_category, sum(w.wasted_qty) AS units, sum(w.value_at_cost_inr) AS wastage_inr
  FROM fact_wastage w JOIN dim_sku k USING (sku_id)
  WHERE w.store_id = $store_id AND w.date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL),
s AS (
  SELECT k.l2_category, sum(i.sold_qty * k.base_selling_price) AS sales_inr
  FROM fact_inventory_daily i JOIN dim_sku k USING (sku_id)
  WHERE i.store_id = $store_id AND i.date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL)
SELECT w.*, w.wastage_inr / nullif(s.sales_inr, 0) AS wastage_pct_of_sales
FROM w LEFT JOIN s USING (l2_category) ORDER BY wastage_inr DESC;
```

## 7. `get_vendor_fill_rate`

```sql
SELECT p.vendor_id, v.vendor_name, v.vendor_type, v.contracted_fill_rate,
       count(DISTINCT p.store_id) AS stores, count(*) AS po_lines,
       sum(p.qty_received) / sum(p.qty_ordered) AS fill_rate,
       avg((p.qty_received = 0)::INT) AS zero_fill_line_share
FROM fact_purchase_orders p JOIN dim_vendor v USING (vendor_id) JOIN dim_store s USING (store_id)
WHERE p.po_date BETWEEN $start::DATE AND $end::DATE
  AND ($city_id IS NULL OR s.city_id = $city_id)
GROUP BY ALL ORDER BY fill_rate;
```

Compare `fill_rate` with `contracted_fill_rate`; split by month to see if a vendor is recovering.
`received_date` equals the expected date when anything arrives, so lateness cannot be measured — only shortfall.

## 8. `get_cold_chain_status`

```sql
SELECT zone, count(*) AS readings, sum((temperature_c IS NULL)::INT) AS sensor_gaps,
       sum(CASE WHEN zone = 'Chiller' AND temperature_c > 5 THEN 1
                WHEN zone = 'Freezer' AND temperature_c > -15 THEN 1 ELSE 0 END) AS breach_hours,
       count(DISTINCT CASE WHEN (zone = 'Chiller' AND temperature_c > 5) OR (zone = 'Freezer' AND temperature_c > -15)
                           THEN CAST(reading_at AS DATE) END) AS breach_days,
       avg(temperature_c) AS avg_temp_c, max(temperature_c) AS max_temp_c
FROM fact_cold_chain_temperature_hourly
WHERE store_id = $store_id AND CAST(reading_at AS DATE) BETWEEN $start::DATE AND $end::DATE
GROUP BY zone;
```

Link to `fact_wastage` rows with reason = 'Cold chain breach' on the same dates.

## 9. `get_cross_store_imbalance`

```sql
WITH last7 AS (
  SELECT i.store_id, i.sku_id, avg(i.sold_qty + i.lost_demand_units) AS demand,
         sum((i.oos_minutes > 0)::INT) AS oos_days, arg_max(i.closing_qty, i.date) AS closing_qty
  FROM fact_inventory_daily i JOIN dim_store s USING (store_id)
  WHERE s.city_id = $city_id AND i.date BETWEEN $as_of::DATE - INTERVAL 6 DAY AND $as_of::DATE
  GROUP BY ALL)
SELECT a.sku_id, k.sku_name, a.store_id AS short_store, b.store_id AS long_store,
       a.oos_days, b.closing_qty / nullif(b.demand, 0) AS long_store_cover_days,
       least(b.closing_qty - ceil(b.demand * 3), ceil(a.demand * 2)) AS movable_units
FROM last7 a JOIN last7 b ON a.sku_id = b.sku_id AND a.store_id <> b.store_id
JOIN dim_sku k ON k.sku_id = a.sku_id
WHERE a.oos_days >= 3 AND b.closing_qty / nullif(b.demand, 0) > 10 AND NOT k.is_perishable
ORDER BY a.oos_days DESC, long_store_cover_days DESC LIMIT 50;
```

Only suggest transfers for non-perishables and where `movable_units > 0`; note transfer cost is not in the data.

## 10. `recommend_reorder` — arithmetic

```
demand_forecast  = avg(sold + lost) last 7 days, × promo/festival uplift if one is scheduled
target_level     = demand_forecast × (lead_time_days + 1) × cover_factor + safety_stock
safety_stock     = 1.4 × sqrt(demand_forecast) × sqrt(lead_time_days + 1)
order_qty        = max(0, target_level − closing_qty − pipeline_qty), rounded up to case_pack
cap (perishable) = demand_forecast × (shelf_life_days − 0.5)
```

Show every input used. `pipeline_qty` = ordered but not yet received (PO lines with expected date > as_of).
