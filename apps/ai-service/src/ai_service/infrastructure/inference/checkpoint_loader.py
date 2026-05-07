# apps/ai-service/src/ai_service/infrastructure/inference/checkpoint_loader.py
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import torch
import torch.nn as nn
from torchvision.models import densenet121

from ai_service.common.exceptions import InternalServerError, NotFoundError

logger = logging.getLogger(__name__)



# 체크포인트 파일을 읽어 추론 가능한 DenseNet121 모델로 복구하여 반환
def load_model_from_checkpoint(
    *,
    checkpoint_path: str | Path,  # checkpoint_path : 어떤 .pt 파일을 로드할지 경로로 명시
    num_classes: int,             # num_classes     : classifier 출력 차원 수
    device: torch.device,         # device          : CPU / GPU
) -> nn.Module: 
    
    # checkpoint 파일 경로 확인
    resolved_checkpoint_path = _resolve_checkpoint_path(checkpoint_path)
    
    logger.info(
        "Loading checkpoint. path=%s device=%s num_classes=%d",
        resolved_checkpoint_path,
        device,
        num_classes,
    )
    
    # checkpoint 파일 로딩
    checkpoint = _load_checkpoint_file(
        checkpoint_path=resolved_checkpoint_path,
        device=device,
    )

    # DenseNet121 구조 생성
    model = _build_densenet121(num_classes=num_classes)
    state_dict = _extract_state_dict(checkpoint)
    normalized_state_dict = _normalize_state_dict_keys(state_dict)


    # 모델에 가중치 로드
    # - strict=True: 모델 구조와 checkpoint 가중치가 정확히 일치해야만 로드 성공
    try:
        model.load_state_dict(normalized_state_dict, strict=True)
    except RuntimeError as exc:
        raise InternalServerError(
            code="CHECKPOINT_STATE_DICT_MISMATCH",
            message="Checkpoint weights do not match the DenseNet121 model structure.",
        ) from exc

    # 모델을 CPU or GPU로 옮김 & 추론 모드 전환
    model.to(device)
    model.eval()
    
    logger.info(
        "Checkpoint loaded successfully. path=%s",
        resolved_checkpoint_path.name,
    )
    
    return model


# 현재 런타임에서 사용할 추론 디바이스 결정
def resolve_runtime_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")




# checkpoint 경로가 실제 파일인지 확인
def _resolve_checkpoint_path(checkpoint_path: str | Path) -> Path:
    path = Path(checkpoint_path)

    if not path.exists() or not path.is_file():
        raise NotFoundError(
            code="CHECKPOINT_NOT_FOUND",
            message=f"Checkpoint file not found: {path}",
        )

    return path


# torch.load로 checkpoint payload를 읽기
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


# 서비스 기준선 DenseNet121 구조를 생성
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


# checkpoint payload 안에서 진짜 모델 가중치 dict를 꺼낸다.
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


# state_dict의 key/value가 str -> torch.Tensor 형태인지 검증
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