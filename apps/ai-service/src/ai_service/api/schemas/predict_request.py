# apps/ai-service/src/ai_service/api/schemas/predict_request.py
 
from __future__ import annotations
 
from pydantic import BaseModel, Field

# 예측 요청(Request) 스키마
class PredictRequest(BaseModel):
       
    # backend가 미리 생성한 분석 ID (ex: "uuid-123")
    analysis_id: str = Field(
        ...,
        min_length=1,
        description="Backend-generated analysis id",
    )
    
    # 업로드된 이미지의 상대 경로
    image_path: str = Field(
        ...,
        min_length=1,
        description="Path relative to shared/uploads. Example: analyses/{analysis_id}/input.jpg",
    )
    
    # Grad-CAM 결과도 같이 생성할지 여부
    # (Request에서 이 값을 안 보내면 자동으로 False가 들어감)
    include_gradcam: bool = Field(
        default=False,
        description="Whether to generate Grad-CAM output",
    )
