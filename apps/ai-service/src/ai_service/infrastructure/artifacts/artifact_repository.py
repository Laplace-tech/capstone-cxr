# apps/ai-service/src/ai_service/infrastructure/artifacts/artifact_repository.py
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ai_service.common.exceptions import InternalServerError, NotFoundError
from ai_service.infrastructure.settings import Settings, get_settings


@dataclass(frozen=True, slots=True)
class ThresholdSet:
    """
    threshold 정보를 담는 값 객체.

    - version: threshold 기준 버전명
    - label_order: threshold 값이 대응하는 label 순서
    - values: label_order와 동일한 순서의 threshold 값
    """
    version: str
    label_order: tuple[str, ...]
    values: tuple[float, ...]

    def as_dict(self) -> dict[str, float]:
        """
        threshold 정보를 {"Atelectasis": 0.46, ...} 형태로 변환한다.
        """
        return dict(zip(self.label_order, self.values, strict=True))


@dataclass(frozen=True, slots=True)
class InferenceArtifacts:
    """
    서비스 추론에 필요한 핵심 아티팩트 묶음.
    """
    checkpoint_path: Path        # 모델 가중치 파일 경로
    config_snapshot_path: Path   # 설정 스냅샷 JSON 경로
    thresholds_path: Path        # threshold JSON 경로
    model_version: str           # 외부 응답에 포함할 모델 버전
    image_size: int              # 입력 이미지 크기
    label_order: tuple[str, ...] # 서비스 기준 label 순서
    thresholds: ThresholdSet     # threshold 값 객체


class ArtifactRepository:
    """
    settings를 기준으로 추론 아티팩트를 읽고 정규화하는 저장소 계층.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def load_inference_artifacts(self) -> InferenceArtifacts:
        """
        추론에 필요한 아티팩트를 로드하고 정규화된 값 객체로 반환한다.
        """
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
        threshold_version = self._resolve_threshold_version(
            thresholds_data,
            thresholds_path,
        )
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
        """
        추론 기준 label 순서를 반환한다.
        """
        return self.load_inference_artifacts().label_order

    def load_threshold_map(self) -> dict[str, float]:
        """
        threshold 정보를 label -> threshold dict 형태로 반환한다.
        """
        return self.load_inference_artifacts().thresholds.as_dict()

    def load_checkpoint_path(self) -> Path:
        """
        추론에 사용할 checkpoint 경로를 반환한다.
        """
        return self.load_inference_artifacts().checkpoint_path

    def _get_checkpoint_path(self) -> Path:
        """
        checkpoint 경로를 결정하고, 실제 파일 존재 여부를 검증한다.
        """
        checkpoint_path = getattr(self._settings, "checkpoint_path", None)
        if checkpoint_path is None:
            checkpoint_path = self._settings.checkpoints_dir / "best.pt"

        return self._require_file(
            Path(checkpoint_path),
            code="CHECKPOINT_NOT_FOUND",
            message="Model checkpoint file was not found.",
        )

    def _get_config_snapshot_path(self) -> Path:
        """
        config snapshot 경로를 결정하고, 실제 파일 존재 여부를 검증한다.
        """
        config_snapshot_path = getattr(self._settings, "config_snapshot_path", None)
        if config_snapshot_path is None:
            config_snapshot_path = self._settings.checkpoints_dir / "config_snapshot.json"

        return self._require_file(
            Path(config_snapshot_path),
            code="CONFIG_SNAPSHOT_NOT_FOUND",
            message="Config snapshot file was not found.",
        )

    def _get_thresholds_path(self) -> Path:
        """
        thresholds 파일 경로를 결정하고, 실제 파일 존재 여부를 검증한다.
        """
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
        """
        JSON 파일을 읽고, 최상위가 dict인지 검증한다.
        """
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
        """
        config snapshot 또는 checkpoint 이름에서 모델 버전을 추론한다.
        """
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
        """
        config snapshot에서 image_size를 추론한다.
        """
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
        """
        thresholds 또는 config snapshot에서 label 순서를 추론한다.
        """
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
        """
        threshold 값을 label_order 기준 tuple 형태로 정규화한다.
        """
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
        """
        thresholds JSON 또는 파일명에서 threshold 버전을 추론한다.
        """
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
        """
        label 기반 mapping을 label_order 기준 tuple로 변환한다.
        """
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
        """
        문자열 리스트를 검증하고 tuple[str, ...]로 정규화한다.
        """
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
        """
        숫자 리스트를 tuple[float, ...]로 정규화한다.
        """
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
        """
        파일 존재 여부를 검증하고, 유효하면 경로를 반환한다.
        """
        if not path.exists() or not path.is_file():
            raise NotFoundError(
                code=code,
                message=message,
            )

        return path

    def _get_nested(self, data: dict[str, Any], *keys: str) -> Any:
        """
        중첩 dict에서 안전하게 값을 꺼낸다.
        """
        current: Any = data

        for key in keys:
            if not isinstance(current, dict):
                return None
            current = current.get(key)

        return current