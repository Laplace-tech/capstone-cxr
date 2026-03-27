# apps/ai-service/src/ai_service/api/schemas/error.py
from __future__ import annotations

from pydantic import BaseModel

# 에러 상세 정보 스키마
class ErrorDetail(BaseModel):
    code: str
    message: str
    