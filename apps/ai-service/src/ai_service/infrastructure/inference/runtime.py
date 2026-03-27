# apps/ai-service/src/ai_service/infrastructure/inference/runtime.py
from __future__ import annotations

from dataclasses import dataclass

import torch
import torch.nn as nn

from ai_service.infrastructure.artifacts.artifact_repository import (
    ArtifactRepository,
    InferenceArtifacts,
)
from ai_service.infrastructure.inference.checkpoint_loader import (
    load_model_from_checkpoint,
    resolve_runtime_device,
)
from ai_service.infrastructure.settings import Settings, get_settings


@dataclass(slots=True)
class InferenceRuntime:
    settings: Settings
    artifact_repository: ArtifactRepository
    artifacts: InferenceArtifacts
    device: torch.device
    model: nn.Module


_runtime_cache: InferenceRuntime | None = None


def get_inference_runtime(
    *,
    settings: Settings | None = None,
) -> InferenceRuntime:
    global _runtime_cache

    if _runtime_cache is not None:
        return _runtime_cache

    cfg = settings or get_settings()
    artifact_repository = ArtifactRepository(settings=cfg)
    artifacts = artifact_repository.load_inference_artifacts()

    device = resolve_runtime_device()
    model = load_model_from_checkpoint(
        checkpoint_path=artifacts.checkpoint_path,
        num_classes=len(artifacts.label_order),
        device=device,
    )

    _runtime_cache = InferenceRuntime(
        settings=cfg,
        artifact_repository=artifact_repository,
        artifacts=artifacts,
        device=device,
        model=model,
    )
    return _runtime_cache


def clear_inference_runtime_cache() -> None:
    global _runtime_cache
    _runtime_cache = None