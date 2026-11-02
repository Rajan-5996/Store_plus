# Experiment analysis — metric mapping and daily-series SQL

Every series returns `store_id, date, value` for the stores in `$store_ids` (list) between `$start` and `$end`.
Feed the result to the DiD helper in `methods.md`.

## 1. Which metric for which intervention

| intervention_type | Primary metric(s) | Guardrail / secondary |
|---|---|---|
| Staffing (pickers, packers, shifts) | orders lost to busy mode, busy-mode minutes, pick-queue wait in the target hours | delivered orders/day, staff cost/day |
| Layout (re-slotting, racking) | median pick minutes per line | order-to-door minutes, busy minutes |
| Replenishment (slots, forecast, cover) | OOS rate for the target categories, lost demand units | wastage ₹ for those categories, abandoned baskets |
| Marketing (coupons, geo campaigns) | delivered orders/day | coupon ₹/day, contribution/day, persistence after end |
| Network (zone redraw, radius) | avg delivery distance, order-to-door minutes | **pair-combined** orders/day, rider payout/order |
| Pricing (price match, discounts) | units of the repriced SKUs, store orders/day | product margin ₹/day, margin % |
| Equipment (chillers, freezers) | chiller breach hours, cold-chain wastage ₹ | electricity kWh/day |
| Customer experience (packaging, service) | average rating, complaint rate | packaging cost/order, repeat-order share |

Use the experiment's `primary_metric` text as a hint, then pick the closest series below.

## 2. Daily series SQL

**Delivered orders per day**

```sql
SELECT store_id, business_date AS date, count(*) AS value FROM fact_orders
WHERE list_contains($store_ids, store_id) AND order_status = 'Delivered'
  AND business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL;
```

**Busy-mode minutes / orders lost to busy mode (optionally only target hours)**

```sql
SELECT store_id, date, sum(busy_mode_minutes) AS value FROM fact_store_hourly_ops
WHERE list_contains($store_ids, store_id) AND date BETWEEN $start::DATE AND $end::DATE
  AND (hour BETWEEN $hour_from AND $hour_to) GROUP BY ALL;
```

Swap `busy_mode_minutes` for `orders_lost_busy_mode` or `avg_pick_queue_wait_min` (use `avg`).

**Median pick minutes per line**

```sql
SELECT store_id, business_date AS date,
       median(epoch(picking_completed_at - picking_started_at) / 60 / unique_sku_count) AS value
FROM fact_orders
WHERE list_contains($store_ids, store_id) AND order_status = 'Delivered' AND picking_completed_at IS NOT NULL
  AND business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL;
```

**Order-to-door minutes / on-time rate / delivery distance**

```sql
SELECT store_id, business_date AS date, median(epoch(delivered_at - order_created_at) / 60) AS value
FROM fact_orders
WHERE list_contains($store_ids, store_id) AND order_status = 'Delivered'
  AND business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL;
```

Replace the expression with `avg((epoch(delivered_at - order_created_at) / 60 <= promised_eta_min)::INT)`
or `avg(delivery_distance_km)` or `avg(rider_payout_inr)`.

**OOS rate and lost demand for target categories**

```sql
SELECT i.store_id, i.date, avg((i.oos_minutes > 0)::INT) AS value
FROM fact_inventory_daily i JOIN dim_sku k USING (sku_id)
WHERE list_contains($store_ids, i.store_id) AND list_contains($l2_list, k.l2_category)
  AND i.date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL;
```

Use `sum(i.lost_demand_units)` or `sum(i.oos_minutes)` as alternatives. Derive `$l2_list` from the
experiment text (e.g. dairy & bakery → Milk, Curd & Yogurt, Bread & Buns, Eggs, Paneer, Cheese & Cream).

**Wastage ₹ (all or by reason / storage)**

```sql
SELECT w.store_id, w.date, sum(w.value_at_cost_inr) AS value
FROM fact_wastage w JOIN dim_sku k USING (sku_id)
WHERE list_contains($store_ids, w.store_id) AND w.date BETWEEN $start::DATE AND $end::DATE
  AND ($storage_type IS NULL OR k.storage_type = $storage_type) GROUP BY ALL;
```

Days with no wastage rows are zero — fill missing dates with 0 before DiD.

**Chiller breach hours / electricity**

```sql
SELECT store_id, CAST(reading_at AS DATE) AS date, sum((temperature_c > 5)::INT) AS value
FROM fact_cold_chain_temperature_hourly
WHERE list_contains($store_ids, store_id) AND zone = 'Chiller'
  AND CAST(reading_at AS DATE) BETWEEN $start::DATE AND $end::DATE GROUP BY ALL;
```

```sql
SELECT store_id, date, electricity_kwh AS value FROM fact_store_finance_daily
WHERE list_contains($store_ids, store_id) AND date BETWEEN $start::DATE AND $end::DATE;
```

**Coupon spend and campaign orders**

```sql
SELECT store_id, business_date AS date, sum(coupon_discount) AS value FROM fact_orders
WHERE list_contains($store_ids, store_id) AND order_status = 'Delivered'
  AND business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL;
```

`campaign_id IS NOT NULL` identifies campaign orders; share of campaign orders from customers who ordered
before the campaign start = redemptions that were not incremental.

**Rating / complaint rate / repeat share**

```sql
WITH o AS (
  SELECT store_id, business_date, customer_id, customer_rating, complaint_reason,
         row_number() OVER (PARTITION BY store_id, customer_id ORDER BY order_created_at) AS nth
  FROM fact_orders WHERE list_contains($store_ids, store_id) AND order_status = 'Delivered')
SELECT store_id, business_date AS date, avg(customer_rating) AS avg_rating,
       avg((complaint_reason IS NOT NULL)::INT) AS complaint_rate, avg((nth > 1)::INT) AS repeat_share
FROM o WHERE business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL;
```

Pick one column as `value`. Repeat share rises naturally over time in a 92-day window — DiD handles this.

**Pricing: find the repriced SKUs, then their units and margin**

The log does not list which SKUs were repriced. Detect them: SKUs whose treated-store price fell ≥ 3%
after the start date while the same SKU's price at control stores did not.

```sql
WITH p AS (
  SELECT o.store_id, i.sku_id, (o.business_date >= $post_start::DATE) AS post, avg(i.unit_selling_price) AS price
  FROM fact_order_items i JOIN fact_orders o USING (order_id)
  WHERE list_contains($store_ids, o.store_id) AND o.order_status = 'Delivered'
    AND o.business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL),
r AS (SELECT store_id, sku_id, max(CASE WHEN post THEN price END) / max(CASE WHEN NOT post THEN price END) - 1 AS chg
      FROM p GROUP BY ALL)
SELECT t.sku_id, t.chg AS treated_price_change, avg(c.chg) AS control_price_change
FROM r t JOIN r c ON c.sku_id = t.sku_id AND c.store_id <> t.store_id
WHERE t.store_id = $treated_id GROUP BY ALL
HAVING t.chg - avg(c.chg) <= -0.03 ORDER BY treated_price_change;
```

Then series for those SKUs:

```sql
SELECT o.store_id, o.business_date AS date, sum(i.quantity) AS units,
       sum(i.quantity * (i.unit_selling_price - i.unit_cost)) AS margin
FROM fact_order_items i JOIN fact_orders o USING (order_id)
WHERE list_contains($store_ids, o.store_id) AND list_contains($sku_ids, i.sku_id)
  AND o.order_status = 'Delivered' AND o.business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL;
```

**Contribution per day** — reuse `mart_store_day_pnl` from the store-profitability skill
(`product_margin + customer_fees + ad_income − coupons − rider_cost − packaging_cost − payment_cost −
refunds − wastage − rent − staff − electricity − inbound_logistics − other_opex`).

**Network change (pair combined)**

```sql
SELECT business_date AS date, count(*) AS value, avg(delivery_distance_km) AS avg_distance_km
FROM fact_orders WHERE list_contains($store_ids, store_id) AND order_status = 'Delivered'
  AND business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL;
```

Compare the pair's combined orders before vs after with city peers as controls; distance should fall while
combined orders hold.

## 3. Tips

- Fill gaps (dates with no rows) with 0 for count/₹ metrics; leave NULL for averages.
- Exclude closed or launching stores from controls for the windows they were not fully open.
- For hour-targeted interventions, also check the **non-target** hours: an effect there suggests a confounder.
