# apps/ai-service/src/ai_service/api/exception_handlers.py
from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from ai_service.common.exceptions import AppError, InternalServerError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """
    앱 전역 예외 처리기를 등록한다.

    처리 대상:
    - AppError 계열
    - FastAPI/Pydantic 요청 검증 실패
    - 그 외 모든 미처리 예외
    """

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        analysis_id = await _extract_analysis_id(request)

        return _build_error_response(
            status_code=exc.status_code,
            code=exc.code,
            message=exc.message,
            analysis_id=analysis_id,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_request_validation_error(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        logger.warning("Request validation failed: %s", exc.errors())

        analysis_id = await _extract_analysis_id(request)

        return _build_error_response(
            status_code=422,
            code="REQUEST_VALIDATION_ERROR",
            message="Request body validation failed.",
            analysis_id=analysis_id,
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled exception occurred.", exc_info=exc)

        internal_error = InternalServerError()
        analysis_id = await _extract_analysis_id(request)

        return _build_error_response(
            status_code=internal_error.status_code,
            code=internal_error.code,
            message=internal_error.message,
            analysis_id=analysis_id,
        )


def _build_error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    analysis_id: str | None,
) -> JSONResponse:
    """
    서비스 공통 실패 응답 포맷을 생성한다.
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "analysis_id": analysis_id,
            "status": "failed",
            "error": {
                "code": code,
                "message": message,
            },
        },
    )


async def _extract_analysis_id(request: Request) -> str | None:
    """
    요청 body에서 analysis_id를 추출한다.

    실패해도 예외를 내지 않고 None을 반환한다.
    이유:
    - 예외 처리기 안에서는 추가 실패를 만들면 안 되기 때문
    """
    try:
        body: Any = await request.json()
    except Exception:
        return None

    if not isinstance(body, dict):
        return None

    raw_analysis_id = body.get("analysis_id")
    if not isinstance(raw_analysis_id, str):
        return None

    normalized_analysis_id = raw_analysis_id.strip()
    return normalized_analysis_id or None