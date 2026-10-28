import hashlib
from datetime import datetime
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from .. import ai
from ..config import MAX_BOTTLE_PER_DAY, TOKENS_BOTTLE, TOKENS_DONATION, TOKENS_PER_RUPEE, TZ
from ..db import admin
from ..deps import limiter, require

router = APIRouter(prefix="/api/campus", tags=["campus"])
student = require("student")
staff = require("staff")


def rupees(tokens: int) -> float:
    return round(tokens / TOKENS_PER_RUPEE, 2)  # 50 tokens -> Rs 5


def today_start() -> str:
    return datetime.now(ZoneInfo(TZ)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()


def balance(uid: str) -> int:
    return int(admin.rpc("token_balance", {"p_user": uid}).execute().data or 0)


def award(uid: str, delta: int, reason: str, digest: str):
    try:
        admin.table("token_ledger").insert(
            {"user_id": uid, "delta": delta, "reason": reason, "image_hash": digest}
        ).execute()
    except Exception as e:
        if "23505" in str(e) or "duplicate" in str(e).lower():
            raise HTTPException(409, "This photo was already submitted")
        raise


# ---------------- student ----------------
@router.get("/student/wallet")
def wallet(u: dict = Depends(student)):
    bal = balance(u["id"])
    hist = admin.table("token_ledger").select("delta,reason,created_at").eq("user_id", u["id"]) \
        .order("created_at", desc=True).limit(20).execute().data
    reds = admin.table("redemptions").select("*").eq("user_id", u["id"]) \
        .order("created_at", desc=True).limit(10).execute().data
    return {"tokens": bal, "rupees": rupees(bal), "history": hist, "redemptions": reds}


@router.post("/student/bottle", dependencies=[Depends(limiter("verify", 40))])
def submit_bottle(image: UploadFile = File(...), u: dict = Depends(student)):
    today = admin.table("token_ledger").select("id", count="exact").eq("user_id", u["id"]) \
        .eq("reason", "bottle").gte("created_at", today_start()).execute().count or 0
    if today >= MAX_BOTTLE_PER_DAY:
        raise HTTPException(429, f"Daily limit of {MAX_BOTTLE_PER_DAY} submissions reached")
    data, mt = ai.read_image(image)
    digest = hashlib.sha256(data).hexdigest()
    res = ai.ask(ai.BOTTLE_SYS, "Verify this photo.", [(data, mt)])
    if not res.get("valid"):
        raise HTTPException(422, f"Not accepted: {res.get('reason', 'photo could not be verified')}")
    award(u["id"], TOKENS_BOTTLE, "bottle", digest)
    return {"awarded": TOKENS_BOTTLE, "reason": res.get("reason", ""), "balance": balance(u["id"])}


@router.post("/student/donation", dependencies=[Depends(limiter("verify", 40))])
def submit_donation(photo: UploadFile = File(...), certificate: UploadFile = File(...), u: dict = Depends(student)):
    p, c = ai.read_image(photo), ai.read_image(certificate)
    res = ai.ask(ai.DONATION_SYS, "Image 1 is the donation photo, image 2 is the certificate.", [p, c])
    if not (res.get("donation_photo_valid") and res.get("certificate_valid")):
        raise HTTPException(422, f"Not accepted: {res.get('reason', 'both photo and certificate must be valid')}")
    award(u["id"], TOKENS_DONATION, "donation", hashlib.sha256(c[0]).hexdigest())  # a certificate counts once
    return {"awarded": TOKENS_DONATION, "reason": res.get("reason", ""), "balance": balance(u["id"])}


class RedeemIn(BaseModel):
    tokens: int = Field(ge=10)


@router.post("/student/redeem")
def redeem(body: RedeemIn, u: dict = Depends(student)):
    try:
        r = admin.rpc("redeem_tokens", {"p_user": u["id"], "p_tokens": body.tokens}).execute().data
    except Exception as e:
        raise HTTPException(400, getattr(e, "message", "Could not redeem"))
    return r[0] if isinstance(r, list) else r


@router.get("/student/offers")
def student_offers(_: dict = Depends(student)):
    return admin.table("offers").select("*").eq("active", True).gte("created_at", today_start()) \
        .order("created_at", desc=True).execute().data


# ---------------- canteen staff ----------------
class OfferIn(BaseModel):
    item_name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=300)
    quantity: int = Field(ge=1, le=10000)
    original_price: float = Field(gt=0, le=100000)
    discount_percent: int = Field(ge=1, le=90)


@router.get("/staff/offers")
def staff_offers(u: dict = Depends(staff)):
    return admin.table("offers").select("*").eq("staff_id", u["id"]).eq("active", True) \
        .gte("created_at", today_start()).order("created_at", desc=True).execute().data


@router.post("/staff/offers", status_code=201)
def create_offer(o: OfferIn, u: dict = Depends(staff)):
    row = {**o.model_dump(), "staff_id": u["id"],
           "new_price": round(o.original_price * (100 - o.discount_percent) / 100, 2)}
    return admin.table("offers").insert(row).execute().data[0]


@router.delete("/staff/offers/{offer_id}")
def remove_offer(offer_id: UUID, u: dict = Depends(staff)):
    admin.table("offers").update({"active": False}).eq("id", str(offer_id)).eq("staff_id", u["id"]).execute()
    return {"ok": True}


@router.get("/staff/redemptions")
def pending_redemptions(_: dict = Depends(staff)):
    return admin.table("redemptions").select("*,profiles(email,full_name)").eq("status", "pending") \
        .order("created_at").execute().data


@router.post("/staff/redemptions/{code}/fulfil")
def fulfil(code: str, _: dict = Depends(staff)):
    r = admin.table("redemptions").update({"status": "fulfilled", "fulfilled_at": datetime.utcnow().isoformat()}) \
        .eq("code", code.upper()).eq("status", "pending").execute().data
    if not r:
        raise HTTPException(404, "No pending redemption with that code")
    return r[0]
