# apps/ai-service/src/ai_service/infrastructure/inference/runtime.py
from __future__ import annotations

import logging
from dataclasses import dataclass
from threading import Lock

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


logger = logging.getLogger(__name__)



@dataclass(frozen=True, slots=True)
class InferenceRuntime:
    """
    추론 실행에 필요한 객체를 하나로 묶은 런타임 컨테이너

    - settings: 현재 서비스 설정
    - artifact_repository: 추론 아티팩트 접근 객체
    - artifacts: 로드된 추론 메타데이터
    - device: 추론 디바이스(cpu / cuda)
    - model: 추론에 사용하는 PyTorch 모델
    """
    settings: Settings
    artifact_repository: ArtifactRepository
    artifacts: InferenceArtifacts
    device: torch.device
    model: nn.Module


# 프로세스 단위 단일 runtime 캐시.
# 한 번 초기화된 이후에는 같은 프로세스 내에서 재사용한다.
# 현재 구조상 settings가 달라도 최초 생성된 runtime이 우선된다.
_runtime_cache: InferenceRuntime | None = None
_runtime_lock = Lock()



def get_inference_runtime(
    *,
    settings: Settings | None = None,
) -> InferenceRuntime:
    """
    추론 runtime을 반환한다.

    동작 방식
    - 캐시가 있으면 그대로 재사용한다.
    - 캐시가 없으면 최초 1회만 runtime을 생성한다.
    - 동시 초기화 경쟁을 막기 위해 lock을 사용한다.
    """
    global _runtime_cache
    
    # 이미 초기화된 runtime이 있으면 즉시 반환
    if _runtime_cache is not None:
        return _runtime_cache
    
    with _runtime_lock:
        # lock 대기 중 다른 쓰레드가 이미 초기화했을 수 있으므로 다시 확인
        if _runtime_cache is not None:
            return _runtime_cache
    
        # 호출자가 settings를 주입하지 않았다면 기본 설정(get_settings)을 사용
        cfg = settings or get_settings()
        logger.info("Initializing inference runtime...")

        # 실제 추론 runtime을 생성하고 캐시에 저장
        runtime = _build_inference_runtime(settings=cfg)
        _runtime_cache = runtime

        logger.info(
            "Inference runtime ready. device=%s checkpoint=%s labels=%d",
            runtime.device,
            runtime.artifacts.checkpoint_path,
            len(runtime.artifacts.label_order),
        )
        return runtime


def _build_inference_runtime(*, settings: Settings) -> InferenceRuntime:
    """
    추론에 필요한 실제 runtime 객체를 생성한다.

    생성 단계
    1) 아티팩트 로드
    2) 실행 디바이스 결정
    3) 체크포인트에서 모델 로드
    4) InferenceRuntime 조립
    """
    
    # 추론에 필요한 아티팩트를 로드
    # Ex: checkpoint 경로, threshold 정보, label order, image size
    artifact_repository = ArtifactRepository(settings=settings)
    artifacts = artifact_repository.load_inference_artifacts()

    # CUDA 사용 가능 시 GPU, 아니면 CPU를 사용
    device = resolve_runtime_device()
    
    # 체크포인트로부터 실제 추론 모델을 로드
    model = load_model_from_checkpoint(
        checkpoint_path=artifacts.checkpoint_path,   # checkpoint_path : 어떤 .pt 파일을 로드할지 명시
        num_classes=len(artifacts.label_order),
        device=device,
    )

    # 최종 runtime 객체를 반환
    return InferenceRuntime(
        settings=settings,
        artifact_repository=artifact_repository,
        artifacts=artifacts,
        device=device,
        model=model,
    )



# 캐시된 runtime 참조를 제거
def clear_inference_runtime_cache() -> None:
    global _runtime_cache
    _runtime_cache = None