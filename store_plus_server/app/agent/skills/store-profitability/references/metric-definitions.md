# Store profitability — metric definitions and SQL

All SQL is DuckDB, runs through `db.py`, and uses named parameters (`$store_id`, `$start`, `$end`).
Only delivered orders are sales. Amounts are INR, tax-inclusive.

## 1. Definitions

| Metric | Formula |
|---|---|
| GOV | item_value + delivery_fee + small_cart_fee + handling_fee + late_night_fee + rain_surge_fee |
| AOV | GOV ÷ delivered orders |
| Product margin | Σ quantity × (unit_selling_price − unit_cost) over delivered lines |
| Customer fees | delivery + small cart + handling + late night + rain surge fees |
| Ad income | fact_store_finance_daily.ad_income_inr |
| Variable order cost | coupon_discount + rider_payout_inr + packaging_cost_inr + payment_gateway_cost_inr + refund_inr |
| Wastage | Σ fact_wastage.value_at_cost_inr |
| Store opex | rent + staff + electricity + housekeeping_security + maintenance + inbound_logistics + it_connectivity + other_opex |
| Contribution before opex (CBO) | product margin + fees + ad income − variable cost − wastage |
| CBO per order | CBO ÷ delivered orders |
| **Store contribution** | CBO − store opex |
| Contribution % | store contribution ÷ GOV |
| Break-even orders/day | store opex per day ÷ CBO per order (undefined if CBO per order ≤ 0) |
| Break-even gap | break-even orders/day − actual orders/day |

One-offs (`one_time_capex_inr`, `local_marketing_inr`) are **excluded** from run-rate contribution and reported separately.

## 2. Build the daily mart once (start-up)

```sql
CREATE OR REPLACE TABLE mart_store_day_pnl AS
WITH o AS (
  SELECT store_id, business_date AS date, count(*) AS orders, sum(gov) AS gov, sum(item_value) AS item_value,
         sum(delivery_fee + small_cart_fee + handling_fee + late_night_fee + rain_surge_fee) AS customer_fees,
         sum(coupon_discount) AS coupons, sum(rider_payout_inr) AS rider_cost,
         sum(packaging_cost_inr) AS packaging_cost, sum(payment_gateway_cost_inr) AS payment_cost,
         sum(refund_inr) AS refunds
  FROM fact_orders WHERE order_status = 'Delivered' GROUP BY ALL),
m AS (
  SELECT o.store_id, o.business_date AS date,
         sum(i.quantity * (i.unit_selling_price - i.unit_cost)) AS product_margin
  FROM fact_order_items i JOIN fact_orders o USING (order_id)
  WHERE o.order_status = 'Delivered' GROUP BY ALL),
w AS (SELECT store_id, date, sum(value_at_cost_inr) AS wastage FROM fact_wastage GROUP BY ALL)
SELECT f.store_id, f.date,
       coalesce(o.orders, 0) AS orders, coalesce(o.gov, 0) AS gov, coalesce(o.item_value, 0) AS item_value,
       coalesce(m.product_margin, 0) AS product_margin, coalesce(o.customer_fees, 0) AS customer_fees,
       f.ad_income_inr AS ad_income, coalesce(o.coupons, 0) AS coupons, coalesce(o.rider_cost, 0) AS rider_cost,
       coalesce(o.packaging_cost, 0) AS packaging_cost, coalesce(o.payment_cost, 0) AS payment_cost,
       coalesce(o.refunds, 0) AS refunds, coalesce(w.wastage, 0) AS wastage,
       f.rent_inr AS rent, f.staff_cost_inr AS staff, f.electricity_cost_inr AS electricity,
       f.inbound_logistics_inr AS inbound_logistics,
       f.housekeeping_security_inr + f.maintenance_inr + f.it_connectivity_inr + f.other_opex_inr AS other_opex,
       f.one_time_capex_inr AS one_time_capex, f.local_marketing_inr AS local_marketing
FROM fact_store_finance_daily f
LEFT JOIN o USING (store_id, date) LEFT JOIN m USING (store_id, date) LEFT JOIN w USING (store_id, date);
```

## 3. `get_store_pnl` — all stores (filter in Python, or add `WHERE store_id = $store_id`)

```sql
WITH p AS (
  SELECT store_id, count(*) AS days, sum(orders) AS orders, sum(gov) AS gov, sum(product_margin) AS product_margin,
         sum(customer_fees) AS customer_fees, sum(ad_income) AS ad_income,
         sum(coupons + rider_cost + packaging_cost + payment_cost + refunds) AS variable_cost,
         sum(rider_cost) AS rider_cost, sum(coupons) AS coupons, sum(refunds) AS refunds, sum(wastage) AS wastage,
         sum(rent) AS rent, sum(staff) AS staff, sum(electricity) AS electricity,
         sum(inbound_logistics) AS inbound_logistics, sum(other_opex) AS other_opex,
         sum(rent + staff + electricity + inbound_logistics + other_opex) AS opex,
         sum(one_time_capex + local_marketing) AS one_offs
  FROM mart_store_day_pnl WHERE date BETWEEN $start::DATE AND $end::DATE GROUP BY store_id)
SELECT s.store_code, s.locality, s.store_format, p.*,
       p.orders / p.days AS orders_per_day, p.gov / p.orders AS aov,
       p.product_margin + p.customer_fees + p.ad_income - p.variable_cost - p.wastage AS cbo,
       (p.product_margin + p.customer_fees + p.ad_income - p.variable_cost - p.wastage) / p.orders AS cbo_per_order,
       p.product_margin + p.customer_fees + p.ad_income - p.variable_cost - p.wastage - p.opex AS contribution,
       100 * (p.product_margin + p.customer_fees + p.ad_income - p.variable_cost - p.wastage - p.opex) / p.gov
         AS contribution_pct
FROM p JOIN dim_store s USING (store_id)
ORDER BY contribution_pct;
```

## 4. `get_break_even`

```sql
WITH p AS (
  SELECT count(*) AS days, sum(orders) AS orders,
         sum(product_margin + customer_fees + ad_income - coupons - rider_cost - packaging_cost
             - payment_cost - refunds - wastage) AS cbo,
         sum(rent + staff + electricity + inbound_logistics + other_opex) AS opex
  FROM mart_store_day_pnl
  WHERE store_id = $store_id AND date BETWEEN $start::DATE AND $end::DATE)
SELECT orders / days AS actual_orders_per_day, opex / days AS opex_per_day, cbo / orders AS cbo_per_order,
       CASE WHEN cbo > 0 THEN (opex / days) / (cbo / orders) END AS break_even_orders_per_day,
       CASE WHEN cbo > 0 THEN (opex / days) / (cbo / orders) - orders / days END AS break_even_gap
FROM p;
```

If `cbo_per_order ≤ 0` the store loses money on every order before fixed costs; report "no break-even
volume exists at current unit economics" instead of a number.

## 5. `get_cost_breakdown` — per-order lines with format peers

```sql
WITH per AS (
  SELECT d.store_id, s.store_format, sum(orders) AS orders,
         sum(rent) / sum(orders) AS rent_po, sum(staff) / sum(orders) AS staff_po,
         sum(electricity) / sum(orders) AS electricity_po, sum(inbound_logistics) / sum(orders) AS inbound_po,
         sum(other_opex) / sum(orders) AS other_opex_po, sum(rider_cost) / sum(orders) AS rider_po,
         sum(coupons) / sum(orders) AS coupons_po, sum(packaging_cost) / sum(orders) AS packaging_po,
         sum(refunds) / sum(orders) AS refunds_po, sum(wastage) / sum(orders) AS wastage_po,
         sum(product_margin) / sum(orders) AS margin_po, sum(customer_fees) / sum(orders) AS fees_po,
         sum(ad_income) / sum(orders) AS ads_po
  FROM mart_store_day_pnl d JOIN dim_store s USING (store_id)
  WHERE date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL)
SELECT p.*, percent_rank() OVER (PARTITION BY store_format ORDER BY rent_po) AS rent_pctile,
       percent_rank() OVER (PARTITION BY store_format ORDER BY staff_po) AS staff_pctile,
       median(rent_po) OVER (PARTITION BY store_format) AS rent_po_format_median,
       median(staff_po) OVER (PARTITION BY store_format) AS staff_po_format_median,
       median(rider_po) OVER (PARTITION BY store_format) AS rider_po_format_median,
       median(margin_po) OVER (PARTITION BY store_format) AS margin_po_format_median
FROM per p ORDER BY store_id;
```

## 6. `get_pnl_trend` — weekly

```sql
SELECT date_trunc('week', date) AS week, sum(orders) / count(*) AS orders_per_day,
       100 * sum(product_margin + customer_fees + ad_income - coupons - rider_cost - packaging_cost - payment_cost
                 - refunds - wastage - rent - staff - electricity - inbound_logistics - other_opex) / sum(gov)
         AS contribution_pct,
       sum(product_margin + customer_fees + ad_income - coupons - rider_cost - packaging_cost - payment_cost
           - refunds - wastage) / sum(orders) AS cbo_per_order
FROM mart_store_day_pnl WHERE store_id = $store_id GROUP BY ALL ORDER BY week;
```

Ignore partial first/last weeks when judging direction; require 3 consecutive weeks to call a trend.

## 7. `run_sensitivity` — arithmetic, no SQL

Using `get_store_pnl` per-day values:

```
orders'      = orders_per_day × (1 + orders_pct)
cbo_po'      = cbo_per_order + cpo_delta_inr
opex'        = opex_per_day × (1 + opex_pct) + staff_per_day × staff_pct
contribution'= orders' × cbo_po' − opex'
```

Scale variable lines with volume; keep opex fixed unless a lever changes it. Report the lever value that
reaches break-even, e.g. "+18% orders" or "+₹9 per order" or "−₹6,500 rent per day".

## 8. Data notes

- Stores with fewer days (launched or closed in the period) — always divide by `days`, never by 92.
- 3 SKUs have missing `cost_price` in `dim_sku`; order lines carry `unit_cost`, so the mart is unaffected.
- Business day runs 06:00–01:59; `business_date` already handles post-midnight orders.
