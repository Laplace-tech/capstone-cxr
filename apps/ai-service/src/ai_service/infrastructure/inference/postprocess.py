# apps/ai-service/src/ai_service/infrastructure/inference/postprocess.py
from __future__ import annotations

from typing import Any

import torch

from ai_service.common.exceptions import InternalServerError
from ai_service.domain.models.prediction import LabelPrediction

# 모델 logits를 라벨별 최종 예측 결과로 변환
def build_label_predictions_from_logits(
    *,
    logits: torch.Tensor,
    label_order: tuple[str, ...],
    thresholds_by_label: dict[str, float],
) -> tuple[LabelPrediction, ...]:
    
    # logits 를 probabilities(sigmoid) 변환 & probability shape 검증
    probabilities = convert_logits_to_probabilities(logits=logits)
    _validate_probability_shape(
        probabilities=probabilities,
        expected_num_labels=len(label_order),
    )

    predictions: list[LabelPrediction] = []

    # label_order 순서대로 threshold 적용
    for index, label_name in enumerate(label_order):
        if label_name not in thresholds_by_label:
            raise InternalServerError(
                code="THRESHOLD_MISSING_FOR_LABEL",
                message=f"Threshold is missing for label: {label_name}",
            )

        probability = float(probabilities[index].item())
        threshold = float(thresholds_by_label[label_name])

        if not 0.0 <= threshold <= 1.0:
            raise InternalServerError(
                code="THRESHOLD_VALUE_INVALID",
                message=f"Threshold must be in [0, 1] for label: {label_name}",
            )

        predictions.append(
            LabelPrediction(
                name=label_name,
                probability=probability,
                threshold=threshold,
                prediction=probability >= threshold,
            )
        )

    # LabelPrediction tuple 반환
    return tuple(predictions)


def convert_logits_to_probabilities(*, logits: torch.Tensor) -> torch.Tensor:
    """
    모델 raw logits를 1D probability tensor로 변환한다.

    현재 정책:
    - batch size 1만 허용
    - sigmoid 사용
    """
    validated_logits = _validate_logits_tensor(logits)

    if validated_logits.ndim == 2:
        if validated_logits.shape[0] != 1:
            raise InternalServerError(
                code="LOGITS_BATCH_SIZE_INVALID",
                message="Inference logits must have batch size 1.",
            )
        validated_logits = validated_logits.squeeze(0)

    return torch.sigmoid(validated_logits)


def _validate_logits_tensor(logits: Any) -> torch.Tensor:
    """
    logits가 후처리 가능한 tensor인지 검증하고,
    후처리용 CPU float tensor로 정규화한다.
    """
    if not isinstance(logits, torch.Tensor):
        raise InternalServerError(
            code="LOGITS_INVALID",
            message="Model output logits must be a torch.Tensor.",
        )

    if logits.ndim not in (1, 2):
        raise InternalServerError(
            code="LOGITS_SHAPE_INVALID",
            message="Model output logits must be 1D or 2D tensor.",
        )

    if logits.numel() == 0:
        raise InternalServerError(
            code="LOGITS_EMPTY",
            message="Model output logits are empty.",
        )

    return logits.detach().float().cpu()


def _validate_probability_shape(
    *,
    probabilities: torch.Tensor,
    expected_num_labels: int,
) -> None:
    """
    probability tensor shape가 label_order 길이와 맞는지 검증한다.
    """
    if probabilities.ndim != 1:
        raise InternalServerError(
            code="PROBABILITY_SHAPE_INVALID",
            message="Postprocessed probabilities must be a 1D tensor.",
        )

    if probabilities.shape[0] != expected_num_labels:
        raise InternalServerError(
            code="PROBABILITY_LABEL_COUNT_MISMATCH",
            message=(
                "Number of probabilities does not match expected label count: "
                f"{probabilities.shape[0]} vs {expected_num_labels}"
            ),
        )