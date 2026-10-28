from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from .. import ai
from ..deps import limiter

router = APIRouter(prefix="/api/ai", tags=["ai"], dependencies=[Depends(limiter("ai", 30))])


@router.post("/identify")
def identify(image: UploadFile = File(...)):
    return ai.ask(ai.IDENTIFY_SYS, "Identify this waste item.", [ai.read_image(image)])


@router.post("/reuse")
def reuse(image: UploadFile | None = File(None), description: str = Form("")):
    if not image and not description.strip():
        raise HTTPException(400, "Add a photo or describe the item")
    imgs = [ai.read_image(image)] if image else []
    return ai.ask(ai.REUSE_SYS, f"User description: {description.strip()[:500] or 'none'}", imgs)
