"""One router per frontend screen; each is a thin wrapper over a function in app.services."""
from fastapi import APIRouter, Depends

from app.core.filters import Filters, get_filters
from app.routers import meta
from app.services import inventory, network, operations, overview, productmix, profitability, utilisation

SCREENS = {
    "overview": overview.overview,
    "utilisation": utilisation.utilisation,
    "inventory": inventory.inventory,
    "operations": operations.operations,
    "profitability": profitability.profitability,
    "network": network.network,
    "productmix": productmix.productmix,
}


def _screen_router(name: str, fn) -> APIRouter:
    router = APIRouter(prefix=f"/api/{name}", tags=[name])

    @router.get("")
    def get(f: Filters = Depends(get_filters)):
        return fn(f)

    return router


ROUTERS = [meta.router, *(_screen_router(n, fn) for n, fn in SCREENS.items())]
