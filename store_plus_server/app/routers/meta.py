from fastapi import APIRouter

from app.core.db import one, query

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/filters")
def filters():
    cities = query("select city_code as code, city_name as name from dim_city order by city_name")
    span = one("select min(date)::varchar as start, max(date)::varchar as end from store_day")
    return {
        "cities": [{"code": "all", "name": "All cities"}, *cities],
        "ranges": [
            {"key": "7d", "label": "Last 7 days"},
            {"key": "30d", "label": "Last 30 days"},
            {"key": "90d", "label": "Last 90 days"},
        ],
        "dataRange": span,
    }
