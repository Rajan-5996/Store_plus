# Network optimisation — geo methods and SQL

DuckDB SQL via `db.py`, named parameters `$store_id`, `$city_id`, `$start`, `$end`, `$as_of`, `$radius_km`.

## 1. Concepts

| Term | Meaning |
|---|---|
| Hex | H3 cell at resolution 8 (≈ 0.74 km², edge ≈ 0.46 km). `hex_id` is the H3 index string |
| Catchment | Hexes a store serves on a date (`dim_store_hex_coverage` valid on that date) |
| Overlap hex | A hex served by ≥ 2 stores on the same date |
| Overlap share | Store's orders delivered to overlap hexes ÷ store's total orders |
| Unserved hex | `is_serviceable = false` — people open the app and see "not serviceable" |
| Far order | delivery_distance_km > 3 (road distance) |
| Nearest-neighbour distance | Straight-line km to the closest other open store in the city |

Haversine (km) used below:

```
6371 * 2 * asin(sqrt(pow(sin(radians(lat2 - lat1) / 2), 2)
       + cos(radians(lat1)) * cos(radians(lat2)) * pow(sin(radians(lon2 - lon1) / 2), 2)))
```

Coverage valid on a date:

```
valid_from <= $as_of::DATE AND (valid_to IS NULL OR valid_to >= $as_of::DATE)
```

## 2. `get_catchment`

```sql
WITH cov AS (
  SELECT * FROM dim_store_hex_coverage
  WHERE valid_from <= $as_of::DATE AND (valid_to IS NULL OR valid_to >= $as_of::DATE)),
shared AS (SELECT hex_id, count(*) AS n_stores FROM cov GROUP BY hex_id)
SELECT c.store_id, count(*) AS hexes, sum(h.population_est) AS population, sum(h.households_est) AS households,
       avg(h.affluence_index) AS avg_affluence, avg(c.distance_km) AS avg_distance_km,
       avg((s.n_stores > 1)::INT) AS share_of_hexes_shared
FROM cov c JOIN dim_hex h USING (hex_id) JOIN shared s USING (hex_id)
WHERE c.store_id = $store_id GROUP BY c.store_id;
```

## 3. `find_overlaps`

```sql
WITH cov AS (
  SELECT c.* FROM dim_store_hex_coverage c JOIN dim_store s USING (store_id)
  WHERE s.city_id = $city_id AND c.valid_from <= $as_of::DATE
    AND (c.valid_to IS NULL OR c.valid_to >= $as_of::DATE)),
pair_hex AS (
  SELECT a.store_id AS store_a, b.store_id AS store_b, a.hex_id
  FROM cov a JOIN cov b ON a.hex_id = b.hex_id AND a.store_id < b.store_id),
ord AS (
  SELECT store_id, delivery_hex_id AS hex_id, count(*) AS orders
  FROM fact_orders
  WHERE order_status = 'Delivered' AND business_date BETWEEN $start::DATE AND $end::DATE GROUP BY ALL),
tot AS (SELECT store_id, sum(orders) AS orders FROM ord GROUP BY store_id),
agg AS (
  SELECT ph.store_a, ph.store_b, count(*) AS shared_hexes, sum(h.population_est) AS shared_population,
         sum(coalesce(oa.orders, 0)) AS shared_orders_a, sum(coalesce(ob.orders, 0)) AS shared_orders_b
  FROM pair_hex ph JOIN dim_hex h USING (hex_id)
  LEFT JOIN ord oa ON oa.store_id = ph.store_a AND oa.hex_id = ph.hex_id
  LEFT JOIN ord ob ON ob.store_id = ph.store_b AND ob.hex_id = ph.hex_id
  GROUP BY ALL)
SELECT g.store_a, sa.store_code AS code_a, g.store_b, sb.store_code AS code_b, g.shared_hexes, g.shared_population,
       6371 * 2 * asin(sqrt(pow(sin(radians(sb.latitude - sa.latitude) / 2), 2)
         + cos(radians(sa.latitude)) * cos(radians(sb.latitude))
         * pow(sin(radians(sb.longitude - sa.longitude) / 2), 2))) AS km_apart,
       g.shared_orders_a / ta.orders AS overlap_share_a, g.shared_orders_b / tb.orders AS overlap_share_b
FROM agg g
JOIN dim_store sa ON sa.store_id = g.store_a JOIN dim_store sb ON sb.store_id = g.store_b
JOIN tot ta ON ta.store_id = g.store_a JOIN tot tb ON tb.store_id = g.store_b
ORDER BY greatest(g.shared_orders_a / ta.orders, g.shared_orders_b / tb.orders) DESC;
```

Choose `$start/$end` inside the same coverage period as `$as_of`, otherwise orders and coverage mismatch.
Run it for **each coverage period** (see section 8): an overlap that was removed by a redraw only appears in
the earlier period, and the before/after comparison is itself evidence.

## 4. `get_unserved_demand`

Pockets are built by snapping unserved hexes to a ~2 km grid.

```sql
WITH u AS (
  SELECT d.hex_id, sum(d.unserviceable_sessions) AS sessions, count(DISTINCT d.date) AS days
  FROM fact_hex_demand_daily d JOIN dim_hex h USING (hex_id)
  WHERE h.city_id = $city_id AND NOT d.is_serviceable AND d.date BETWEEN $start::DATE AND $end::DATE
  GROUP BY d.hex_id),
conv AS (
  SELECT sum(orders_placed) / sum(app_sessions) AS c FROM fact_hex_demand_daily d JOIN dim_hex h USING (hex_id)
  WHERE h.city_id = $city_id AND d.is_serviceable AND d.date BETWEEN $start::DATE AND $end::DATE),
pocket AS (
  SELECT round(h.latitude * 50) / 50 AS cell_lat, round(h.longitude * 50) / 50 AS cell_lon,
         count(*) AS hexes, sum(u.sessions) / max(u.days) AS sessions_per_day, sum(h.households_est) AS households,
         avg(h.affluence_index) AS affluence, avg(h.latitude) AS lat, avg(h.longitude) AS lon
  FROM u JOIN dim_hex h USING (hex_id) GROUP BY ALL)
SELECT p.*, (SELECT c FROM conv) AS assumed_conversion,
       p.sessions_per_day * (SELECT c FROM conv) AS est_potential_orders_per_day_upper_bound,
       (SELECT min(6371 * 2 * asin(sqrt(pow(sin(radians(s.latitude - p.lat) / 2), 2)
          + cos(radians(p.lat)) * cos(radians(s.latitude)) * pow(sin(radians(s.longitude - p.lon) / 2), 2))))
        FROM dim_store s WHERE s.city_id = $city_id AND s.closure_date IS NULL) AS km_to_nearest_store
FROM pocket p WHERE p.sessions_per_day > 0
ORDER BY sessions_per_day DESC LIMIT 15;
```

People who see "not serviceable" convert less than served users, so treat the estimate as an upper bound.

## 5. `get_delivery_footprint`

```sql
SELECT CASE WHEN delivery_distance_km <= 1.5 THEN '0-1.5 km' WHEN delivery_distance_km <= 2.5 THEN '1.5-2.5 km'
            WHEN delivery_distance_km <= 3.5 THEN '2.5-3.5 km' ELSE '>3.5 km' END AS band,
       count(*) AS orders, count(*) / sum(count(*)) OVER () AS share,
       avg(rider_payout_inr) AS rider_payout, avg((epoch(delivered_at - order_created_at) / 60 <= promised_eta_min)::INT)
         AS on_time_rate
FROM fact_orders
WHERE store_id = $store_id AND order_status = 'Delivered' AND business_date BETWEEN $start::DATE AND $end::DATE
GROUP BY band ORDER BY band;
```

## 6. `get_competitor_pressure`

```sql
SELECT c.brand, count(*) AS stores_in_radius,
       sum((c.open_date BETWEEN DATE '2026-08-01' AND $as_of::DATE)::INT) AS opened_in_period,
       min(6371 * 2 * asin(sqrt(pow(sin(radians(c.latitude - s.latitude) / 2), 2)
         + cos(radians(s.latitude)) * cos(radians(c.latitude)) * pow(sin(radians(c.longitude - s.longitude) / 2), 2))))
         AS nearest_km
FROM dim_competitor_store c JOIN dim_store s ON s.city_id = c.city_id
WHERE s.store_id = $store_id AND c.open_date <= $as_of::DATE
  AND 6371 * 2 * asin(sqrt(pow(sin(radians(c.latitude - s.latitude) / 2), 2)
      + cos(radians(s.latitude)) * cos(radians(c.latitude)) * pow(sin(radians(c.longitude - s.longitude) / 2), 2)))
      <= $radius_km
GROUP BY c.brand ORDER BY stores_in_radius DESC;
```

For openings, also list each opening date — then compare the store's daily orders before/after.

## 7. `get_store_density`

```sql
WITH s AS (SELECT * FROM dim_store WHERE city_id = $city_id AND launch_date <= $as_of::DATE
           AND (closure_date IS NULL OR closure_date >= $as_of::DATE))
SELECT a.store_id, a.store_code, a.locality,
       min(6371 * 2 * asin(sqrt(pow(sin(radians(b.latitude - a.latitude) / 2), 2)
         + cos(radians(a.latitude)) * cos(radians(b.latitude)) * pow(sin(radians(b.longitude - a.longitude) / 2), 2))))
         AS nearest_store_km,
       arg_min(b.store_code, 6371 * 2 * asin(sqrt(pow(sin(radians(b.latitude - a.latitude) / 2), 2)
         + cos(radians(a.latitude)) * cos(radians(b.latitude)) * pow(sin(radians(b.longitude - a.longitude) / 2), 2))))
         AS nearest_store
FROM s a JOIN s b ON a.store_id <> b.store_id GROUP BY ALL ORDER BY nearest_store_km;
```

## 8. `get_coverage_changes`

```sql
SELECT c.valid_from, c.valid_to, c.store_id, s.store_code, count(*) AS hexes, sum(c.is_primary::INT) AS primary_hexes
FROM dim_store_hex_coverage c JOIN dim_store s USING (store_id)
WHERE s.city_id = $city_id GROUP BY ALL ORDER BY c.store_id, c.valid_from;
```

Coverage periods in this dataset change on 1 Sep and 1 Oct 2026 for some stores; read them from the data.

## 9. Optional: Python H3

The `h3` Python package (v4) gives neighbours and parents if needed:
`h3.grid_disk(hex_id, k)`, `h3.cell_to_parent(hex_id, 6)`, `h3.cell_to_latlng(hex_id)`.
