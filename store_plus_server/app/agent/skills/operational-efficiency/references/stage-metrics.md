# Operational efficiency — stage metrics and SQL

DuckDB SQL via `db.py`, named parameters `$store_id`, `$start`, `$end`.

## 1. Order stages

```
created → accepted → picking_started → picking_completed → packed → dispatched → delivered
   accept    pick_queue        pick             pack        rider_wait     travel
```

| Stage | Formula (minutes) |
|---|---|
| accept | order_accepted_at − order_created_at |
| pick_queue | picking_started_at − order_accepted_at |
| pick | picking_completed_at − picking_started_at |
| pack | packed_at − picking_completed_at |
| rider_wait | dispatched_at − packed_at (rider not yet at store) |
| travel | delivered_at − dispatched_at |
| order_to_door | delivered_at − order_created_at |
| late | order_to_door > promised_eta_min |
| pick per line | pick ÷ unique_sku_count |

Delivered orders only for timings. Exclude rows with NULL `picking_completed_at` from pick and pack.

## 2. Build an order-stage view once

```sql
CREATE OR REPLACE VIEW v_order_stages AS
SELECT order_id, store_id, business_date, hour(order_created_at) AS hour, picker_id, rider_id,
       unique_sku_count, item_count, delivery_distance_km, promised_eta_min, store_busy_mode_at_order,
       raining_at_order, customer_rating, complaint_reason,
       epoch(order_accepted_at - order_created_at) / 60 AS accept_min,
       epoch(picking_started_at - order_accepted_at) / 60 AS pick_queue_min,
       epoch(picking_completed_at - picking_started_at) / 60 AS pick_min,
       epoch(packed_at - picking_completed_at) / 60 AS pack_min,
       epoch(dispatched_at - packed_at) / 60 AS rider_wait_min,
       epoch(delivered_at - dispatched_at) / 60 AS travel_min,
       epoch(delivered_at - order_created_at) / 60 AS order_to_door_min
FROM fact_orders WHERE order_status = 'Delivered';
```

## 3. `get_stage_times`

```sql
SELECT count(*) AS orders,
       median(accept_min) AS accept, median(pick_queue_min) AS pick_queue, median(pick_min) AS pick,
       median(pack_min) AS pack, median(rider_wait_min) AS rider_wait, median(travel_min) AS travel,
       median(order_to_door_min) AS order_to_door_p50,
       quantile_cont(order_to_door_min, 0.9) AS order_to_door_p90,
       quantile_cont(pick_min, 0.9) AS pick_p90,
       avg((order_to_door_min <= promised_eta_min)::INT) AS on_time_rate
FROM v_order_stages
WHERE store_id = $store_id AND business_date BETWEEN $start::DATE AND $end::DATE;
```

Network / format medians: run the same per store (GROUP BY store_id), join `dim_store`, take
`median(...) OVER (PARTITION BY store_format)`.

## 4. `get_stage_times_by_hour`

```sql
SELECT hour, count(*) / count(DISTINCT business_date) AS orders_per_day,
       median(pick_queue_min) AS pick_queue, median(pick_min) AS pick, median(pack_min) AS pack,
       median(rider_wait_min) AS rider_wait, median(travel_min) AS travel,
       avg((order_to_door_min <= promised_eta_min)::INT) AS on_time_rate,
       avg(store_busy_mode_at_order::INT) AS busy_share
FROM v_order_stages
WHERE store_id = $store_id AND business_date BETWEEN $start::DATE AND $end::DATE
GROUP BY hour ORDER BY CASE WHEN hour < 6 THEN hour + 24 ELSE hour END;
```

## 5. `get_picker_productivity`

```sql
WITH p AS (
  SELECT picker_id, count(*) AS orders, count(DISTINCT business_date) AS days_worked,
         median(pick_min) AS pick_min, median(pick_min / unique_sku_count) AS pick_min_per_line
  FROM v_order_stages
  WHERE store_id = $store_id AND business_date BETWEEN $start::DATE AND $end::DATE AND pick_min IS NOT NULL
  GROUP BY picker_id)
SELECT p.*, e.shift_code, e.employment_type,
       p.pick_min_per_line / median(p.pick_min_per_line) OVER () AS vs_store_median,
       (p.pick_min_per_line / median(p.pick_min_per_line) OVER () >= 1.25 AND p.orders >= 200) AS slow_flag
FROM p LEFT JOIN dim_employee e ON e.employee_id = p.picker_id
ORDER BY vs_store_median DESC;
```

Use per-line time so pickers with bigger baskets are not penalised. Require ≥ 200 orders before flagging.

## 6. `get_staffing_health`

```sql
SELECT role, shift_code, count(*) AS rostered_shifts,
       avg((attendance_status = 'Present')::INT) AS attendance_rate,
       sum(overtime_hours) AS overtime_hours, sum(shift_cost_inr) AS cost_inr
FROM fact_staff_shifts
WHERE store_id = $store_id AND date BETWEEN $start::DATE AND $end::DATE
GROUP BY ALL ORDER BY role, shift_code;
```

Pickers on the floor versus orders, by hour (orders per picker-hour):

```sql
SELECT hour, avg(pickers_on_floor) AS pickers, avg(orders_accepted) AS orders,
       sum(orders_accepted) / nullif(sum(pickers_on_floor), 0) AS orders_per_picker_hour,
       avg(avg_pick_queue_wait_min) AS pick_queue_min, avg(busy_mode_minutes) AS busy_minutes
FROM fact_store_hourly_ops
WHERE store_id = $store_id AND date BETWEEN $start::DATE AND $end::DATE
GROUP BY hour ORDER BY CASE WHEN hour < 6 THEN hour + 24 ELSE hour END;
```

Hours where orders per picker-hour sits far above the store's own daytime level, with a growing pick queue,
are understaffed hours.

## 7. `get_delivery_performance`

```sql
SELECT w.heavy_rain_flag, (w.rain_mm >= 10) AS rainy, count(*) AS orders,
       median(o.delivery_distance_km) AS distance_km, median(o.travel_min) AS travel_min,
       median(60 * o.delivery_distance_km / nullif(o.travel_min, 0)) AS speed_kmph,
       median(o.rider_wait_min) AS rider_wait_min,
       avg((o.order_to_door_min > o.promised_eta_min)::INT) AS late_share
FROM v_order_stages o JOIN dim_store s USING (store_id)
JOIN fact_weather_daily w ON w.city_id = s.city_id AND w.date = o.business_date
WHERE o.store_id = $store_id AND o.business_date BETWEEN $start::DATE AND $end::DATE
GROUP BY ALL ORDER BY rainy, heavy_rain_flag;
```

## 8. `get_cancellations_and_complaints`

```sql
SELECT count(*) AS orders, avg((order_status = 'Cancelled')::INT) AS cancel_rate,
       avg(coalesce(cancel_reason = 'Customer cancelled', false)::INT) AS customer_cancel_rate,
       avg(coalesce(cancel_reason = 'Rider unavailable', false)::INT) AS rider_unavailable_rate,
       avg(coalesce(cancel_reason = 'Payment failed', false)::INT) AS payment_failed_rate,
       avg((complaint_reason IS NOT NULL)::INT) AS complaint_rate,
       avg(coalesce(complaint_reason = 'Late delivery', false)::INT) AS late_complaint_rate,
       avg(coalesce(complaint_reason IN ('Missing item', 'Wrong item', 'Damaged item'), false)::INT)
         AS fulfilment_complaint_rate,
       sum(refund_inr) / count(DISTINCT business_date) AS refunds_per_day, avg(customer_rating) AS avg_rating
FROM fact_orders
WHERE store_id = $store_id AND business_date BETWEEN $start::DATE AND $end::DATE;
```

Reason columns are NULL for orders without a cancellation or complaint — wrap equality tests in
`coalesce(..., false)` so rates are over all orders.

## 9. `compare_ops`

```sql
WITH s AS (
  SELECT store_id, median(pick_min) AS pick, median(pick_queue_min) AS pick_queue,
         median(rider_wait_min) AS rider_wait, median(travel_min) AS travel,
         median(order_to_door_min) AS order_to_door,
         avg((order_to_door_min <= promised_eta_min)::INT) AS on_time_rate
  FROM v_order_stages WHERE business_date BETWEEN $start::DATE AND $end::DATE GROUP BY store_id)
SELECT d.store_code, d.locality, d.store_format, s.*,
       median(s.pick) OVER (PARTITION BY d.store_format) AS pick_format_median,
       median(s.on_time_rate) OVER () AS on_time_network_median
FROM s JOIN dim_store d USING (store_id) ORDER BY s.on_time_rate;
```

## 10. Before/after a known change

Run `get_stage_times` for equal windows before and after the change date and report the difference.
For a causal verdict (vs control stores), hand off to experiment-analysis.
