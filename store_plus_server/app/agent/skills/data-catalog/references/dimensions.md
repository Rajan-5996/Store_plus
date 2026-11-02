# Dimension tables and logs

Slowly-changing reference data: who/what/where. Join to facts on the `*_id` keys. Types are the real DuckDB types.

## `dim_calendar`

- **File:** `data/dims/dim_calendar.parquet`  |  **Rows:** 92  |  **Grain:** one row per day
- **What it is:** 1 Aug - 31 Oct 2026 with festivals, salary window, Navratri and Diwali build-up flags.

| Column | Type | Meaning |
|---|---|---|
| `date` | date | Business date (IST) |
| `day_of_week` | varchar | Day name |
| `is_weekend` | boolean | Saturday/Sunday |
| `iso_week` | bigint | ISO week number |
| `month` | varchar | YYYY-MM |
| `festival_name` | varchar | Festival / holiday |
| `festival_cities` | varchar | Cities where festival applies (All or list) |
| `is_salary_window` | boolean | Day 1-5 of month (salary week) |
| `is_navratri` | boolean | Within Navratri (11-19 Oct 2026) |
| `is_diwali_buildup` | boolean | Within Diwali build-up (24-31 Oct; Diwali is 8 Nov 2026) |

## `dim_city`

- **File:** `data/dims/dim_city.parquet`  |  **Rows:** 6  |  **Grain:** one row per city
- **What it is:** 6 Tier-1 metro cities with tariff assumptions.

| Column | Type | Meaning |
|---|---|---|
| `city_id` | bigint | City key -> dim_city.city_id |
| `city_code` | varchar | 3-letter city code |
| `city_name` | varchar | City name |
| `state` | varchar | State(s) |
| `tier` | varchar | City tier |
| `latitude` | double | Latitude (WGS84) |
| `longitude` | double | Longitude (WGS84) |
| `commercial_electricity_tariff_inr_kwh` | double | Commercial electricity tariff assumption (INR per kWh) |

## `dim_competitor_store`

- **File:** `data/dims/dim_competitor_store.parquet`  |  **Rows:** 168  |  **Grain:** one row per competitor store
- **What it is:** Rival dark stores (Blinkit, Zepto, Flipkart Minutes, BB Now, Amazon Now) with coordinates and open dates, incl. openings during the period.

| Column | Type | Meaning |
|---|---|---|
| `competitor_store_id` | varchar | Competitor store key |
| `brand` | varchar | Brand (blank for loose fresh produce) |
| `city_id` | bigint | City key -> dim_city.city_id |
| `latitude` | double | Latitude (WGS84) |
| `longitude` | double | Longitude (WGS84) |
| `open_date` | date | Competitor store opening date |
| `source` | varchar | Data source |

## `dim_customer`

- **File:** `data/dims/dim_customer.parquet`  |  **Rows:** 546,895  |  **Grain:** one row per customer
- **What it is:** 547K customers with home H3 hex, signup date and Swiggy One membership.

| Column | Type | Meaning |
|---|---|---|
| `customer_id` | bigint | Customer key -> dim_customer.customer_id |
| `home_hex_id` | varchar | Customer home H3 cell |
| `city_id` | bigint | City key -> dim_city.city_id |
| `signup_date` | date | App signup date |
| `is_swiggy_one_member` | boolean | Swiggy One subscriber (free delivery above INR 99) |

## `dim_employee`

- **File:** `data/dims/dim_employee.parquet`  |  **Rows:** 1,879  |  **Grain:** one row per employee
- **What it is:** Pickers, packers, inventory associates, shift leads, store managers and agency staff, with shift template and hourly cost.

| Column | Type | Meaning |
|---|---|---|
| `employee_id` | varchar | Employee key -> dim_employee.employee_id |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `role` | varchar | Picker, Packer, Inventory Associate, Shift Lead, Store Manager |
| `shift_code` | varchar | A 06-15, B 10-19, C 14-23, D 17-02, E 17-23 (agency) |
| `employment_type` | varchar | Payroll, Payroll (contract) or Agency |
| `hourly_cost_inr` | double | Fully loaded hourly cost (INR) |
| `join_date` | date | Joining date |
| `exit_date` | date | Exit date (store closure) |

## `dim_hex`

- **File:** `data/dims/dim_hex.parquet`  |  **Rows:** 2,594  |  **Grain:** one row per h3 hex (res 8)
- **What it is:** 2,594 H3 cells (~0.74 km2) around stores and unserved pockets with population, households and affluence.

| Column | Type | Meaning |
|---|---|---|
| `hex_id` | varchar | H3 cell index, resolution 8 |
| `city_id` | bigint | City key -> dim_city.city_id |
| `latitude` | double | Latitude (WGS84) |
| `longitude` | double | Longitude (WGS84) |
| `area_km2` | double | Cell area (km2) |
| `population_est` | bigint | Estimated residents |
| `households_est` | bigint | Estimated households |
| `affluence_index` | double | Affluence 1 (low) - 5 (high) |
| `residential_share` | double | Share of area that is residential |

## `dim_promotion`

- **File:** `data/dims/dim_promotion.parquet`  |  **Rows:** 285  |  **Grain:** one row per promotion
- **What it is:** Brand-funded SKU deals, platform-funded category events and festive co-funded promotions.

| Column | Type | Meaning |
|---|---|---|
| `promo_id` | varchar | Promotion key |
| `promo_type` | varchar | SKU deal, Category event or Festive co-funded |
| `sku_id` | double | SKU key -> dim_sku.sku_id |
| `l2_category` | varchar | Category level 2 |
| `city_scope` | varchar | City code or All |
| `start_date` | date | Start date |
| `end_date` | date | End date |
| `discount_pct` | double | Discount on selling price (fraction) |
| `funded_by` | varchar | Brand, Platform or Co-funded |
| `brand_funded_share` | double | Share of discount reimbursed by brand |

## `dim_sku`

- **File:** `data/dims/dim_sku.parquet`  |  **Rows:** 611  |  **Grain:** one row per sku
- **What it is:** 611 SKUs across 46 L2 categories, real Indian brands incl. city-specific regional brands, MRP, selling price, cost, shelf life, storage zone.

| Column | Type | Meaning |
|---|---|---|
| `sku_id` | bigint | SKU key -> dim_sku.sku_id |
| `sku_name` | varchar | Product name |
| `brand` | varchar | Brand (blank for loose fresh produce) |
| `l1_category` | varchar | Category level 1 |
| `l2_category` | varchar | Category level 2 |
| `pack_size` | varchar | Pack size |
| `mrp` | double | Maximum retail price (INR) |
| `base_selling_price` | double | Everyday selling price before promotions (INR) |
| `cost_price` | double | Amount payable to seller/brand per unit (INR); selling price minus cost = platform product margin |
| `storage_type` | varchar | Ambient, Chilled, Frozen or Fresh |
| `shelf_life_days` | bigint | Sellable shelf life from receipt (days) |
| `is_perishable` | boolean | Shelf life <= 14 days |
| `is_private_label` | boolean | Platform private label (Pulse Essentials) |
| `available_cities` | varchar | Cities where SKU can be ranged (All or list - regional brands) |
| `case_pack` | bigint | Replenishment case size (units) |
| `popularity_rank_in_l2` | bigint | Popularity rank within L2 category (1 = best seller) |
| `pick_zone` | varchar | Storage / picking zone |

## `dim_store`

- **File:** `data/dims/dim_store.parquet`  |  **Rows:** 34  |  **Grain:** one row per store
- **What it is:** 34 dark stores: real localities, pincodes, coordinates, format, area, chilled/frozen area, design capacity, rent, lease, launch/closure.

| Column | Type | Meaning |
|---|---|---|
| `store_id` | bigint | Store key -> dim_store.store_id |
| `store_code` | varchar | Operational store code (e.g. #412) |
| `store_name` | varchar | Store display name |
| `city_id` | bigint | City key -> dim_city.city_id |
| `locality` | varchar | Neighbourhood served |
| `pincode` | bigint | Postal pincode of locality |
| `latitude` | double | Latitude (WGS84) |
| `longitude` | double | Longitude (WGS84) |
| `h3_index_res8` | varchar | H3 cell containing the store |
| `store_format` | varchar | Standard (~4,000 sq ft) or Megapod (8,800-10,000 sq ft) |
| `area_sqft` | bigint | Total built-up area (sq ft) |
| `chilled_area_sqft` | bigint | Chiller area (sq ft) |
| `frozen_area_sqft` | bigint | Freezer area (sq ft) |
| `packing_stations` | bigint | Number of packing stations |
| `design_capacity_orders_per_hour` | bigint | Engineering design throughput (orders/hour) at full staffing |
| `delivery_radius_km` | double | Max straight-line serviceable radius (km) |
| `operating_hours` | varchar | Operating window |
| `launch_date` | date | Store go-live date |
| `closure_date` | date | Closure date (blank if open) |
| `closure_reason` | varchar | Reason for closure |
| `status_as_of_2026_10_31` | varchar | Status at end of data period |
| `monthly_rent_inr` | double | Monthly rent (INR) |
| `lease_start_date` | date | Lease start |
| `lease_end_date` | date | Lease end |
| `layout_version` | varchar | Racking layout version |

## `dim_store_hex_coverage`

- **File:** `data/dims/dim_store_hex_coverage.parquet`  |  **Rows:** 1,353  |  **Grain:** one row per store x hex x validity
- **What it is:** Which store serves which hex and when (changes on 1 Sep: Wakad launch; 1 Oct: Hinjewadi closure and Koramangala/Ejipura zone redraw).

| Column | Type | Meaning |
|---|---|---|
| `store_id` | bigint | Store key -> dim_store.store_id |
| `hex_id` | varchar | H3 cell index, resolution 8 |
| `distance_km` | double | Store-to-hex-centroid straight-line distance (km) |
| `is_primary` | boolean | Store with largest share of this hex |
| `valid_from` | date | Coverage valid from |
| `valid_to` | date | Coverage valid to (blank = still valid) |

## `dim_vendor`

- **File:** `data/dims/dim_vendor.parquet`  |  **Rows:** 26  |  **Grain:** one row per vendor
- **What it is:** Mother hubs, fresh collection centres, dairy & bakery direct vendors, a Pune distributor and a national non-grocery partner.

| Column | Type | Meaning |
|---|---|---|
| `vendor_id` | varchar | Vendor key -> dim_vendor.vendor_id |
| `vendor_name` | varchar | Vendor name |
| `vendor_type` | varchar | Mother Hub, Fresh CC, Direct Vendor or Distributor |
| `city_code` | varchar | 3-letter city code |
| `lead_time_days_mean` | double | Mean lead time (days) |
| `lead_time_days_sd` | double | Lead time std dev (days) |
| `contracted_fill_rate` | double | Contracted fill rate |

## `log_experiments`

- **File:** `data/dims/log_experiments.parquet`  |  **Rows:** 8  |  **Grain:** one row per experiment
- **What it is:** 8 operational interventions with hypothesis, dates, treatment & suggested control stores, cost. Results intentionally NOT filled - the Experiment agent measures them.

| Column | Type | Meaning |
|---|---|---|
| `experiment_id` | varchar | Experiment key |
| `experiment_name` | varchar | Name |
| `intervention_type` | varchar | Staffing, Layout, Replenishment, Marketing, Network, Pricing, Equipment, CX |
| `treatment_store_id` | bigint | Store receiving intervention |
| `additional_treatment_store_ids` | varchar | Other treated stores |
| `suggested_control_store_ids` | varchar | Control stores suggested by the owner (may be imperfect!) |
| `hypothesis` | varchar | Hypothesis |
| `start_date` | varchar | Start date |
| `planned_end_date` | varchar | Planned end |
| `primary_metric` | varchar | Primary success metric |
| `secondary_metrics` | varchar | Secondary metrics |
| `one_time_cost_inr` | bigint | One-time cost (INR) |
| `recurring_cost_inr_per_day` | bigint | Recurring cost per day (INR) |
| `owner` | varchar | Owning team |
| `status` | varchar | Running / Completed |
