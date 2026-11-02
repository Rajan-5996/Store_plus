"""Store pages: the store list (for search), one store's full view, and its AI-written recommended actions."""
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.filters import Filters, RangeKey, get_filters
from app.services.rebalance import rebalance_for
from app.services.replenish import replenishment_for
from app.services.store_detail import store_detail, store_list

router = APIRouter(prefix="/api/stores", tags=["stores"])


@router.get("")
def stores(f: Filters = Depends(get_filters)):
    return store_list(f)


@router.get("/{code}")
def store(code: str, f: Filters = Depends(get_filters)):
    detail = store_detail(code, f)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"No store with code '{code}'.")
    return detail


@router.get("/{code}/rebalance")
def rebalance(code: str, f: Filters = Depends(get_filters)):
    """Demand, staff and stock moves between this store and its nearest neighbours (from and to), computed from the data."""
    out = rebalance_for(code, f)
    if out is None:
        raise HTTPException(status_code=404, detail=f"No store with code '{code}'.")
    return out


@router.get("/{code}/replenishment")
def replenishment(code: str, f: Filters = Depends(get_filters)):
    """When each of the store's most-missed products runs out, and the delivery slot and quantity that would prevent it."""
    out = replenishment_for(code, f)
    if out is None:
        raise HTTPException(status_code=404, detail=f"No store with code '{code}'.")
    return out


@router.get("/{code}/actions")
def store_actions(code: str, range: RangeKey = Query("30d"), refresh: bool = False):
    """AI-written recommended actions for one store (cached for 30 minutes; `refresh=true` asks the model again)."""
    from app.agent.recommend import ActionsError, DomoError, store_actions as build

    try:
        return build(code, range, refresh)
    except (ActionsError, DomoError) as e:
        raise HTTPException(status_code=404 if "Unknown store" in str(e) else 502, detail=str(e)) from e
