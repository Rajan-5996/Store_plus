# StorePulse AI — Agent Data Map

Which Parquet files each agent reads. Agent names match the StorePulse sidebar. All paths are relative to the unzipped data folder:

```
StorePulse_Full_Dataset_Parquet/
├── 00_StorePulse_Data_Dictionary.xlsx   ← every table and column explained
├── dims/                                ← reference data (stores, products, cities…)
└── facts/                               ← activity data (orders, inventory, costs…)
```

> If Windows created a double folder (`StorePulse_Full_Dataset_Parquet\StorePulse_Full_Dataset_Parquet\`), use the inner one.

---

## How agents use the data

Agents do **not** load raw files into the LLM. Each agent is given **tools** — Python functions that query the Parquet files (e.g. with DuckDB) and return small, calculated results. The LLM interprets those results.

```
Parquet files → Python tools (DuckDB) → calculated metrics → Agent (LLM) → Frontend
```

Rule: tools return summaries (a few numbers or rows), never raw tables.

---

## Network overview (sidebar page, not an agent)

The landing page. It does not need its own agent: it shows headline numbers (total stores, stores above break-even, network loss, avg orders/store/day) and the top finding from each agent above. Data comes from the same files used by Store profitability and Store utilisation.

---

## 1. Store utilisation

*Sidebar page: Store utilisation*

*Are we getting enough business out of each store?*

| File | Used for |
|---|---|
| `dims/dim_store.parquet` | Design capacity, size, format |
| `dims/dim_city.parquet` | City names |
| `dims/dim_calendar.parquet` | Weekends, festivals |
| `facts/fact_store_hourly_ops.parquet` | Hourly demand vs capacity, busy mode, lost orders |
| `facts/fact_store_sessions_daily.parquet` | Orders placed vs lost |
| `facts/fact_staff_shifts.parquet` | Staff present per shift |
| `facts/fact_orders.parquet` | Orders per hour |

## 2. Inventory intelligence

*Sidebar page: Inventory intelligence*

*Do we have the right stock without wasting money?*

| File | Used for |
|---|---|
| `dims/dim_store.parquet` | Store details |
| `dims/dim_sku.parquet` | Product, shelf life, case pack, cost |
| `dims/dim_vendor.parquet` | Supplier lead time & promised fill rate |
| `dims/dim_promotion.parquet` | Discounts causing demand spikes |
| `dims/dim_calendar.parquet` | Festivals |
| `facts/fact_inventory_daily.parquet` | Stock, sales, stock-outs, lost demand, forecast |
| `facts/fact_purchase_orders.parquet` | Ordered vs received (supplier reliability) |
| `facts/fact_wastage.parquet` | Expired, damaged, spoiled stock |
| `facts/fact_cold_chain_temperature_hourly.parquet` | Chiller failures |

## 3. Operational efficiency

*Sidebar page: Operational efficiency*

*What is slowing down our orders?*

| File | Used for |
|---|---|
| `dims/dim_store.parquet` | Store details |
| `dims/dim_employee.parquet` | Pickers, packers, shifts |
| `dims/dim_calendar.parquet` | Busy days |
| `facts/fact_orders.parquet` | Order timestamps (accept, pick, pack, dispatch, deliver) |
| `facts/fact_staff_shifts.parquet` | Attendance, overtime |
| `facts/fact_store_hourly_ops.parquet` | Queue waits, staff and riders per hour |
| `facts/fact_weather_daily.parquet` | Rain slowing deliveries |

## 4. Store profitability

*Sidebar page: Store profitability*

*Is this store making or losing money, and why?*

| File | Used for |
|---|---|
| `dims/dim_store.parquet` | Store details, rent, format |
| `dims/dim_city.parquet` | City names |
| `dims/dim_calendar.parquet` | Dates, festivals |
| `facts/fact_orders.parquet` | Revenue, fees, coupons, rider & packaging costs |
| `facts/fact_order_items.parquet` | Product margin (price − cost) |
| `facts/fact_store_finance_daily.parquet` | Rent, staff, electricity, other costs, ad income |
| `facts/fact_wastage.parquet` | Wastage cost |

## 5. Network optimisation

*Sidebar page: Network optimisation*

*Are our stores in the right places?*

| File | Used for |
|---|---|
| `dims/dim_store.parquet` | Store location, delivery radius |
| `dims/dim_city.parquet` | City names |
| `dims/dim_hex.parquet` | Map areas with population & affluence |
| `dims/dim_store_hex_coverage.parquet` | Which store serves which area (overlaps) |
| `dims/dim_competitor_store.parquet` | Rival store locations |
| `facts/fact_hex_demand_daily.parquet` | Demand per area, incl. unserved areas |
| `facts/fact_orders.parquet` | Delivery location and distance |

## 6. Product mix

*Sidebar page: Product mix*

*Are we selling the right products in each store?*

| File | Used for |
|---|---|
| `dims/dim_store.parquet` | Store details |
| `dims/dim_sku.parquet` | Brand, category, price, cost |
| `dims/dim_promotion.parquet` | Discounts |
| `facts/fact_orders.parquet` | Order status & store link |
| `facts/fact_order_items.parquet` | Products sold, baskets |
| `facts/fact_inventory_daily.parquet` | Low sales caused by stock-outs |
| `facts/fact_search_null_daily.parquet` | Products searched for but not stocked |
| `facts/fact_competitor_price_checks.parquet` | Our price vs rivals |

## 7. Experiment analysis (supporting agent)

*No sidebar page of its own — its results appear inside the other pages (e.g. "Did adding pickers work?" on Operational efficiency).*

*Did the change we made actually work?*

| File | Used for |
|---|---|
| `dims/log_experiments.parquet` | What was tested, where, when, at what cost |
| `dims/dim_store.parquet` | Treatment and control stores |
| `dims/dim_calendar.parquet` | Festivals that can distort results |
| `dims/dim_competitor_store.parquet` | Rival openings during a test |
| `facts/fact_weather_daily.parquet` | Rain that can distort results |
| `facts/fact_orders.parquet` | Orders, pick time, delivery time |
| `facts/fact_order_items.parquet` | Margin, product sales |
| `facts/fact_store_hourly_ops.parquet` | Busy mode, lost orders |
| `facts/fact_inventory_daily.parquet` | Stock-outs |
| `facts/fact_wastage.parquet` | Spoilage |
| `facts/fact_store_finance_daily.parquet` | Costs, power use |
| `facts/fact_cold_chain_temperature_hourly.parquet` | Chiller fixes |

> Build this agent last — it re-uses the other agents' data to measure impact.

---

## Not used by any agent

| File | Note |
|---|---|
| `dims/dim_customer.parquet` | Useful later for customer analysis |
| `facts/fact_food_safety_audits.parquet` | Optional extra for Inventory intelligence |
| `facts/fact_competitor_eta_checks.parquet` | Optional extra for Network optimisation |
| `dims/*.csv` | Duplicates of the `.parquet` files — ignore |

---

## Other downloaded items (not used by the app)

| Item | Purpose |
|---|---|
| `StorePulse_Excel_Workbooks/` | Same data in Excel — for viewing only (orders are a 1-week sample) |
| `StorePulse_Generator_Code/` | Program that created the data — use only to regenerate or create new scenarios |
| `StorePulse_GROUND_TRUTH_do_not_feed_agents.xlsx` | Answer key — use only to check agent results, **never load into the app** |

---

## Recommended build order

1. Store profitability → 2. Store utilisation → 3. Inventory intelligence → 4. Operational efficiency → 5. Network optimisation → 6. Product mix → 7. Experiment analysis

(Build order differs from sidebar order: Store profitability first because its data is the strongest.)