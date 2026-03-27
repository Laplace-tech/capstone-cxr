# apps/ai-service/src/ai_service/api/exception_handlers.py
from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from ai_service.common.exceptions import AppError, InternalServerError

# 서버 로그용 로거
logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    
    # raise 로 발생시킨 AppError 계열 예외 처리
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        analysis_id = await _extract_analysis_id(request)

        return _build_error_response(
            status_code=exc.status_code,
            code=exc.code,
            message=exc.message,
            analysis_id=analysis_id,
        )

    # FastAPI/Pydantic 레벨 요청 검증 실패 처리
    # ex: 필수 필드 누락, 타입 불일치 등
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

    # 위에서 처리하지 못한 모든 예외를 마지막에 잡는다.
    # 내부 구현 정보는 숨기고, 공통 500 응답만 내려준다.
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


# 에러 응답 포맷을 한 군데서만 만들게 분리
def _build_error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    analysis_id: str | None,
) -> JSONResponse:
    
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


# 요청 body에서 analysis_id를 꺼내는 헬퍼
async def _extract_analysis_id(request: Request) -> str | None:

    try:
        body: Any = await request.json()
    except Exception:
        # JSON 파싱 자체가 안 되면 analysis_id 추출 불가
        return None

    # body가 dict(JSON object)가 아니면 사용 불가
    if not isinstance(body, dict):
        return None

    raw_analysis_id = body.get("analysis_id")

    # analysis_id는 문자열만 허용
    if not isinstance(raw_analysis_id, str):
        return None

    # 공백만 들어온 경우는 None 처리
    normalized_analysis_id = raw_analysis_id.strip()
    return normalized_analysis_id or None