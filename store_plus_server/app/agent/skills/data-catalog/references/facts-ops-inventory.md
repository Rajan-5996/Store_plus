# Fact tables: operations, inventory, finance and quality

Store telemetry, staffing, stock, purchasing, wastage, cost and safety. Daily/hourly grain unless stated.

## `fact_cold_chain_temperature_hourly`

- **File:** `data/facts/fact_cold_chain_temperature_hourly.parquet`  |  **Rows:** 147,168  |  **Grain:** one row per store x zone x hour
- **What it is:** Chiller and freezer sensor readings; breach events and sensor gaps visible.

| Column | Type | Meaning |
|---|---|---|
| `store_id` | bigint | Store key -> dim_store.store_id |
| `zone` | varchar | Chiller or Freezer |
| `reading_at` | timestamp | Reading timestamp |
| `temperature_c` | double | Temperature (C); blank = sensor gap |

## `fact_food_safety_audits`

- **File:** `data/facts/fact_food_safety_audits.parquet`  |  **Rows:** 112  |  **Grain:** one row per audit
- **What it is:** Monthly internal QA audits and FSSAI inspections with scores, findings and outcomes.

| Column | Type | Meaning |
|---|---|---|
| `audit_id` | varchar | Audit key |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `audit_date` | date | Audit date |
| `audit_type` | varchar | Internal QA or FSSAI inspection |
| `auditor` | varchar | Auditor |
| `score` | double | Audit score (0-100) |
| `critical_findings` | bigint | Critical findings |
| `major_findings` | bigint | Major findings |
| `cold_chain_compliant` | boolean | No breach in prior 30 days |
| `pest_control_ok` | boolean | Pest control compliant |
| `fifo_compliant` | boolean | FIFO rotation compliant |
| `outcome` | varchar | Audit outcome |

## `fact_inventory_daily`

- **File:** `data/facts/fact_inventory_daily.parquet`  |  **Rows:** 1,422,756  |  **Grain:** one row per store x sku x day
- **What it is:** Opening stock, inbound by slot (06:00/15:00/18:00), sold, wasted, closing, stock-out minutes, lost demand units and the system forecast. Split by city in Excel.

| Column | Type | Meaning |
|---|---|---|
| `date` | date | Business date (IST) |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `sku_id` | bigint | SKU key -> dim_sku.sku_id |
| `opening_qty` | integer | Units on hand at 06:00 before inbound |
| `inbound_qty_0600` | integer | Units received 06:00 slot |
| `inbound_qty_1500` | integer | Units received 15:00 fresh slot |
| `inbound_qty_1800` | integer | Units received 18:00 top-up slot (experiment) |
| `sold_qty` | integer | Units sold in delivered orders |
| `wasted_qty` | integer | Units written off |
| `closing_qty` | integer | Units on hand at close |
| `oos_minutes` | smallint | Minutes SKU was unavailable during operating hours |
| `lost_demand_units` | integer | Units customers wanted but could not buy |
| `system_forecast_units` | float | Replenishment system's daily demand forecast (units) |

## `fact_purchase_orders`

- **File:** `data/facts/fact_purchase_orders.parquet`  |  **Rows:** 964,888  |  **Grain:** one row per po line
- **What it is:** Replenishment orders: vendor, PO date, expected delivery, slot, qty ordered vs received (fill rate, supplier stock-outs).

| Column | Type | Meaning |
|---|---|---|
| `po_id` | varchar | PO line key |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `sku_id` | bigint | SKU key -> dim_sku.sku_id |
| `vendor_id` | varchar | Vendor key -> dim_vendor.vendor_id |
| `po_date` | date | Date PO raised |
| `expected_delivery_date` | date | Expected delivery date |
| `delivery_slot` | varchar | Delivery slot(s) |
| `qty_ordered` | bigint | Units ordered |
| `qty_received` | bigint | Units received |
| `received_date` | date | Date received (blank if nothing received) |

## `fact_staff_shifts`

- **File:** `data/facts/fact_staff_shifts.parquet`  |  **Rows:** 120,674  |  **Grain:** one row per employee x day
- **What it is:** Rostered shifts with attendance, hours, overtime and cost.

| Column | Type | Meaning |
|---|---|---|
| `date` | date | Business date (IST) |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `employee_id` | varchar | Employee key -> dim_employee.employee_id |
| `role` | varchar | Picker, Packer, Inventory Associate, Shift Lead, Store Manager |
| `shift_code` | varchar | A 06-15, B 10-19, C 14-23, D 17-02, E 17-23 (agency) |
| `scheduled_start` | timestamp | Scheduled shift start |
| `scheduled_end` | timestamp | Scheduled shift end |
| `attendance_status` | varchar | Present or Absent |
| `hours_worked` | bigint | Hours worked incl. overtime |
| `overtime_hours` | bigint | Overtime hours |
| `shift_cost_inr` | double | Cost of shift (INR; overtime at 1.5x) |

## `fact_store_finance_daily`

- **File:** `data/facts/fact_store_finance_daily.parquet`  |  **Rows:** 3,066  |  **Grain:** one row per store x day
- **What it is:** Store operating costs (rent, staff, electricity, housekeeping, maintenance, inbound logistics, IT, other), one-off capex/marketing and ad income.

| Column | Type | Meaning |
|---|---|---|
| `date` | date | Business date (IST) |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `rent_inr` | double | Rent for the day (INR) |
| `staff_cost_inr` | double | Store staff cost for the day (INR) |
| `electricity_kwh` | double | Electricity consumed (kWh) |
| `electricity_cost_inr` | double | Electricity cost (INR) |
| `housekeeping_security_inr` | double | Contracted housekeeping & security (INR) |
| `maintenance_inr` | double | Repairs & maintenance (INR) |
| `inbound_logistics_inr` | double | Hub-to-store trucking (INR) |
| `it_connectivity_inr` | double | IT, scanners, connectivity (INR) |
| `other_opex_inr` | double | Consumables, water, misc (INR) |
| `local_marketing_inr` | double | One-off local marketing spend (INR) |
| `one_time_capex_inr` | double | One-off capex e.g. re-racking, chiller (INR) |
| `ad_income_inr` | double | Brand advertising income attributed to the store (INR) |

## `fact_store_hourly_ops`

- **File:** `data/facts/fact_store_hourly_ops.parquet`  |  **Rows:** 61,320  |  **Grain:** one row per store x day x hour
- **What it is:** Hourly telemetry: potential vs accepted orders, busy-mode minutes, orders lost to busy mode, pickers/packers/riders on floor, processing capacity, pick queue wait.

| Column | Type | Meaning |
|---|---|---|
| `date` | date | Business date (IST) |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `hour` | bigint | Hour of day (0-23; 0 and 1 belong to previous business date) |
| `potential_orders` | bigint | Orders customers attempted |
| `orders_accepted` | bigint | Orders the store could accept |
| `orders_lost_busy_mode` | bigint | Orders lost while store was in busy mode |
| `busy_mode_minutes` | double | Minutes in busy mode (throttled serviceability) |
| `pickers_on_floor` | bigint | Pickers present |
| `packers_on_floor` | bigint | Packers present |
| `riders_available` | bigint | Riders available |
| `processing_capacity_orders` | double | Binding capacity (min of picking, packing, rider) in orders/hour |
| `avg_pick_queue_wait_min` | double | Mean wait before picking starts (min) |

## `fact_wastage`

- **File:** `data/facts/fact_wastage.parquet`  |  **Rows:** 106,882  |  **Grain:** one row per store x sku x day x reason
- **What it is:** Write-offs by reason: Expired, Quality rejection, Damaged, Cold chain breach, valued at cost.

| Column | Type | Meaning |
|---|---|---|
| `date` | date | Business date (IST) |
| `store_id` | bigint | Store key -> dim_store.store_id |
| `sku_id` | bigint | SKU key -> dim_sku.sku_id |
| `wasted_qty` | bigint | Units written off |
| `reason` | varchar | Expired, Quality rejection, Damaged, Cold chain breach |
| `value_at_cost_inr` | double | Write-off value at cost (INR) |

## `fact_weather_daily`

- **File:** `data/facts/fact_weather_daily.parquet`  |  **Rows:** 552  |  **Grain:** one row per city x day
- **What it is:** Rainfall, max temperature and heavy-rain flag (monsoon drives demand, rider supply and travel speed).

| Column | Type | Meaning |
|---|---|---|
| `date` | date | Business date (IST) |
| `city_id` | bigint | City key -> dim_city.city_id |
| `rain_mm` | double | Rainfall (mm) |
| `max_temp_c` | double | Max temperature (C) |
| `heavy_rain_flag` | boolean | Rainfall >= 35 mm |
