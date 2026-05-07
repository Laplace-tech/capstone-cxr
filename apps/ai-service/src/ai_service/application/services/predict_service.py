# apps/ai-service/src/ai_service/application/services/predict_service.py
from __future__ import annotations

import logging
import re
from typing import Final

import torch

from ai_service.common.exceptions import ValidationError
from ai_service.domain.models.prediction import GradcamResult, PredictResult
from ai_service.infrastructure.inference.gradcam_service import generate_gradcam_overlay
from ai_service.infrastructure.inference.postprocess import (
    build_label_predictions_from_logits,
)
from ai_service.infrastructure.inference.preprocessing import (
    preprocess_image_for_inference,
)
from ai_service.infrastructure.inference.runtime import get_inference_runtime
from ai_service.infrastructure.io.uploads import (
    resolve_upload_image_path,
    validate_upload_image_file,
)
from ai_service.infrastructure.settings import Settings, get_settings

logger = logging.getLogger(__name__)

PREDICT_STATUS_SUCCESS: Final[str] = "success"

_ANALYSIS_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]+$")


# [오케스트레이션]
#
# 1. path 해석/검증 → uploads 쪽
# 2. runtime/model 확보 → runtime 쪽
# 3. 전처리 → preprocessing 쪽
# 4. 후처리 → postprocess 쪽
# 5. Grad-CAM 생성 → gradcam_service 쪽
def run_predict(
    *,
    analysis_id     : str,
    image_path      : str,
    include_gradcam : bool = False,
    settings        : Settings | None = None,
) -> PredictResult:
    
    # apps/ai-service/src/ai_service/infrastructure/settings.py
    cfg = settings or get_settings() 
    
    # analysis_id에 대하여 정규화 & 검증
    normalized_analysis_id = _validate_analysis_id(analysis_id)

    # 이미지 경로 해석 & 파일 검증
    # apps/ai-service/src/ai_service/infrastructure/io/uploads.py
    resolved_image_path = resolve_upload_image_path( 
        image_path=image_path,
        settings=cfg,
    )
    validate_upload_image_file(
        image_file_path=resolved_image_path,
        settings=cfg,
    )

    # 모델/아티팩트/device/runtime 확보
    # apps/ai-service/src/ai_service/infrastructure/inference/runtime.py
    runtime = get_inference_runtime(settings=cfg)

    # 전처리: 입력 이미지 -> 모델 입력 tensor로 변환
    # apps/ai-service/src/ai_service/infrastructure/inference/preprocessing.py
    preprocessed_image = preprocess_image_for_inference(
        image_path=resolved_image_path,
        image_size=runtime.artifacts.image_size,
        device=runtime.device,
    )

    # 모델 추론
    with torch.inference_mode():
        logits = runtime.model(preprocessed_image.image_tensor)

    # logits -> sigmoid -> threshold -> 라벨별 예측 결과
    # apps/ai-service/src/ai_service/infrastructure/inference/postprocess.py
    label_predictions = build_label_predictions_from_logits(
        logits=logits,
        label_order=runtime.artifacts.label_order,
        thresholds_by_label=runtime.artifacts.thresholds.as_dict(),
    )

    # Grad-CAM 결과 조립
    gradcam = _build_gradcam_result(
        analysis_id=normalized_analysis_id,
        include_gradcam=include_gradcam,
        settings=cfg,
        image_path=resolved_image_path,
        image_tensor=preprocessed_image.image_tensor,
        model=runtime.model,
        label_predictions=label_predictions,
    )

    # 최종 결과 반환: 
    return PredictResult(
        analysis_id=normalized_analysis_id,
        status=PREDICT_STATUS_SUCCESS,
        model_version=runtime.artifacts.model_version,
        threshold_version=runtime.artifacts.thresholds.version,
        image_size=runtime.artifacts.image_size,
        label_order=runtime.artifacts.label_order,
        labels=label_predictions,
        gradcam=gradcam,
    )


def _validate_analysis_id(analysis_id: str) -> str:
    normalized = analysis_id.strip()

    if not normalized:
        raise ValidationError(
            code="INVALID_ANALYSIS_ID",
            message="analysis_id must not be empty.",
        )

    if not _ANALYSIS_ID_PATTERN.fullmatch(normalized):
        raise ValidationError(
            code="INVALID_ANALYSIS_ID",
            message=(
                "analysis_id may contain only letters, digits, dot, "
                "underscore, and hyphen."
            ),
        )

    return normalized


def _build_gradcam_result(
    *,
    analysis_id: str,
    include_gradcam: bool,
    settings: Settings,
    image_path: str,
    image_tensor: torch.Tensor,
    model: torch.nn.Module,
    label_predictions: tuple,
) -> GradcamResult:
    if not include_gradcam:
        return GradcamResult(
            available=False,
            overlay_path=None,
        )

    target_label_index = _select_gradcam_target_index(label_predictions)

    try:
        overlay_relative_path = generate_gradcam_overlay(
            analysis_id=analysis_id,
            image_path=image_path,
            image_tensor=image_tensor,
            model=model,
            target_label_index=target_label_index,
            settings=settings,
        )
    except Exception:
        logger.exception("Grad-CAM generation failed for analysis_id=%s", analysis_id)
        return GradcamResult(
            available=False,
            overlay_path=None,
        )

    return GradcamResult(
        available=True,
        overlay_path=overlay_relative_path,
    )


def _select_gradcam_target_index(label_predictions: tuple) -> int:
    if not label_predictions:
        raise ValidationError(
            code="GRADCAM_TARGET_SELECTION_FAILED",
            message="No label predictions available for Grad-CAM target selection.",
        )

    max_index = 0
    max_probability = float(label_predictions[0].probability)

    for index, prediction in enumerate(label_predictions[1:], start=1):
        probability = float(prediction.probability)
        if probability > max_probability:
            max_probability = probability
            max_index = index

    return max_index