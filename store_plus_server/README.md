# StorePulse AI server

FastAPI + DuckDB over the parquet dataset in `data/`.

```
uv run uvicorn app.main:app --reload   # http://localhost:8000/docs
```

- `app/core` – config, DuckDB connection (`db.py`), store-day / SKU-day marts (`mart.py`), City + date-range filters.
- `app/services` – one module per screen (SQL + metric definitions from `docs/00_StorePulse_Data_Dictionary.xlsx`).
- `app/routers` – `GET /api/{overview|utilisation|inventory|operations|profitability|network|productmix}?city=all&range=30d` and `GET /api/meta/filters`.

Start-up builds the marts in memory (about 2 seconds). Date ranges end on the last day of data (31 Oct 2026).

## Pulse AI agent (`app/agent`)

No agent framework. For each question the engine:

1. **retrieval** – picks the dashboard screens and stores the question is about and pulls their numbers from DuckDB (`summaries.py`, `store_data.py`, `retrieval.py`);
2. builds one prompt: the matching skill text (`agent/skills/*/SKILL.md`), the table schema, the data, recent turns and the question (`prompt.py`);
3. calls **Domo AI** (`domo_client.py`, `POST https://<instance>.domo.com/api/ai/v1/text/generation`, header `X-DOMO-Developer-Token`);
4. if the model answers `SQL: <select ...>`, runs it read-only (`sql_guard.py`, `sqltool.py`) and asks again, at most 3 times.

Configure in `.env` (see `.env.example`): `DOMO_INSTANCE`, `DOMO_DEVELOPER_TOKEN`. Missing or `DOMO_MOCK=1` runs a **mock** client that summarises the fed data offline.

```
uv run pytest                                   # offline tests (Domo mocked)
uv run python -m app.agent.cli "Why is #524 losing money?"
```

API: `POST /api/agent/chat` (JSON) and `POST /api/agent/chat/stream` (server-sent progress events), body `{message, thread_id, screen}`.
