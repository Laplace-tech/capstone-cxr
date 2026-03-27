# apps/ai-service/src/ai_service/api/routers/predict.py
from __future__ import annotations

from fastapi import APIRouter

from ai_service.api.schemas.predict_request import PredictRequest
from ai_service.api.schemas.predict_response import (
    GradcamPayload,
    LabelPredictionItem,
    PredictFailureResponse,
    PredictSuccessResponse,
)
from ai_service.application.services.predict_service import run_predict
from ai_service.domain.models.prediction import PredictResult


router = APIRouter(tags=["predict"])


@router.post(
    "/predict",
    response_model=PredictSuccessResponse,
    responses={
        400: {"model": PredictFailureResponse},
        404: {"model": PredictFailureResponse},
        422: {"model": PredictFailureResponse},
        500: {"model": PredictFailureResponse},
    },
)
async def predict(request: PredictRequest) -> PredictSuccessResponse:
    result = run_predict(
        analysis_id=request.analysis_id,
        image_path=request.image_path,
        include_gradcam=request.include_gradcam,
    )
    return _to_success_response(result)


def _to_success_response(result: PredictResult) -> PredictSuccessResponse:
    return PredictSuccessResponse(
        analysis_id=result.analysis_id,
        status=result.status,
        model_version=result.model_version,
        threshold_version=result.threshold_version,
        image_size=result.image_size,
        label_order=list(result.label_order),
        labels=[
            LabelPredictionItem(
                name=item.name,
                probability=item.probability,
                threshold=item.threshold,
                prediction=item.prediction,
            )
            for item in result.labels
        ],
        gradcam=GradcamPayload(
            available=result.gradcam.available,
            overlay_path=result.gradcam.overlay_path,
        ),
    )