from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.graph_db import close_driver, get_driver
from app.routers import ai, auth, curriculum, exam, gaps, plan


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_driver()
    yield
    await close_driver()


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(curriculum.router)
app.include_router(exam.router)
app.include_router(gaps.router)
app.include_router(plan.router)
app.include_router(ai.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME}
