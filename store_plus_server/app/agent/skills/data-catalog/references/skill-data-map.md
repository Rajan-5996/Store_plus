# Skill-to-data map, calibration and querying tips

## Which skill uses which data

| Skill | Main tables |
|---|---|
| store-utilisation | `fact_store_hourly_ops`, `fact_store_sessions_daily`, `fact_staff_shifts`, `dim_store` |
| inventory-intelligence | `fact_inventory_daily`, `fact_purchase_orders`, `fact_wastage`, `fact_cold_chain_temperature_hourly`, `dim_sku`, `dim_vendor` |
| operational-efficiency | `fact_orders` (timestamps), `fact_staff_shifts`, `fact_store_hourly_ops`, `dim_employee` |
| store-profitability | `store_day`, `fact_orders`, `fact_order_items`, `fact_store_finance_daily`, `fact_wastage` |
| network-optimisation | `dim_hex`, `dim_store_hex_coverage`, `fact_hex_demand_daily`, `dim_competitor_store`, `fact_competitor_eta_checks` |
| product-mix | `sku_day`, `fact_order_items`, `dim_sku`, `fact_search_null_daily`, `fact_competitor_price_checks`, `dim_promotion` |
| experiment-analysis | `log_experiments` plus any fact table, `fact_weather_daily`, `dim_calendar`, `dim_competitor_store` |


## Calibration (sanity checks)

Network contribution margin ≈ −0.93% of GOV; about 10 of 34 stores profitable; average order value ≈ ₹701; about 1,218 orders per store per day; average order-to-door ≈ 14 minutes. If a query gives numbers far from these, recheck filters and joins.

## Querying tips

- Start with the marts (`store_day`, `sku_day`) for money and volume questions.
- Use `list_tables` / `describe_table` rather than guessing column names.
- Keep result sets small: aggregate in SQL, return at most a few dozen rows.
- Name the period and filters in your answer (for example "30 days to 31 Oct, all cities").
