import time
from collections import defaultdict

from fastapi import Depends, Header, HTTPException, Request

from .db import admin


def current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Please log in")
    try:
        user = admin.auth.get_user(authorization[7:]).user
    except Exception:
        raise HTTPException(401, "Session expired, please log in again")
    if not user:
        raise HTTPException(401, "Session expired, please log in again")
    # role lives in app_metadata, which users cannot edit themselves
    return {"id": user.id, "email": user.email, "role": (user.app_metadata or {}).get("role")}


def require(role: str):
    """Portals never mix: a home token cannot call campus routes and vice versa."""
    def dep(user: dict = Depends(current_user)) -> dict:
        if user["role"] != role:
            raise HTTPException(403, f"This area is only for {role} accounts")
        return user
    return dep


_hits: dict = defaultdict(list)


def limiter(name: str, limit: int, window: int = 3600):
    """Simple per-IP rate limit for public endpoints (AI cost / spam protection)."""
    def dep(request: Request):
        ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0]
        now, key = time.time(), (name, ip)
        _hits[key] = [t for t in _hits[key] if now - t < window]
        if len(_hits[key]) >= limit:
            raise HTTPException(429, "Too many requests, please try again later")
        _hits[key].append(now)
    return dep
