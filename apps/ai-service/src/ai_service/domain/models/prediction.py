# apps/ai-service/src/ai_service/domain/models/prediction.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
   

PredictionStatus = Literal["success", "failed"]


@dataclass(frozen=True, slots=True)
class LabelPrediction:
    name: str
    probability: float
    threshold: float
    prediction: bool
    

@dataclass(frozen=True, slots=True)
class GradcamResult:
    available: bool
    overlay_path: str | None
    

@dataclass(frozen=True, slots=True)
class PredictResult:
    analysis_id: str
    status: PredictionStatus
    model_version: str
    threshold_version: str
    image_size: int
    label_order: tuple[str, ...]
    labels: tuple[LabelPrediction, ...]
    gradcam: GradcamResult