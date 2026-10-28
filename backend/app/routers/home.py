from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..db import admin
from ..deps import require

router = APIRouter(prefix="/api/home", tags=["home"])


class ItemIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    quantity: str = Field(min_length=1, max_length=40)
    expiry_date: date


@router.get("/items")
def list_items(u: dict = Depends(require("home"))):
    return admin.table("food_items").select("*").eq("user_id", u["id"]).order("expiry_date").execute().data


@router.post("/items", status_code=201)
def add_item(item: ItemIn, u: dict = Depends(require("home"))):
    row = {"user_id": u["id"], "name": item.name.strip(), "quantity": item.quantity.strip(),
           "expiry_date": item.expiry_date.isoformat()}
    return admin.table("food_items").insert(row).execute().data[0]


@router.delete("/items/{item_id}")
def delete_item(item_id: UUID, u: dict = Depends(require("home"))):
    admin.table("food_items").delete().eq("id", str(item_id)).eq("user_id", u["id"]).execute()
    return {"ok": True}
