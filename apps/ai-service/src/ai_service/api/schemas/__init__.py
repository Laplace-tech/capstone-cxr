# apps/ai-service/src/ai_service/api/schemas/__init__.py

from ai_service.api.schemas.error import ErrorDetail
from ai_service.api.schemas.predict_request import PredictRequest
from ai_service.api.schemas.predict_response import (
    GradcamPayload,
    LabelPredictionItem,
    PredictFailureResponse,
    PredictSuccessResponse,
)

__all__ = [
    "ErrorDetail",
    "PredictRequest",
    "GradcamPayload",
    "LabelPredictionItem",
    "PredictFailureResponse",
    "PredictSuccessResponse",
]