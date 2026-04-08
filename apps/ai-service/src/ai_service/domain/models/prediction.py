# apps/ai-service/src/ai_service/domain/models/prediction.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
   
   
PredictionStatus = Literal["success", "failed"]

@dataclass(frozen=True, slots=True)
class LabelPrediction:
    """ 라벨 하나에 대한 내부 예측 결과 """
    name: str
    probability: float
    threshold: float
    prediction: bool
    

@dataclass(frozen=True, slots=True)
class GradcamResult:
    """
    Grad-CAM 생성 결과.
    - available=False 이면 overlay_path=None
    - available=True  이면 overlay_path는 상대경로 문자열
    """
    available: bool
    overlay_path: str | None
    

@dataclass(frozen=True, slots=True)
class PredictResult:
    """예측 전체 결과를 묶는 내부 domain 모델."""
    analysis_id: str
    status: PredictionStatus
    model_version: str
    threshold_version: str
    image_size: int
    label_order: tuple[str, ...]
    labels: tuple[LabelPrediction, ...]
    gradcam: GradcamResult