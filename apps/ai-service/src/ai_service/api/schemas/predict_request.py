# apps/ai-service/src/ai_service/api/schemas/predict_request.py
# Backend -> AI 서비스로 들어오는 요청 body의 계약서

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


# POST: /predict 요청 스키마
class PredictRequest(BaseModel):
       
    # Backend가 생성한 분석 요청 ID
    analysis_id: str = Field(
        ...,
        min_length=1,
        description="Backend-generated analysis id",
    )
    
    # shared/uploads 기준 상대경로
    image_path: str = Field(
        ...,
        min_length=1,
        description="Path relative to shared/uploads. Example: analyses/{analysis_id}/input.jpg",
    )
    
    # Grad-CAM 생성 여부
    include_gradcam: bool = Field(
        default=False,
        description="Whether to generate Grad-CAM output",
    )

    @field_validator("analysis_id")
    @classmethod
    def validate_analysis_id(cls, value: str) -> str:
        if "/" in value or "\\" in value:
            raise ValueError("analysis_id must not contain path separators")
        return value