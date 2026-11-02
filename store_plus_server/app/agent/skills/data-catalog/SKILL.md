---
name: data-catalog
description: StorePulse data catalog. Tells the agent where every dataset lives, what each table and column means, how tables join, which prebuilt marts exist, which skill owns which table, and the conventions and traps (business date, closed store, delivered-only sales, IST timestamps). Use this skill FIRST, before writing any SQL, and whenever a question needs a table, column, join, metric source or date range you are not sure about — even if the user never mentions "data".
---

# Data catalog

You are querying a **synthetic but internally consistent** quick-commerce dataset for a dark-store network (Instamart style). It is not real Swiggy data. Every table comes from one simulation, so tables reconcile with each other (for example inventory `sold_qty` equals delivered order lines).

- **Period:** 1 Aug 2026 – 31 Oct 2026 (92 days). The last day of data is **2026-10-31**; "today", "latest" and "last 30 days" all mean relative to that date.
- **Scope:** 6 cities, 34 dark stores (28 standard, 5 active megapods, 1 closed), 611 SKUs, 547K customers, 3.8M orders, 17M order lines.
- **Currency:** INR, tax-inclusive. **Timestamps:** IST, no timezone.

## Where the data is

Parquet files under `data/` (relative to the server root), one file per table:

| Folder | Contents | Tables |
|---|---|---|
| `data/dims/` | reference data, logs | 12 (`dim_*`, `log_experiments`) |
| `data/facts/` | events and measurements | 16 (`fact_*`) |

Every parquet file is already registered as a **DuckDB view with the file's name** (for example `fact_orders`). Query with SQL through the `run_sql` tool; never reference file paths. Use `list_tables` and `describe_table` to confirm a column before relying on it.

### Prebuilt marts (in memory, fast — prefer them)

| Table | Grain | Columns |
|---|---|---|
| `store_day` | store × day (3,066 rows) | `store_id, date, delivered, gov, fees, var_cost, margin, wastage, ad, rent, staff, elec, other_opex, opex` |
| `sku_day` | store × day × SKU | `store_id, date, sku_id, units, revenue, cost, discount` (delivered lines only) |

Store contribution before opex = `margin + fees + ad - var_cost - wastage`. Store contribution = that minus `opex`. Contribution per order = contribution before opex ÷ `delivered`. Break-even orders/day = opex per day ÷ contribution per order.

## Table map (what each one is for)

Full columns, types and meanings (read only the file you need): `references/dimensions.md`, `references/facts-orders-demand.md`, `references/facts-ops-inventory.md`.

### Dimensions

| Table | One row per | Use it for |
|---|---|---|
| `dim_store` | store (34) | name, locality, city, lat/lng, format, area, design capacity, rent, lease, launch/closure, status |
| `dim_city` | city (6) | city code/name, tier, electricity tariff |
| `dim_calendar` | day (92) | weekend, festival, salary window, Navratri, Diwali build-up |
| `dim_sku` | SKU (611) | name, brand, L1/L2 category, MRP, price, cost, storage type, shelf life, perishable, private label |
| `dim_vendor` | vendor (26) | lead time, contracted fill rate |
| `dim_promotion` | promotion (285) | type, category/SKU, dates, discount, who funds it |
| `dim_competitor_store` | rival store (168) | brand, location, open date |
| `dim_employee` | employee (1,879) | role, shift, hourly cost, join/exit date |
| `dim_customer` | customer (547K) | home hex, signup date, Swiggy One |
| `dim_hex` | H3 hex (2,594) | location, population, households, affluence index |
| `dim_store_hex_coverage` | store × hex × validity | which store serves which hex and when (zones change on 1 Sep and 1 Oct) |
| `log_experiments` | experiment (8) | hypothesis, treatment store, control stores, dates, cost. **Results are not filled** |

### Facts

| Table | Grain | Use it for |
|---|---|---|
| `fact_orders` | order (3.8M) | lifecycle timestamps, fees, coupons, rider payout, refunds, rating, status |
| `fact_order_items` | order line (17M) | quantity, MRP, selling price, unit cost (join to orders on `order_id`) |
| `fact_store_finance_daily` | store × day | rent, staff, electricity, other opex, ad income, one-offs |
| `fact_store_sessions_daily` | store × day | funnel: sessions, searches, cart, checkout, orders, orders lost to stock-outs or busy mode |
| `fact_store_hourly_ops` | store × day × hour | potential vs accepted orders, busy mode, staff on floor, capacity, pick queue wait |
| `fact_staff_shifts` | employee × day | attendance, hours, overtime, shift cost |
| `fact_inventory_daily` | store × SKU × day | opening/closing stock, inbound slots, sold, wasted, stock-out minutes, lost demand, forecast |
| `fact_purchase_orders` | PO line | ordered vs received quantity, vendor, expected vs received date |
| `fact_wastage` | store × SKU × day × reason | write-offs at cost by reason |
| `fact_cold_chain_temperature_hourly` | store × zone × hour | chiller / freezer readings |
| `fact_food_safety_audits` | audit | scores, findings, outcome |
| `fact_hex_demand_daily` | hex × day | sessions, unserviceable sessions, orders per hex |
| `fact_search_null_daily` | store × term × day | searches with no catalogue match (assortment gaps) |
| `fact_competitor_price_checks` | city × brand × SKU × week | our price vs rival price |
| `fact_competitor_eta_checks` | store × brand × check | rival promised ETA near the store |
| `fact_weather_daily` | city × day | rain, max temperature, heavy-rain flag |

## Join keys

- `store_id` joins every store-level table to `dim_store`; `dim_store.city_id` joins to `dim_city`.
- `store_code` (like `#412`) is the human label. Users say "store #412"; look up `store_id` from `dim_store.store_code` first. **Do not assume `store_id` equals the number in the code.**
- `sku_id` joins to `dim_sku`; `vendor_id` to `dim_vendor`; `hex_id` to `dim_hex`; `order_id` links orders to lines.
- Orders carry `business_date`; most other facts carry `date`. Both are the same business-day concept.

## Conventions and traps

1. **Business day runs 06:00–01:59.** Orders at 00:00–01:59 belong to the previous `business_date`. Group by `business_date`, never by the calendar date of a timestamp.
2. **Sales = delivered orders only** (`order_status = 'Delivered'`). Cancelled orders exist (about 1.7%) and carry `cancel_reason`.
3. **GOV** = `item_value + delivery_fee + small_cart_fee + handling_fee + late_night_fee + rain_surge_fee`. `net_order_value` = GOV − coupon.
4. **Closed store:** `#962 Hinjewadi` (Pune) closed on 1 Oct; it has fewer days of data. Check `closure_date` before comparing or averaging.
5. **Young stores:** Wakad (`#963`) launched on 1 Sep. Treat stores under about 120 days old as ramping.
6. **Megapods vs standard stores** differ a lot in volume and cost. Do not compare them without saying so (`dim_store.store_format`).
7. **Large tables:** `fact_orders` and `fact_order_items` are big. Filter by store and date first, aggregate early, never `select *` without `limit`.
8. **Closing stock vs forecast:** `system_forecast_units` is the system's forecast for that day; compare to `sold_qty + lost_demand_units`.
9. **Hex coverage is time-bound:** filter `dim_store_hex_coverage` by `valid_from` and `valid_to` (null means still valid).
10. **Affluence index** in `dim_hex` is on a scale of about 3.5–4.5, not 0–1.
11. **No ground truth for experiments** is in this data. `log_experiments` has hypotheses and costs only; effects must be measured.
12. Numbers you quote must come from a query in this conversation. If a table cannot answer the question, say so and list the gap.

More: `references/skill-data-map.md` (which skill uses which tables, calibration figures, querying tips).
