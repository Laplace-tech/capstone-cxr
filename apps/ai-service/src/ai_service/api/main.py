# apps/ai-service/src/ai_service/api/main.py
from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI

from ai_service.domain.constants.labels import CHEXPERT_LABELS
from ai_service.infrastructure.startup import validate_startup

from ai_service.api.exception_handlers import register_exception_handlers

from ai_service.api.routers.health import router as health_router
from ai_service.api.routers.predict import router as predict_router
from ai_service.api.routers.version import router as version_router

# PYTHONPATH=src uvicorn ai_service.api.main:app --reload

@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    validate_startup(expected_label_order=CHEXPERT_LABELS)
    yield


app = FastAPI(lifespan=lifespan)

register_exception_handlers(app)

app.include_router(health_router)
app.include_router(predict_router)
app.include_router(version_router)