from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from ..db import admin, anon_client

router = APIRouter(prefix="/api/auth", tags=["auth"])
PORTALS = {"home", "student", "staff"}


class Creds(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str | None = Field(default=None, max_length=80)


def _check(portal: str):
    if portal not in PORTALS:
        raise HTTPException(404, "Unknown portal")


def _login(portal: str, email: str, password: str) -> dict:
    try:
        res = anon_client().auth.sign_in_with_password({"email": email, "password": password})
    except Exception:
        raise HTTPException(401, "Wrong email or password")
    if (res.user.app_metadata or {}).get("role") != portal:
        raise HTTPException(403, f"This account is not a {portal} account. Use the correct login.")
    return {"access_token": res.session.access_token, "email": res.user.email, "role": portal}


@router.post("/{portal}/signup", status_code=201)
def signup(portal: str, body: Creds):
    _check(portal)
    try:
        res = admin.auth.admin.create_user({
            "email": body.email, "password": body.password, "email_confirm": True,
            "app_metadata": {"role": portal}, "user_metadata": {"full_name": body.full_name},
        })
    except Exception as e:
        raise HTTPException(400, "Could not create account (email may already be registered)") from e
    admin.table("profiles").insert(
        {"id": res.user.id, "email": body.email, "role": portal, "full_name": body.full_name}
    ).execute()
    return _login(portal, body.email, body.password)


@router.post("/{portal}/login")
def login(portal: str, body: Creds):
    _check(portal)
    return _login(portal, body.email, body.password)
