# apps/ai-service/src/ai_service/api/schemas/error.py
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ErrorDetail(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    code: str = Field(
        ...,
        min_length=1,
        description="Stable machine-readable error code.",
    )
    message: str = Field(
        ...,
        min_length=1,
        description="Human-readable error message for debugging or operations.",
    )