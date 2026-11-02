# Experiment analysis — methods

DuckDB SQL via `db.py`, named parameters `$experiment_id`, `$store_ids` (list), `$start`, `$end`, `$pre_start`,
`$pre_end`, `$post_start`, `$post_end`.

## 1. Windows

| Window | Rule |
|---|---|
| Pre | Up to 28 days immediately before `start_date` (shorter if the store opened later; minimum 14 days) |
| Transition | First 3 days after `start_date` — excluded (staff learning, stock settling) |
| Post | Day 4 after start → `planned_end_date` or last data date, whichever is earlier |
| After-end | Days after `planned_end_date` — analyse separately for persistence (e.g. marketing carry-over) |

Use the **same calendar windows** for treated and control stores.

## 2. Experiment and store context

```sql
SELECT e.*, s.store_code, s.city_id, s.store_format, s.launch_date, s.closure_date
FROM log_experiments e JOIN dim_store s ON s.store_id = e.treatment_store_id
WHERE e.experiment_id = $experiment_id;
```

`suggested_control_store_ids` and `additional_treatment_store_ids` are comma-separated text — split them in
Python. Some experiments have no suggested controls; then pick controls yourself (section 3) or, for
network changes that affect a pair of stores, analyse the **pair combined** before vs after.

## 3. Control selection

1. Candidates: suggested controls; else stores in the same city, then same format, open for the whole
   pre+post window.
2. Exclude stores that: run their own experiment in the window; are treated stores; launched/closed in
   the window; or have a confounder the treated store does not (section 6).
3. Pre-trend check: compute the daily metric for the pre window; for each candidate, the mean of
   `(treated − candidate) / candidate` should be stable — slope of the daily gap ≈ 0 and
   |pre_trend_gap_pct change between first and second half of pre| < 5 pts. Keep the best 2–4.
4. Control series = average of the kept controls per day (equal weights).

## 4. Difference-in-differences

With daily series `T_d` (treated) and `C_d` (control average):

```
before_after_change = mean(T, post) − mean(T, pre)
did_effect          = [mean(T, post) − mean(T, pre)] − [mean(C, post) − mean(C, pre)]
did_effect_pct      = did_effect ÷ mean(T, pre)
```

For ratio metrics (rates, %) compute DiD in percentage points.

Uncertainty — use the daily gap `G_d = T_d − C_d`:

```
did_effect ≈ mean(G, post) − mean(G, pre)
se          = sqrt(var(G, pre) / n_pre + var(G, post) / n_post)
ci90        = did_effect ± 1.645 × se
```

Day-to-day autocorrelation makes this optimistic; if the interval is borderline, re-run with weekly means
(and fewer degrees of freedom) or a block bootstrap by week, and report the wider interval.

SQL helper — given a daily series table `series(store_id, date, value)`:

```sql
WITH t AS (SELECT date, value FROM series WHERE store_id = $treated_id),
c AS (SELECT date, avg(value) AS value FROM series WHERE list_contains($control_ids, store_id) GROUP BY date),
g AS (SELECT t.date, t.value AS treated, c.value AS control, t.value - c.value AS gap,
             CASE WHEN t.date BETWEEN $pre_start::DATE AND $pre_end::DATE THEN 'pre'
                  WHEN t.date BETWEEN $post_start::DATE AND $post_end::DATE THEN 'post' END AS win
      FROM t JOIN c USING (date))
SELECT win, count(*) AS days, avg(treated) AS treated, avg(control) AS control, avg(gap) AS gap,
       var_samp(gap) AS gap_var
FROM g WHERE win IS NOT NULL GROUP BY win;
```

## 5. Minimum effect of interest

State it up front from the hypothesis or the cost: e.g. "a ₹2,400/day picker cost needs ≥ N extra orders/day
at the store's contribution per order". An interval that includes 0 but rules out the minimum effect →
`no_effect`; one that includes both → `inconclusive`.

## 6. Confounder checks

| Confounder | Query / source | Concern when |
|---|---|---|
| Rival store opening | dim_competitor_store within 3 km of treated or control, open_date in pre/post window | Opens near one group only |
| Festival | dim_calendar.festival_name in post window, city-specific | Treated and controls in different cities |
| Weather | fact_weather_daily rain by city | Different cities with different rain in post |
| Promotions | dim_promotion city_scope / SKUs overlapping the metric | Promo hits treated city or SKUs only |
| Coverage change | dim_store_hex_coverage valid_from in window | Catchment changed for a store in either group |
| Launch / closure nearby | dim_store launch_date / closure_date in window, same city | Demand shifts between stores |
| Other experiments | log_experiments overlapping dates on the same stores | Two treatments at once |

Rival openings near a store (adapt radius):

```sql
SELECT s.store_id, s.store_code, c.brand, c.open_date,
       6371 * 2 * asin(sqrt(pow(sin(radians(c.latitude - s.latitude) / 2), 2)
         + cos(radians(s.latitude)) * cos(radians(c.latitude)) * pow(sin(radians(c.longitude - s.longitude) / 2), 2)))
         AS km
FROM dim_store s JOIN dim_competitor_store c ON c.city_id = s.city_id
WHERE list_contains($store_ids, s.store_id) AND c.open_date BETWEEN $start::DATE AND $end::DATE
  AND 6371 * 2 * asin(sqrt(pow(sin(radians(c.latitude - s.latitude) / 2), 2)
      + cos(radians(s.latitude)) * cos(radians(c.latitude)) * pow(sin(radians(c.longitude - s.longitude) / 2), 2))) <= 3
ORDER BY c.open_date;
```

Handling: if a confounder hits one group, (a) swap in controls that share it, (b) split the post window at
the confounder date and estimate the effect on the clean part, or (c) report `confounded` with both
estimates. Never silently ignore it.

## 7. Financial impact

```
incremental_contribution/day = Δorders/day × contribution per order before running costs (store-profitability)
                             + Δ(cost lines)/day  (e.g. wastage saved, power saved, margin given up, coupons spent)
net/day     = incremental_contribution/day − recurring_cost_inr_per_day
payback     = one_time_cost_inr ÷ net/day   (only if net/day > 0)
```

Use measured deltas from DiD for every term; label any term you could not measure.

## 8. Verdict decision order

1. Data sufficient? (≥ 14 pre and ≥ 14 post days, controls valid) — else `inconclusive`.
2. Confounder unresolved and comparable in size to the effect? — `confounded`.
3. Interval excludes 0 in expected direction?
   - net/day ≥ 0 or non-financial goal met → `worked`
   - net/day < 0 and payback > 180 days → `costs_exceed_benefits`
4. Interval includes 0 and excludes the minimum effect of interest → `no_effect`; otherwise `inconclusive`.
