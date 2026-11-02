# StorePulse AI server

FastAPI + DuckDB over the parquet dataset in `data/`.

```
uv run uvicorn app.main:app --reload   # http://localhost:8000/docs
```

- `app/core` – config, DuckDB connection (`db.py`), store-day / SKU-day marts (`mart.py`), City + date-range filters.
- `app/services` – one module per screen (SQL + metric definitions from `docs/00_StorePulse_Data_Dictionary.xlsx`).
- `app/routers` – `GET /api/{overview|utilisation|inventory|operations|profitability|network|productmix}?city=all&range=30d` and `GET /api/meta/filters`.

Start-up builds the marts in memory (about 2 seconds). Date ranges end on the last day of data (31 Oct 2026).
