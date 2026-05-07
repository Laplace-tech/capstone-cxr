# apps/ai-service/src/ai_service/common/exceptions.py
from __future__ import annotations


class AppError(Exception):
    """
    모든 애플리케이션 커스텀 예외의 부모 클래스.

    - code: 기계적으로 분기 가능한 짧은 에러 코드
    - message: 사람이 읽을 수 있는 에러 메시지
    - status_code: HTTP 응답 상태코드
    """

    def __init__(
        self,
        *,
        code: str,
        message: str,
        status_code: int = 400,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class ValidationError(AppError):
    """잘못된 입력값 / 잘못된 요청 본문 / 잘못된 경로 등에 사용."""
    def __init__(
        self,
        *,
        code: str = "VALIDATION_ERROR",
        message: str = "Invalid request.",
    ) -> None:
        super().__init__(
            code=code,
            message=message,
            status_code=400,
        )


class NotFoundError(AppError):
    """파일이 없거나, 리소스를 찾지 못했을 때 사용."""
    def __init__(
        self,
        *,
        code: str = "NOT_FOUND",
        message: str = "Requested resource was not found.",
    ) -> None:
        super().__init__(
            code=code,
            message=message,
            status_code=404,
        )


class ConflictError(AppError):
    """현재 상태와 충돌하는 요청일 때 사용."""
    def __init__(
        self,
        *,
        code: str = "CONFLICT",
        message: str = "Request conflicts with current state.",
    ) -> None:
        super().__init__(
            code=code,
            message=message,
            status_code=409,
        )


class InternalServerError(AppError):
    """서버 내부에서 예상치 못한 오류가 났을 때 사용."""
    def __init__(
        self,
        *,
        code: str = "INTERNAL_SERVER_ERROR",
        message: str = "Internal server error.",
    ) -> None:
        super().__init__(
            code=code,
            message=message,
            status_code=500,
        )