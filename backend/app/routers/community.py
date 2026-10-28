import re
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from .. import ai
from ..db import admin
from ..deps import limiter

router = APIRouter(prefix="/api/community", tags=["community"])
CATS = {"donate", "exchange", "repair"}
EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


@router.get("/posts")
def posts(category: str | None = None, limit: int = Query(50, le=100)):
    q = admin.table("community_posts").select("*").order("created_at", desc=True).limit(limit)
    if category in CATS:
        q = q.eq("category", category)
    return q.execute().data


@router.post("/posts", status_code=201, dependencies=[Depends(limiter("post", 10))])
def create_post(
    name: str = Form(..., min_length=2, max_length=60),
    mobile: str = Form(...),
    category: str = Form(...),
    message: str = Form(..., min_length=3, max_length=500),
    photos: list[UploadFile] = File(default=[]),
):
    mobile = re.sub(r"[\s-]", "", mobile)
    if not re.fullmatch(r"\+?\d{10,13}", mobile):
        raise HTTPException(422, "Enter a valid mobile number")
    if category not in CATS:
        raise HTTPException(422, "Category must be donate, exchange or repair")
    photos = [p for p in photos if p.filename]
    if len(photos) > 3:
        raise HTTPException(422, "Maximum 3 photos")
    urls = []
    for p in photos:
        data, mt = ai.read_image(p)
        path = f"{uuid.uuid4().hex}.{EXT[mt]}"
        admin.storage.from_("community").upload(path=path, file=data, file_options={"content-type": mt})
        urls.append(admin.storage.from_("community").get_public_url(path))
    row = {"name": name.strip(), "mobile": mobile, "category": category,
           "message": message.strip(), "photo_urls": urls}
    return admin.table("community_posts").insert(row).execute().data[0]
