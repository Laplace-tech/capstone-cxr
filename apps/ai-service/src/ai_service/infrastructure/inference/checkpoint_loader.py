# apps/ai-service/src/ai_service/infrastructure/inference/checkpoint_loader.py
from __future__ import annotations

from pathlib import Path
from typing import Any

import torch
import torch.nn as nn
from torchvision.models import densenet121

from ai_service.common.exceptions import InternalServerError, NotFoundError


def load_model_from_checkpoint(
    *,
    checkpoint_path: str | Path,
    num_classes: int,
    device: torch.device,
) -> nn.Module:
    resolved_checkpoint_path = _resolve_checkpoint_path(checkpoint_path)
    checkpoint = _load_checkpoint_file(
        checkpoint_path=resolved_checkpoint_path,
        device=device,
    )

    model = _build_densenet121(num_classes=num_classes)
    state_dict = _extract_state_dict(checkpoint)
    normalized_state_dict = _normalize_state_dict_keys(state_dict)

    try:
        model.load_state_dict(normalized_state_dict, strict=True)
    except RuntimeError as exc:
        raise InternalServerError(
            code="CHECKPOINT_STATE_DICT_MISMATCH",
            message="Checkpoint weights do not match the DenseNet121 model structure.",
        ) from exc

    model.to(device)
    model.eval()
    return model


def resolve_runtime_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _resolve_checkpoint_path(checkpoint_path: str | Path) -> Path:
    path = Path(checkpoint_path)

    if not path.exists() or not path.is_file():
        raise NotFoundError(
            code="CHECKPOINT_NOT_FOUND",
            message=f"Checkpoint file not found: {path}",
        )

    return path


def _load_checkpoint_file(
    *,
    checkpoint_path: Path,
    device: torch.device,
) -> dict[str, Any] | dict[str, torch.Tensor]:
    try:
        checkpoint = torch.load(
            checkpoint_path,
            map_location=device,
            weights_only=False,
        )
    except OSError as exc:
        raise InternalServerError(
            code="CHECKPOINT_READ_FAILED",
            message=f"Failed to read checkpoint file: {checkpoint_path.name}",
        ) from exc
    except Exception as exc:
        raise InternalServerError(
            code="CHECKPOINT_LOAD_FAILED",
            message=f"Failed to load checkpoint: {checkpoint_path.name}",
        ) from exc

    if not isinstance(checkpoint, dict):
        raise InternalServerError(
            code="CHECKPOINT_INVALID_FORMAT",
            message="Checkpoint payload must be a dictionary.",
        )

    return checkpoint


def _build_densenet121(*, num_classes: int) -> nn.Module:
    model = densenet121(weights=None)

    if not hasattr(model, "classifier"):
        raise InternalServerError(
            code="MODEL_BUILD_FAILED",
            message="DenseNet121 model does not expose a classifier layer.",
        )

    in_features = model.classifier.in_features
    model.classifier = nn.Linear(in_features, num_classes)
    return model


def _extract_state_dict(
    checkpoint: dict[str, Any] | dict[str, torch.Tensor],
) -> dict[str, torch.Tensor]:
    candidate_keys = (
        "model_state_dict",
        "state_dict",
        "model",
    )

    for key in candidate_keys:
        raw_state_dict = checkpoint.get(key)
        if isinstance(raw_state_dict, dict):
            return _validate_tensor_state_dict(raw_state_dict)

    if _looks_like_state_dict(checkpoint):
        return _validate_tensor_state_dict(checkpoint)

    raise InternalServerError(
        code="CHECKPOINT_STATE_DICT_MISSING",
        message="Could not find a valid model state_dict in checkpoint.",
    )


def _validate_tensor_state_dict(
    raw_state_dict: dict[str, Any],
) -> dict[str, torch.Tensor]:
    validated: dict[str, torch.Tensor] = {}

    for key, value in raw_state_dict.items():
        if not isinstance(key, str):
            raise InternalServerError(
                code="CHECKPOINT_STATE_DICT_INVALID",
                message="Checkpoint state_dict contains a non-string key.",
            )

        if not isinstance(value, torch.Tensor):
            raise InternalServerError(
                code="CHECKPOINT_STATE_DICT_INVALID",
                message=f"Checkpoint state_dict entry is not a tensor: {key}",
            )

        validated[key] = value

    return validated


def _normalize_state_dict_keys(
    state_dict: dict[str, torch.Tensor],
) -> dict[str, torch.Tensor]:
    normalized: dict[str, torch.Tensor] = {}

    for key, value in state_dict.items():
        normalized_key = key[7:] if key.startswith("module.") else key
        normalized[normalized_key] = value

    return normalized


def _looks_like_state_dict(candidate: dict[str, Any]) -> bool:
    if not candidate:
        return False

    first_key = next(iter(candidate.keys()))
    first_value = candidate[first_key]

    return isinstance(first_key, str) and isinstance(first_value, torch.Tensor)