# apps/ai-service/src/ai_service/api/schemas/predict_response.py
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from ai_service.api.schemas.error import ErrorDetail

# 라벨별 예측 결과 1개를 나타내는 스키마
class LabelPredictionItem(BaseModel):
    name: str      
    probability: float = Field(..., ge=0.0, le=1.0)
    threshold: float = Field(..., ge=0.0, le=1.0)
    prediction: bool
    
    
# Grad-CAM 정보 스키마
class GradcamPayload(BaseModel):
    
    # Grad-CAM 결과가 실제로 생성되었는지 여부
    available: bool
    
    # 생성된 Grad-CAM 오버레이 이미지 경로
    overlay_path: str | None = Field(
        default=None,
        description="Path relative to shared/generated. Example: analyses/{analysis_id}/gradcam_overlay.png",
    )
    


# 예측 성공 응답(Response) 스키마
class PredictSuccessResponse(BaseModel):
    analysis_id: str           # 어떤 분석 요청에 대한 응답인지 식별하는 ID
    status: Literal["success"] # 성공 응답에서는 status가 무조건 "success" 여야 함
    model_version: str         # 어떤 모델 버전으로 추론했는지 명시 (ex: "baseline_01_run_20260321_125758")
    threshold_version: str     # 어떤 threshold 버전을 사용했는지 (ex: "f1_grid_20260321")
    image_size: int            # 입력 이미지에 적용한 모델 입력 크기 (320 x 320)
    label_order: list[str]     # 라벨의 고정 순서lectasis", "Cardiomegaly", "Consolidation", "Edema", "Pleural Effusion"]
    labels: list[LabelPredictionItem] # 각 라벨에 대한 예측 결과 목록
    gradcam: GradcamPayload           # Grad-CAM 관련 정보



# 예측 실패 응답(Response) 스키마
class PredictFailureResponse(BaseModel):
    analysis_id: str | None = None  # analysis_id를 알 수 있으면 넣고, 요청 자체가 잘못돼서 식별이 안 되면 None일 수도 있음.
    status: Literal["failed"]       # 실패 응답에서는 status가 무조건 "failed"
    error: ErrorDetail              # 실제 에러 내용