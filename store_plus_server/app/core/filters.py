"""Shared City / Date-range filters, resolved against the dataset's last day."""
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Literal

from fastapi import Query

from app.core.db import one, query

RangeKey = Literal["7d", "30d", "90d"]
DAYS = {"7d": 7, "30d": 30, "90d": 90}


@dataclass
class Filters:
    start: date
    end: date
    prev_start: date
    prev_end: date
    city_id: int | None

    def dates(self, col: str = "date", prev: bool = False) -> str:
        a, b = (self.prev_start, self.prev_end) if prev else (self.start, self.end)
        return f"{col} between date '{a}' and date '{b}'"

    def stores(self, col: str = "store_id") -> str:
        if self.city_id is None:
            return "true"
        return f"{col} in (select store_id from dim_store where city_id = {self.city_id})"

    def where(self, date_col: str = "date", store_col: str = "store_id", prev: bool = False) -> str:
        return f"{self.dates(date_col, prev)} and {self.stores(store_col)}"

    @property
    def days(self) -> int:
        return (self.end - self.start).days + 1


def get_filters(
    city: str = Query("all", description="City code, e.g. BLR, or 'all'"),
    range: RangeKey = Query("30d", description="7d, 30d or 90d ending on the last day of data"),
) -> Filters:
    last = one("select max(date) as d from store_day")["d"]
    n = DAYS[range]
    start = last - timedelta(days=n - 1)
    city_id = None
    if city.lower() != "all":
        rows = query(f"select city_id from dim_city where upper(city_code) = '{city.upper().replace(chr(39), '')}'")
        city_id = rows[0]["city_id"] if rows else -1
    return Filters(start, last, start - timedelta(days=n), start - timedelta(days=1), city_id)
