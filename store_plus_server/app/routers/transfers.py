"""The transfer log: what is being moved (product and quantity), from which store to which, and its status."""
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import transfers

router = APIRouter(prefix="/api/transfers", tags=["transfers"])


class TransferIn(BaseModel):
    kind: Literal["Demand", "Stock", "Staff"]
    item: str | None = Field(default=None, max_length=200)  # the product, for stock moves
    quantity: float = Field(ge=0, le=1e9)
    unit: str = Field(min_length=1, max_length=80)
    from_code: str = Field(pattern=r"^#\d{3}$")
    from_area: str = Field(max_length=80)
    to_code: str = Field(pattern=r"^#\d{3}$")
    to_area: str = Field(max_length=80)
    reason: str = Field(default="", max_length=500)


class StatusIn(BaseModel):
    status: Literal["planned", "done", "cancelled"]


@router.get("")
def list_log():
    return transfers.list_transfers()


@router.post("")
def log_transfer(body: TransferIn):
    if body.from_code == body.to_code:
        raise HTTPException(status_code=422, detail="A transfer needs two different stores.")
    return transfers.add_transfer(body.model_dump())


@router.patch("/{transfer_id}")
def update_status(transfer_id: int, body: StatusIn):
    out = transfers.set_status(transfer_id, body.status)
    if out is None:
        raise HTTPException(status_code=404, detail=f"No transfer with id {transfer_id}.")
    return out
