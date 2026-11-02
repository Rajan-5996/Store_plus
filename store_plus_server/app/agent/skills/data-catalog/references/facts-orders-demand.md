# Fact tables: orders, demand and market

Customer orders, demand funnel, search gaps and competitor checks. `fact_orders` and `fact_order_items` are large (3.8M / 17M rows): always filter by `business_date` and `store_id`, and aggregate before joining.

## `fact_orders`

- **File:** `data/facts/fact_orders.parquet`  |  **Rows:** 3,800,116  |  **Grain:** one row per order
- **What it is:** 3.8M orders with every lifecycle timestamp, picker, rider, distance, basket value, all fees, coupons, rider payout, packaging, payment cost, refund, rating. FULL table in Parquet; 1-week 3-store sample in Excel.

| Column | Type | Meaning |
|---|---|---|
| `order_id` | bigint | Order key |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `business_date` | date | Business date. A business day runs 06:00 to 01:59 next calendar day |
| `customer_id` | bigint | Customer key -> dim_customer.customer_id |
| `delivery_hex_id` | varchar | Delivery H3 cell |
| `order_created_at` | timestamp | Order placed |
| `order_accepted_at` | timestamp | Store accepted |
| `picking_started_at` | timestamp | Picker started |
| `picking_completed_at` | timestamp | Picking done (blank in ~0.35% = scanner skipped) |
| `packed_at` | timestamp | Packed |
| `rider_assigned_at` | timestamp | Rider assigned |
| `dispatched_at` | timestamp | Left store |
| `delivered_at` | timestamp | Delivered |
| `cancelled_at` | timestamp | Cancelled |
| `order_status` | varchar | Delivered or Cancelled |
| `cancel_reason` | varchar | Customer cancelled, Payment failed, Rider unavailable |
| `promised_eta_min` | smallint | ETA promised at checkout (min) |
| `picker_id` | varchar | Picker employee_id |
| `rider_id` | varchar | Rider id (gig fleet) |
| `delivery_distance_km` | double | Road distance (km) |
| `item_count` | smallint | Units in order |
| `unique_sku_count` | smallint | Distinct SKUs (lines) |
| `mrp_value` | double | Basket value at MRP (INR) |
| `item_value` | double | Basket value at selling price after promotions (INR) |
| `delivery_fee` | double | Delivery fee (INR) |
| `small_cart_fee` | double | Small cart fee, basket < INR 99 (INR) |
| `handling_fee` | double | Handling fee (INR) |
| `late_night_fee` | double | Late-night fee 23:00-02:00 (INR) |
| `rain_surge_fee` | double | Rain surge fee (INR) |
| `gov` | double | Gross order value = item_value + all customer fees, before coupon (INR) |
| `coupon_discount` | double | Platform-funded coupon (INR) |
| `campaign_id` | varchar | Marketing campaign id |
| `net_order_value` | double | GOV minus coupon (INR) |
| `payment_method` | varchar | UPI, Card, COD, Wallet, NetBanking |
| `is_swiggy_one_member` | boolean | Swiggy One subscriber (free delivery above INR 99) |
| `rider_payout_inr` | double | Last-mile rider payout (INR) |
| `packaging_cost_inr` | double | Packaging cost (INR) |
| `payment_gateway_cost_inr` | double | Payment gateway / cash handling cost (INR) |
| `complaint_reason` | varchar | Customer complaint reason |
| `refund_inr` | double | Refund issued (INR) |
| `customer_rating` | double | Rating 1-5 (blank if not rated) |
| `store_busy_mode_at_order` | boolean | Store was in busy mode |
| `raining_at_order` | boolean | Rain >= 10 mm that day |

## `fact_order_items`

- **File:** `data/facts/fact_order_items.parquet`  |  **Rows:** 16,961,646  |  **Grain:** one row per order line
- **What it is:** 17M order lines with quantity, MRP, selling price and cost. FULL table in Parquet; sample in Excel.

| Column | Type | Meaning |
|---|---|---|
| `order_id` | bigint | Order key |
| `sku_id` | integer | SKU key -> dim_sku.sku_id |
| `quantity` | smallint | Units |
| `unit_mrp` | float | MRP per unit (INR) |
| `unit_selling_price` | float | Selling price per unit after promotions (INR) |
| `unit_cost` | float | Cost per unit after brand funding (INR) |

## `fact_hex_demand_daily`

- **File:** `data/facts/fact_hex_demand_daily.parquet`  |  **Rows:** 238,648  |  **Grain:** one row per hex x day
- **What it is:** App sessions, unserviceable sessions and orders per hex per day - catchment, overlap and coverage-gap analysis.

| Column | Type | Meaning |
|---|---|---|
| `date` | date | Business date (IST) |
| `hex_id` | varchar | H3 cell index, resolution 8 |
| `is_serviceable` | boolean | Hex served by at least one open store |
| `primary_store_id` | bigint | Main serving store |
| `app_sessions` | bigint | App sessions from hex |
| `unserviceable_sessions` | bigint | Sessions that saw 'not serviceable' |
| `orders_placed` | integer | Orders placed |

## `fact_store_sessions_daily`

- **File:** `data/facts/fact_store_sessions_daily.parquet`  |  **Rows:** 3,066  |  **Grain:** one row per store x day
- **What it is:** Demand funnel: sessions, searches, null searches, add-to-cart, checkout, orders placed, orders abandoned due to stock-outs, orders lost to busy mode.

| Column | Type | Meaning |
|---|---|---|
| `date` | date | Business date (IST) |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `app_sessions` | bigint | App sessions from hex |
| `search_sessions` | bigint | Sessions with a search |
| `null_search_sessions` | bigint | Sessions with a no-result search |
| `add_to_cart_sessions` | bigint | Sessions with add-to-cart |
| `checkout_sessions` | bigint | Sessions reaching checkout |
| `orders_placed` | bigint | Orders placed |
| `orders_abandoned_oos` | bigint | Baskets abandoned because key items were out of stock |
| `orders_lost_busy_mode` | bigint | Orders lost while store was in busy mode |

## `fact_search_null_daily`

- **File:** `data/facts/fact_search_null_daily.parquet`  |  **Rows:** 31,782  |  **Grain:** one row per store x term x day
- **What it is:** Searches returning no result - assortment gaps (e.g. regional brands not ranged).

| Column | Type | Meaning |
|---|---|---|
| `date` | date | Business date (IST) |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `search_term` | varchar | Search text |
| `searches` | bigint | Number of searches |
| `catalogue_match` | boolean | Term matches a ranged SKU (true = OOS/relevance issue, false = not ranged) |

## `fact_competitor_eta_checks`

- **File:** `data/facts/fact_competitor_eta_checks.parquet`  |  **Rows:** 4,996  |  **Grain:** one row per store x brand x check
- **What it is:** Twice-weekly mystery checks of rival promised ETA near each store.

| Column | Type | Meaning |
|---|---|---|
| `check_date` | date | Check date |
| `check_hour` | bigint | Hour of check |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `competitor_brand` | varchar | Rival platform |
| `competitor_promised_eta_min` | bigint | Rival promised delivery time (min) |
| `competitor_serviceable` | boolean | Address serviceable by rival |

## `fact_competitor_price_checks`

- **File:** `data/facts/fact_competitor_price_checks.parquet`  |  **Rows:** 27,440  |  **Grain:** one row per city x brand x sku x week
- **What it is:** Weekly price checks on 80 key value items vs each rival.

| Column | Type | Meaning |
|---|---|---|
| `check_date` | date | Check date |
| `city_id` | bigint | City key -> dim_city.city_id |
| `competitor_brand` | varchar | Rival platform |
| `sku_id` | bigint | SKU key -> dim_sku.sku_id |
| `our_price` | double | Our selling price on check date (INR) |
| `competitor_price` | double | Rival price (INR) |
| `competitor_in_stock` | boolean | Rival had item in stock |

