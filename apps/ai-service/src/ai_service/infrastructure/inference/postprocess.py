# apps/ai-service/src/ai_service/infrastructure/inference/postprocess.py
from __future__ import annotations

from typing import Any

import torch

from ai_service.common.exceptions import InternalServerError
from ai_service.domain.models.prediction import LabelPrediction


def build_label_predictions_from_logits(
    *,
    logits: torch.Tensor,
    label_order: tuple[str, ...],
    thresholds_by_label: dict[str, float],
) -> tuple[LabelPrediction, ...]:
    probabilities = convert_logits_to_probabilities(logits=logits)
    _validate_probability_shape(
        probabilities=probabilities,
        expected_num_labels=len(label_order),
    )

    predictions: list[LabelPrediction] = []

    for index, label_name in enumerate(label_order):
        if label_name not in thresholds_by_label:
            raise InternalServerError(
                code="THRESHOLD_MISSING_FOR_LABEL",
                message=f"Threshold is missing for label: {label_name}",
            )

        probability = float(probabilities[index].item())
        threshold = float(thresholds_by_label[label_name])

        predictions.append(
            LabelPrediction(
                name=label_name,
                probability=probability,
                threshold=threshold,
                prediction=probability >= threshold,
            )
        )

    return tuple(predictions)


def convert_logits_to_probabilities(*, logits: torch.Tensor) -> torch.Tensor:
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