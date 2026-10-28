from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .routers import ai_routes, auth, campus, community, home
from .scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    sched = start_scheduler()
    yield
    sched.shutdown(wait=False)


app = FastAPI(title="Waste to Worth API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])

for r in (auth.router, ai_routes.router, home.router, campus.router, community.router):
    app.include_router(r)


@app.get("/api/health")
def health():
    return {"ok": True}
