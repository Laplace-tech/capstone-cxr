# apps/ai-service/src/ai_service/api/schemas/predict_response.py
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from ai_service.api.schemas.error import ErrorDetail


# 예측 성공 응답(Response) 스키마
class PredictSuccessResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    # 분석 요청 식별자    
    analysis_id: str = Field(
        ...,
        min_length=1,
        description="Backend-generated analysis identifier."
    ) 
    
    # 성공 응답 고정값
    status: Literal["success"] = Field(
        ...,
        description='Fixed status value for successful responses.',
    )

    # 모델 버전
    model_version: str = Field(
        ...,
        min_length=1,
        description="Model version identifier used for inference.",
    )
    
    # threshold 버전
    threshold_version: str = Field(
        ...,
        min_length=1,
        description="Threshold version identifier used for post-processing.",
    )
    
    # 모델 입력 크기
    image_size: int = Field(
        ...,
        gt=0,
        description="Square model input size. Example: 320.",
    )
    
        # 라벨 고정 순서
    label_order: list[str] = Field(
        ...,
        min_length=1,
        description="Fixed label order used by the model and thresholds.",
    )

    # 라벨별 예측 결과
    labels: list[LabelPredictionItem] = Field(
        ...,
        min_length=1,
        description="Per-label prediction results in the same order as label_order.",
    )

    # Grad-CAM 결과
    gradcam: GradcamPayload = Field(
        ...,
        description="Grad-CAM generation result.",
    )
    
    
# 예측 실패 응답(Response) 스키마
class PredictFailureResponse(BaseModel):
    # 식별 가능한 경우에만 포함
    analysis_id: str | None = Field(
        default=None,
        description="Analysis identifier if it could be extracted from the request.",
    )

    # 실패 응답 고정값
    status: Literal["failed"] = Field(
        ...,
        description='Fixed status value for failed responses.',
    )

    # 표준 에러 payload
    error: ErrorDetail = Field(
        ...,
        description="Standardized error detail payload.",
    )


# 라벨별 예측 결과 1개를 나타내는 스키마
class LabelPredictionItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    # 라벨 이름
    name: str = Field(
        ...,
        min_length=1,
        description="Label name in the fixed model label order.",
    )

    # sigmoid probability
    probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Predicted probability in the range [0, 1].",
    )

    # 해당 라벨에 적용한 threshold
    threshold: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Decision threshold in the range [0, 1].",
    )

    # threshold 적용 후 최종 예측값
    prediction: bool = Field(
        ...,
        description="Final binary prediction after thresholding.",
    )
    
    
class GradcamPayload(BaseModel):
    
    # Grad-CAM 생성 여부
    available: bool = Field(
        ...,
        description="Whether a Grad-CAM overlay was successfully generated.",
    )
    
    # shared/generated 기준 상대경로
    overlay_path: str | None = Field(
        default=None,
        description=(
            "Path relative to shared/generated. "
            "Example: analyses/{analysis_id}/gradcam_overlay.png"
        ),
    )
    
    @model_validator(mode="after")
    def validate_overlay_consistency(self) -> GradcamPayload:
        # available=False면 overlay_path는 없어야 하고,
        # available=True면 overlay_path가 있어야 한다.
        if self.available and not self.overlay_path:
            raise ValueError("overlay_path is required when gradcam is available")

        if not self.available and self.overlay_path is not None:
            raise ValueError("overlay_path must be None when gradcam is unavailable")

        return self
    


