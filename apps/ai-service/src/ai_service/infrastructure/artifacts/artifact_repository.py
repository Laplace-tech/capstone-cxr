# apps/ai-service/src/ai_service/infrastructure/artifacts/artifact_repository.py
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ai_service.common.exceptions import InternalServerError, NotFoundError
from ai_service.infrastructure.settings import Settings, get_settings


# threshold 묶음 전용 값 객체
@dataclass(frozen=True, slots=True)
class ThresholdSet:
    # version     : threshold 파일/기준 버전명
    # label_order : threshold 값이 대응하는 label 순서
    # values      : label_order와 같은 순서의 threshold 값들
    version: str
    label_order: tuple[str, ...]
    values: tuple[float, ...]

    # tuble 기반 threshold 정보를 {"Atelectasis": 0.46, ...} 같은 dict 형태로 바꿔줌
    def as_dict(self) -> dict[str, float]:
        return dict(zip(self.label_order, self.values, strict=True))


# 서비스 추론에 필요한 핵심 아티팩트를 한 번에 담는 값 객체
@dataclass(frozen=True, slots=True)
class InferenceArtifacts:
    checkpoint_path: Path        # 모델 가중치 파일 경로
    config_snapshot_path: Path   # 학습/추론 설정 스냅샷 JSON
    thresholds_path: Path        # threshold JSON 파일
    model_version: str           # 외부 응답에 내려줄 모델 버전 문자열
    image_size: int              # 전처리/입력 크기 
    label_order: tuple[str, ...] # 레이블 순서
    thresholds: ThresholdSet     # ThresholdSet 값 객체


# settings를 기반으로 artifacts/checkpoints 아래의 파일들을 읽고
# 추론에 필요한 메타데이터를 정규화하는 저장소 계층
class ArtifactRepository:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def load_inference_artifacts(self) -> InferenceArtifacts:
        checkpoint_path = self._get_checkpoint_path()
        config_snapshot_path = self._get_config_snapshot_path()
        thresholds_path = self._get_thresholds_path()

        config_data = self._read_json_file(
            config_snapshot_path,
            missing_code="CONFIG_SNAPSHOT_NOT_FOUND",
            invalid_code="CONFIG_SNAPSHOT_INVALID",
        )
        thresholds_data = self._read_json_file(
            thresholds_path,
            missing_code="THRESHOLDS_NOT_FOUND",
            invalid_code="THRESHOLDS_INVALID",
        )

        label_order = self._resolve_label_order(
            config_data=config_data,
            thresholds_data=thresholds_data,
        )
        threshold_values = self._resolve_threshold_values(
            thresholds_data=thresholds_data,
            label_order=label_order,
        )
        threshold_version = self._resolve_threshold_version(thresholds_data, thresholds_path)
        model_version = self._resolve_model_version(config_data, checkpoint_path)
        image_size = self._resolve_image_size(config_data)

        thresholds = ThresholdSet(
            version=threshold_version,
            label_order=label_order,
            values=threshold_values,
        )

        return InferenceArtifacts(
            checkpoint_path=checkpoint_path,
            config_snapshot_path=config_snapshot_path,
            thresholds_path=thresholds_path,
            model_version=model_version,
            image_size=image_size,
            label_order=label_order,
            thresholds=thresholds,
        )

    def load_label_order(self) -> tuple[str, ...]:
        return self.load_inference_artifacts().label_order

    def load_threshold_map(self) -> dict[str, float]:
        return self.load_inference_artifacts().thresholds.as_dict()

    def load_checkpoint_path(self) -> Path:
        return self.load_inference_artifacts().checkpoint_path

    def _get_checkpoint_path(self) -> Path:
        checkpoint_path = getattr(self._settings, "checkpoint_path", None)
        if checkpoint_path is None:
            checkpoint_path = self._settings.checkpoints_dir / "best.pt"

        return self._require_file(
            Path(checkpoint_path),
            code="CHECKPOINT_NOT_FOUND",
            message="Model checkpoint file was not found.",
        )

    def _get_config_snapshot_path(self) -> Path:
        config_snapshot_path = getattr(self._settings, "config_snapshot_path", None)
        if config_snapshot_path is None:
            config_snapshot_path = self._settings.checkpoints_dir / "config_snapshot.json"

        return self._require_file(
            Path(config_snapshot_path),
            code="CONFIG_SNAPSHOT_NOT_FOUND",
            message="Config snapshot file was not found.",
        )

    def _get_thresholds_path(self) -> Path:
        thresholds_path = getattr(self._settings, "thresholds_path", None)
        if thresholds_path is None:
            thresholds_path = self._settings.checkpoints_dir / "infer_thresholds.json"

        return self._require_file(
            Path(thresholds_path),
            code="THRESHOLDS_NOT_FOUND",
            message="Thresholds file was not found.",
        )

    def _read_json_file(
        self,
        path: Path,
        *,
        missing_code: str,
        invalid_code: str,
    ) -> dict[str, Any]:
        self._require_file(
            path,
            code=missing_code,
            message=f"Required artifact file was not found: {path.name}",
        )

        try:
            with path.open("r", encoding="utf-8") as fp:
                data = json.load(fp)
        except json.JSONDecodeError as exc:
            raise InternalServerError(
                code=invalid_code,
                message=f"Artifact JSON is invalid: {path.name}",
            ) from exc
        except OSError as exc:
            raise InternalServerError(
                code=invalid_code,
                message=f"Artifact file could not be read: {path.name}",
            ) from exc

        if not isinstance(data, dict):
            raise InternalServerError(
                code=invalid_code,
                message=f"Artifact JSON root must be an object: {path.name}",
            )

        return data

    def _resolve_model_version(
        self,
        config_data: dict[str, Any],
        checkpoint_path: Path,
    ) -> str:
        candidate_values = [
            config_data.get("model_version"),
            config_data.get("run_name"),
            config_data.get("run_id"),
            self._get_nested(config_data, "metadata", "run_name"),
            self._get_nested(config_data, "metadata", "run_id"),
        ]

        for value in candidate_values:
            if isinstance(value, str) and value.strip():
                return value.strip()

        return checkpoint_path.stem

    def _resolve_image_size(self, config_data: dict[str, Any]) -> int:
        candidate_values = [
            config_data.get("image_size"),
            self._get_nested(config_data, "data", "image_size"),
            self._get_nested(config_data, "model", "image_size"),
            self._get_nested(config_data, "preprocessing", "image_size"),
        ]

        for value in candidate_values:
            if isinstance(value, int) and value > 0:
                return value

        raise InternalServerError(
            code="CONFIG_IMAGE_SIZE_MISSING",
            message="Could not resolve image_size from config snapshot.",
        )

    def _resolve_label_order(
        self,
        *,
        config_data: dict[str, Any],
        thresholds_data: dict[str, Any],
    ) -> tuple[str, ...]:
        candidate_lists = [
            thresholds_data.get("label_order"),
            thresholds_data.get("labels"),
            config_data.get("label_order"),
            self._get_nested(config_data, "data", "target_labels"),
        ]

        for candidate in candidate_lists:
            normalized = self._normalize_string_list(candidate)
            if normalized:
                return normalized

        per_label = thresholds_data.get("per_label")
        if isinstance(per_label, dict):
            normalized = self._normalize_string_list(list(per_label.keys()))
            if normalized:
                return normalized

        raise InternalServerError(
            code="LABEL_ORDER_MISSING",
            message="Could not resolve label order from artifacts.",
        )

    def _resolve_threshold_values(
        self,
        *,
        thresholds_data: dict[str, Any],
        label_order: tuple[str, ...],
    ) -> tuple[float, ...]:
        thresholds_list = thresholds_data.get("thresholds")
        if isinstance(thresholds_list, list):
            values = self._normalize_float_list(thresholds_list)
            if len(values) != len(label_order):
                raise InternalServerError(
                    code="THRESHOLD_COUNT_MISMATCH",
                    message="Threshold count does not match label_order length.",
                )
            return values

        thresholds_map = thresholds_data.get("thresholds_by_label")
        if isinstance(thresholds_map, dict):
            return self._build_threshold_tuple_from_mapping(
                thresholds_map=thresholds_map,
                label_order=label_order,
            )

        per_label = thresholds_data.get("per_label")
        if isinstance(per_label, dict):
            return self._build_threshold_tuple_from_mapping(
                thresholds_map=per_label,
                label_order=label_order,
            )

        raise InternalServerError(
            code="THRESHOLDS_MISSING",
            message="Could not resolve thresholds from artifact file.",
        )

    def _resolve_threshold_version(
        self,
        thresholds_data: dict[str, Any],
        thresholds_path: Path,
    ) -> str:
        candidate_values = [
            thresholds_data.get("threshold_version"),
            thresholds_data.get("version"),
            thresholds_data.get("criterion"),
        ]

        for value in candidate_values:
            if isinstance(value, str) and value.strip():
                return value.strip()

        return thresholds_path.stem

    def _build_threshold_tuple_from_mapping(
        self,
        *,
        thresholds_map: dict[str, Any],
        label_order: tuple[str, ...],
    ) -> tuple[float, ...]:
        values: list[float] = []

        for label_name in label_order:
            raw_value = thresholds_map.get(label_name)

            if isinstance(raw_value, dict):
                raw_value = raw_value.get("threshold")

            if not isinstance(raw_value, (int, float)):
                raise InternalServerError(
                    code="THRESHOLD_VALUE_INVALID",
                    message=f"Threshold is missing or invalid for label: {label_name}",
                )

            values.append(float(raw_value))

        return tuple(values)

    def _normalize_string_list(self, value: Any) -> tuple[str, ...]:
        if not isinstance(value, list):
            return ()

        normalized: list[str] = []
        for item in value:
            if not isinstance(item, str):
                return ()
            stripped = item.strip()
            if not stripped:
                return ()
            normalized.append(stripped)

        return tuple(normalized)

    def _normalize_float_list(self, value: list[Any]) -> tuple[float, ...]:
        normalized: list[float] = []

        for item in value:
            if not isinstance(item, (int, float)):
                raise InternalServerError(
                    code="THRESHOLD_VALUE_INVALID",
                    message="Threshold list contains a non-numeric value.",
                )
            normalized.append(float(item))

        return tuple(normalized)

    def _require_file(
        self,
        path: Path,
        *,
        code: str,
        message: str,
    ) -> Path:
        if not path.exists() or not path.is_file():
            raise NotFoundError(
                code=code,
                message=message,
            )

        return path

    def _get_nested(self, data: dict[str, Any], *keys: str) -> Any:
        current: Any = data

        for key in keys:
            if not isinstance(current, dict):
                return None
            current = current.get(key)

        return current