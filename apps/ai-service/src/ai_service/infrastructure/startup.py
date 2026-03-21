# apps/ai-service/src/ai_service/infrastructure/startup.py
# settings.py 에서 계산된 경로/설정을 받아서 서비스 시작 시점에 fail-fast 검증

from __future__ import annotations

import json
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence

from ai_service.infrastructure.settings import Settings, get_settings

# startup 검증이 끝난 뒤 앱이 재사용할 수 있는 결과 묶음
@dataclass(frozen=True, slots=True)
class StartupValidationResult:

    settings: Settings
    threshold_label_order: tuple[str, ...]
        
        
def validate_startup(
    settings: Settings | None = None,
    *,
    expected_label_order: Sequence[str] | None = None,
) -> StartupValidationResult:
    """
    서비스 시작 시 필요한 모든 기본 검증을 수행한다.

    검증 범위:
    - shared 디렉터리 레이아웃
    - uploads / generated 디렉터리 준비
    - artifacts / checkpoints 존재
    - best.pt / infer_thresholds.json / config_snapshot.json 존재
    - thresholds JSON 파싱 가능 여부
    - threshold label order와 기대 label order 일치 여부
    """
    current_settings = settings or get_settings()

    # 1) shared 레이아웃 검증
    _validate_shared_layout(current_settings)

    # 2) runtime 디렉터리 준비
    # uploads는 backend가 채우는 영역이므로 "존재 + 읽기 가능"만 본다.
    # generated는 ai-service가 결과를 쓰므로 생성 + 쓰기 가능까지 본다.
    _ensure_directory(current_settings.shared_uploads_dir, name="shared_uploads_dir")
    _require_readable_directory(
        current_settings.shared_uploads_dir,
        name="shared_uploads_dir",
    )

    _ensure_directory(current_settings.shared_generated_dir, name="shared_generated_dir")
    _require_writable_directory(
        current_settings.shared_generated_dir,
        name="shared_generated_dir",
    )

    # 3) artifacts 검증
    _require_existing_directory(current_settings.artifacts_root, name="artifacts_root")
    _require_existing_directory(
        current_settings.checkpoints_dir,
        name="checkpoints_dir",
    )

    _require_non_empty_file(current_settings.checkpoint_path, name="checkpoint_path")
    thresholds_payload = _load_json_dict(
        current_settings.thresholds_path,
        name="thresholds_path",
    )
    _validate_threshold_payload_shape(thresholds_payload)
    _load_json_dict(
        current_settings.config_snapshot_path,
        name="config_snapshot_path",
    )

    # 4) threshold label order 검증
    threshold_label_order = _extract_threshold_label_order(thresholds_payload)

    if expected_label_order is not None:
        expected = tuple(expected_label_order)

        if threshold_label_order != expected:
            raise ValueError(
                "Threshold label order does not match expected label order. "
                f"expected={expected}, actual={threshold_label_order}"
            )

    return StartupValidationResult(
        settings=current_settings,
        threshold_label_order=threshold_label_order,
    )        
        
        
# 필수 파일 존재 여부를 검증
def _require_existing_file(path: Path, *, name: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{name} not found: {path}")

    if not path.is_file():
        raise ValueError(f"{name} must be a file: {path}")
    
# 필수 파일이 비어 있지 않은지 검증
def _require_non_empty_file(path: Path, *, name: str) -> None:
    _require_existing_file(path, name=name)

    if path.stat().st_size <= 0:
        raise ValueError(f"{name} is empty: {path}")

# 필수 디렉터리 존재 여부를 검증
def _require_existing_directory(path: Path, *, name: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{name} not found: {path}")

    if not path.is_dir():
        raise ValueError(f"{name} must be a directory: {path}")
    
# 런타임에 필요한 디렉터리 생성
def _ensure_directory(path: Path, *, name: str) -> None:
    path.mkdir(parents=True, exist_ok=True)

    if not path.is_dir():
        raise ValueError(f"{name} must be a directory after mkdir: {path}")

# 디렉터리가 읽기 가능한지 검증
def _require_readable_directory(path: Path, *, name: str) -> None:
    _require_existing_directory(path, name=name)

    if not os.access(path, os.R_OK | os.X_OK):
        raise PermissionError(f"{name} is not readable: {path}")

# 디렉터리가 쓰기 가능한지 검증
def _require_writable_directory(path: Path, *, name: str) -> None:
    _require_existing_directory(path, name=name)

    try:
        with tempfile.NamedTemporaryFile(dir=path, prefix=".write_test_", delete=True):
            pass
    except OSError as exc:
        raise PermissionError(f"{name} is not writable: {path}") from exc

# JSON 파일을 읽고 최상위 dict 여부를 검증
def _load_json_dict(path: Path, *, name: str) -> dict[str, Any]:
    _require_non_empty_file(path, name=name)

    try:
        with path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{name} is not valid JSON: {path}") from exc

    if not isinstance(payload, dict):
        raise ValueError(f"{name} root must be a JSON object: {path}")

    return payload


def _extract_threshold_label_order(payload: dict[str, Any]) -> tuple[str, ...]:
    """
    threshold JSON에서 label order를 추출한다.

    현재 서비스 baseline에서 가장 신뢰하는 형식은:
    - payload["labels"] = ["Atelectasis", ...]
    """

    labels = payload.get("labels")
    if isinstance(labels, list) and labels:
        normalized_labels: list[str] = []

        for item in labels:
            if not isinstance(item, str) or not item.strip():
                raise ValueError("thresholds.labels must contain non-empty strings")
            normalized_labels.append(item.strip())

        return tuple(normalized_labels)

    label_order = payload.get("label_order")
    if isinstance(label_order, list) and label_order:
        normalized_label_order: list[str] = []

        for item in label_order:
            if not isinstance(item, str) or not item.strip():
                raise ValueError("thresholds.label_order must contain non-empty strings")
            normalized_label_order.append(item.strip())

        return tuple(normalized_label_order)

    per_label = payload.get("per_label")
    if isinstance(per_label, list) and per_label:
        extracted_labels: list[str] = []

        for item in per_label:
            if not isinstance(item, dict):
                raise ValueError("thresholds.per_label items must be JSON objects")

            raw_label = item.get("label")
            if not isinstance(raw_label, str) or not raw_label.strip():
                raise ValueError("thresholds.per_label.label must be a non-empty string")

            extracted_labels.append(raw_label.strip())

        return tuple(extracted_labels)

    thresholds = payload.get("thresholds")
    if isinstance(thresholds, dict) and thresholds:
        normalized_threshold_keys: list[str] = []

        for key in thresholds.keys():
            if not isinstance(key, str) or not key.strip():
                raise ValueError("thresholds keys must be non-empty strings")
            normalized_threshold_keys.append(key.strip())

        return tuple(normalized_threshold_keys)

    raise ValueError(
        "Could not extract label order from thresholds JSON. "
        "Expected one of: labels, label_order, per_label, thresholds(dict)"
    )
    

def _validate_shared_layout(settings: Settings) -> None:
    """
    shared 하위 경로가 shared_root 내부에 있는지 검증한다.
    """
    if not settings.shared_uploads_dir.is_relative_to(settings.shared_root):
        raise ValueError(
            "shared_uploads_dir must be inside shared_root: "
            f"{settings.shared_uploads_dir} not under {settings.shared_root}"
        )

    if not settings.shared_generated_dir.is_relative_to(settings.shared_root):
        raise ValueError(
            "shared_generated_dir must be inside shared_root: "
            f"{settings.shared_generated_dir} not under {settings.shared_root}"
        )


def _validate_threshold_payload_shape(payload: dict[str, Any]) -> None:
    """
    threshold payload의 기본 shape를 검증한다.

    현재 baseline 기대 형식:
    - labels: list[str]
    - thresholds: list[number]
    - len(labels) == len(thresholds)
    """
    labels = payload.get("labels")
    thresholds = payload.get("thresholds")

    if labels is None or thresholds is None:
        return

    if not isinstance(labels, list):
        raise ValueError("thresholds.labels must be a list")

    if not isinstance(thresholds, list):
        raise ValueError("thresholds.thresholds must be a list")

    if len(labels) != len(thresholds):
        raise ValueError(
            "thresholds.labels and thresholds.thresholds length mismatch: "
            f"{len(labels)} != {len(thresholds)}"
        )

    for index, label in enumerate(labels):
        if not isinstance(label, str) or not label.strip():
            raise ValueError(
                f"thresholds.labels[{index}] must be a non-empty string"
            )

    for index, threshold in enumerate(thresholds):
        if not isinstance(threshold, (int, float)):
            raise ValueError(
                f"thresholds.thresholds[{index}] must be a number"
            )

