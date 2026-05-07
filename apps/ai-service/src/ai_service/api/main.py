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


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # 서버 시작 전에 배포 자산/경로/라벨 순서를 검증한다.
    app.state.startup_context = validate_startup(
        expected_label_order=CHEXPERT_LABELS
    )
    yield


def create_app() -> FastAPI:
    # FastAPI 앱 생성
    app = FastAPI(lifespan=lifespan)

    # 전역 예외 처리기 등록
    register_exception_handlers(app)

    # health / predict / version 라우터 붙임
    app.include_router(health_router)
    app.include_router(predict_router)
    app.include_router(version_router)

    return app


app = create_app()
