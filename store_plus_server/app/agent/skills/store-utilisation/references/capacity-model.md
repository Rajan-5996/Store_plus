# Store utilisation — capacity model and SQL

DuckDB SQL via `db.py`, named parameters `$store_id`, `$start`, `$end`.

## 1. Concepts

| Term | Meaning | Source |
|---|---|---|
| Potential orders | Orders customers attempted in the hour | fact_store_hourly_ops.potential_orders |
| Accepted orders | Orders the store could take | orders_accepted |
| Staffed capacity | Throughput possible with the people/riders on the floor (minimum of picking, packing, rider capacity) | processing_capacity_orders |
| Design capacity | Engineering ceiling of the building at full staffing | dim_store.design_capacity_orders_per_hour |
| Staffed utilisation | accepted ÷ staffed capacity | hourly or summed |
| Design utilisation | accepted ÷ (design capacity × operating hours) | 20 operating hours/day |
| Busy mode | Store throttles serviceability when load nears capacity | busy_mode_minutes |
| Lost share | orders_lost_busy_mode ÷ potential_orders | |
| Peak-hour share | orders in busiest hour ÷ daily orders | |
| Abandoned (OOS) | baskets dropped because items were out of stock | fact_store_sessions_daily.orders_abandoned_oos |

Interpretation grid:

| Staffed util. | Design util. | Reading |
|---|---|---|
| high | low | Staff sized tightly to weak demand — building is oversized |
| high | high | Genuinely busy store; check busy mode |
| low | low | Idle staff and idle building — demand problem or over-rostering |
| low | high | Rare; check data |

## 2. `get_utilisation_summary`

```sql
WITH h AS (
  SELECT h.store_id, h.date, sum(h.potential_orders) AS potential, sum(h.orders_accepted) AS accepted,
         sum(h.orders_lost_busy_mode) AS lost_busy, sum(h.busy_mode_minutes) AS busy_minutes,
         sum(h.processing_capacity_orders) AS staffed_capacity, max(h.orders_accepted) AS peak_hour_orders,
         count(*) AS hours
  FROM fact_store_hourly_ops h
  WHERE h.store_id = $store_id AND h.date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL)
SELECT count(*) AS days, avg(accepted) AS orders_per_day, avg(busy_minutes) AS busy_minutes_per_day,
       avg(lost_busy) AS lost_orders_per_day, sum(lost_busy) / sum(potential) AS lost_share,
       sum(accepted) / sum(staffed_capacity) AS staffed_utilisation,
       sum(accepted) / (sum(hours) * max(d.design_capacity_orders_per_hour)) AS design_utilisation,
       avg(peak_hour_orders / accepted) AS peak_hour_share
FROM h JOIN dim_store d USING (store_id);
```

## 3. `get_hourly_profile`

```sql
SELECT h.hour,
       avg(h.potential_orders) AS potential, avg(h.orders_accepted) AS accepted,
       avg(h.processing_capacity_orders) AS staffed_capacity,
       sum(h.orders_accepted) / sum(h.processing_capacity_orders) AS staffed_utilisation,
       avg(h.busy_mode_minutes) AS busy_minutes, avg(h.orders_lost_busy_mode) AS lost_orders,
       avg(h.pickers_on_floor) AS pickers, avg(h.packers_on_floor) AS packers, avg(h.riders_available) AS riders,
       avg(h.avg_pick_queue_wait_min) AS pick_queue_min
FROM fact_store_hourly_ops h JOIN dim_calendar c USING (date)
WHERE h.store_id = $store_id AND h.date BETWEEN $start::DATE AND $end::DATE
  AND ($day_type = 'all' OR ($day_type = 'weekend') = c.is_weekend)
GROUP BY h.hour
ORDER BY CASE WHEN h.hour < 6 THEN h.hour + 24 ELSE h.hour END;
```

`$day_type` ∈ `'all' | 'weekday' | 'weekend'`.

## 4. `get_binding_constraint`

Busy mode says *that* capacity ran out; stage waits say *which* resource ran out.

```sql
WITH o AS (
  SELECT hour(order_created_at) AS hour,
         avg(epoch(picking_started_at - order_accepted_at) / 60) AS pick_queue_min,
         avg(epoch(dispatched_at - packed_at) / 60) AS rider_wait_min,
         count(*) / count(DISTINCT business_date) AS orders_per_day
  FROM fact_orders
  WHERE store_id = $store_id AND order_status = 'Delivered'
    AND business_date BETWEEN $start::DATE AND $end::DATE
  GROUP BY ALL),
h AS (
  SELECT hour, avg(busy_mode_minutes) AS busy_minutes,
         100 * sum(pickers_on_floor) / nullif(sum(orders_accepted), 0) AS pickers_per_100_orders,
         100 * sum(riders_available) / nullif(sum(orders_accepted), 0) AS riders_per_100_orders
  FROM fact_store_hourly_ops
  WHERE store_id = $store_id AND date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL)
SELECT h.*, o.pick_queue_min, o.rider_wait_min, o.orders_per_day
FROM h JOIN o USING (hour)
ORDER BY CASE WHEN hour < 6 THEN hour + 24 ELSE hour END;
```

Decision rule for hours with busy_minutes ≥ 15:

| Signal | Binding resource |
|---|---|
| pick_queue_min ≥ 2 × store's own off-peak level and rider_wait not elevated | Pickers (picking capacity) |
| rider_wait_min ≥ 1.5 × off-peak level and pick queue normal | Riders |
| both elevated | Overall capacity |
| neither elevated | Packing or demand spike; report as unclear |

Compare to network medians too (current data: pick queue ≈ 0.16 min, rider wait after packing ≈ 1.4 min).

## 5. `get_demand_pattern`

```sql
SELECT c.day_of_week, avg(t.orders) AS orders,
       avg(t.orders) / avg(avg(t.orders)) OVER () AS index_vs_avg
FROM (SELECT date, sum(orders_accepted) AS orders FROM fact_store_hourly_ops
      WHERE store_id = $store_id GROUP BY date) t
JOIN dim_calendar c USING (date)
GROUP BY c.day_of_week ORDER BY index_vs_avg DESC;
```

Weekly trend (slope as % of mean per week):

```sql
WITH d AS (SELECT date, sum(orders_accepted) AS orders FROM fact_store_hourly_ops
           WHERE store_id = $store_id GROUP BY date),
w AS (SELECT date_trunc('week', date) AS week, avg(orders) AS orders FROM d GROUP BY ALL)
SELECT 100 * regr_slope(orders, epoch(week) / 604800) / avg(orders) AS trend_pct_per_week,
       count(*) AS weeks FROM w;
```

Exclude weeks containing festivals before judging trend if they distort the slope.

## 6. `get_lost_demand`

```sql
SELECT count(*) AS days, avg(orders_placed) AS orders_placed_per_day,
       avg(orders_lost_busy_mode) AS lost_busy_per_day, avg(orders_abandoned_oos) AS abandoned_oos_per_day,
       sum(orders_lost_busy_mode) / sum(orders_placed) AS lost_busy_pct_of_orders,
       sum(orders_abandoned_oos) / sum(orders_placed) AS abandoned_pct_of_orders,
       sum(orders_placed) / sum(app_sessions) AS conversion
FROM fact_store_sessions_daily
WHERE store_id = $store_id AND date BETWEEN $start::DATE AND $end::DATE;
```

## 7. `compare_utilisation` — all stores

```sql
WITH s AS (
  SELECT h.store_id, count(DISTINCT h.date) AS days, sum(h.orders_accepted) AS accepted,
         sum(h.potential_orders) AS potential, sum(h.orders_lost_busy_mode) AS lost,
         sum(h.busy_mode_minutes) AS busy, sum(h.processing_capacity_orders) AS cap, count(*) AS hours
  FROM fact_store_hourly_ops h WHERE h.date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL)
SELECT d.store_code, d.locality, d.store_format, date_diff('day', d.launch_date, $end::DATE) AS age_days,
       accepted / days AS orders_per_day, busy / days AS busy_minutes_per_day, lost / potential AS lost_share,
       accepted / cap AS staffed_utilisation, accepted / (hours * d.design_capacity_orders_per_hour) AS design_utilisation,
       median(accepted / (hours * d.design_capacity_orders_per_hour)) OVER (PARTITION BY d.store_format)
         AS design_util_format_median,
       median(busy / days) OVER () AS busy_network_median
FROM s JOIN dim_store d USING (store_id)
ORDER BY design_utilisation;
```

## 8. Sizing

- **Recoverable orders (constrained store)** = orders_lost_busy_mode per day in the binding hours.
  Value at the store's contribution per order before running costs (from store-profitability), labelled estimate.
- **Idle capacity (under-utilised)** = (design capacity × 20 h − accepted) per day. Report as headroom,
  not as achievable demand.

## 9. Data notes

- `processing_capacity_orders` already reflects absenteeism and rider availability that hour.
- Rainy days reduce rider supply city-wide; join `fact_weather_daily` (city_id from dim_store) when busy mode spikes.
- Stores launched or closed mid-period have fewer days; always divide by observed days.
