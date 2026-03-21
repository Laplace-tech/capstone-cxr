# apps/ai-service/src/ai_service/infrastructure/settings.py
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

# 현재 파일:
# apps/ai-service/src/ai_service/infrastructure/settings.py
#
# parents 기준:
# [0] infrastructure
# [1] ai_service
# [2] src
# [3] ai-service
# [4] apps
# [5] capstone-cxr

PROJECT_ROOT = Path(__file__).resolve().parents[3] # capstone-cxr/apps/ai-service
REPO_ROOT = PROJECT_ROOT.parents[1]                # capstone-cxr


@dataclass(frozen=True, slots=True)
class Settings:
    # 서비스 메타 정보
    service_name: str
    service_version: str
    
    # 루트 경로
    project_root: Path
    repo_root: Path
    
    # 공용 런타임 디렉터리
    shared_root: Path
    shared_uploads_dir: Path
    shared_generated_dir: Path
    
    # AI 서비스 내부 배포 자산 디렉터리
    artifacts_root: Path
    checkpoints_dir: Path
    
    # 핵심 배포 자산 파일
    checkpoint_path: Path
    thresholds_path: Path
    config_snapshot_path: Path

    # 업로드 정책
    max_upload_size_mb: int
    max_upload_size_bytes: int
    allowed_image_suffixes: tuple[str, ...]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    애플리케이션 전체에서 공유할 단일 Settings 객체를 반환

    - 경로/환경변수 source of truth는 여기 하나로 몰아둠
    - 파일 존재 여부 검사는 여기서 하지 않음
    그 책임은 startup.py에 둔다
    """
    
    # 서비스 이름/버전
    service_name = _get_env_str("SERVICE_NAME", "capstone-cxr-ai-service")
    service_version = _get_env_str("SERVICE_VERSION", "0.1.0")
    
    # shared 디렉터리
    # docker-compose에서는 /shared 계열이 들어오고,
    # 로컬 실행에서는 repo 기준 경로를 기본값으로 사용한다.
    shared_root = _get_env_path(
        "SHARED_ROOT",
        default=REPO_ROOT / "shared",
        base_dir=REPO_ROOT,
    )
    
    shared_uploads_dir = _get_env_path(
        "SHARED_UPLOADS_DIR",
        default=shared_root / "uploads",
        base_dir=REPO_ROOT,
    )

    shared_generated_dir = _get_env_path(
        "SHARED_GENERATED_DIR",
        default=shared_root / "generated",
        base_dir=REPO_ROOT,
    )
    
    # AI 배포 자산 디렉터리
    # docker-compose에서는 /app/artifacts
    # 로컬에서는 apps/ai-service/artifacts
    artifacts_root = _get_env_path(
        "ARTIFACTS_ROOT",
        default=PROJECT_ROOT / "artifacts",
        base_dir=PROJECT_ROOT,
    )

    checkpoints_dir = artifacts_root / "checkpoints"
    
    # baseline 핵심 파일 경로
    checkpoint_path = checkpoints_dir / "best.pt"
    thresholds_path = checkpoints_dir / "infer_thresholds.json"
    config_snapshot_path = checkpoints_dir / "config_snapshot.json"

    # 업로드 정책
    max_upload_size_mb = _get_env_int("MAX_UPLOAD_SIZE_MB", 20, min_value=1)
    allowed_image_suffixes = _parse_allowed_image_suffixes(
        _get_env_str("ALLOWED_IMAGE_SUFFIXES", ".png,.jpg,.jpeg,.webp")
    )
    
    return Settings(
        service_name=service_name,
        service_version=service_version,
        project_root=PROJECT_ROOT,
        repo_root=REPO_ROOT,
        shared_root=shared_root,
        shared_uploads_dir=shared_uploads_dir,
        shared_generated_dir=shared_generated_dir,
        artifacts_root=artifacts_root,
        checkpoints_dir=checkpoints_dir,
        checkpoint_path=checkpoint_path,
        thresholds_path=thresholds_path,
        config_snapshot_path=config_snapshot_path,
        max_upload_size_mb=max_upload_size_mb,
        max_upload_size_bytes=max_upload_size_mb * 1024 * 1024,
        allowed_image_suffixes=allowed_image_suffixes,
    )


# 문자열 경로를 Path로 바꾸고 절대경로로 정규화한다.
def _resolve_path(raw_value: str, *, base_dir: Path) -> Path:
    path = Path(raw_value).expanduser()

    if not path.is_absolute():
        path = base_dir / path
        # raw_value = "shared/uploads"
        # base_dir = /home/anna/projects/capstone-cxr
        # 결과 = /home/anna/projects/capstone-cxr/shared/uploads

    return path.resolve() # 최종적으로 절대경로로 정규화해서 반환.



# 문자열 환경변수 읽기. env_name에 해당하는 값이 없으면 default 사용
def _get_env_str(env_name: str, default: str) -> str:
    raw_value = os.getenv(env_name)

    # 값이 없으면 기본값
    if raw_value is None:
        return default

    value = raw_value.strip()
    return value if value else default
    # 공백 제거 후 비어 있지 않으면 그 값 사용,
    # 비어 있으면 default 사용. SERVICE_NAME="   " 이런 것도 무효 처리



# 정수 환경변수를 읽기. name에 해당하는 값이 없으면 default를 사용하고 범위 체킹도 시도
def _get_env_int(name: str, default: int, *, min_value: int = 1) -> int:
    raw = os.getenv(name)
    
    if raw is None or raw.strip() == "":
        return default
    
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be int, got {raw!r}") from exc
    
    if value < min_value:
        raise ValueError(f"{name} must be >= {min_value}, got {value}")
    
    return value



# 환경변수에서 "경로"를 읽는다. env_name에 해당하는 값이 없으면 default 사용
def _get_env_path(env_name: str, *, default: Path, base_dir: Path) -> Path:
    """
    default는 이미 Path로 전달받고,
    env 값이 있으면 상대/절대를 구분해 base_dir 기준으로 정규화한다.
    """
    raw_value = os.getenv(env_name)
    # ex: os.getenv("SHARED_ROOT")

    # 환경변수가 없거나 빈 문자열이면 default 사용, 절대경로로 정리해서 반환
    if raw_value is None or raw_value.strip() == "":
        return default.resolve()

    return _resolve_path(raw_value, base_dir=base_dir)
    # 환경변수가 있으면 그 값을 경로로 해석함
    # 절대경로면 그대로 냅둠.
    # 상대경로면 base_dir 기준으로 붙여서 처리한다.


# 허용 확장자 문자열을 파싱한다
def _parse_allowed_image_suffixes(raw: str) -> tuple[str, ...]:
    
    # 소문자로 정규화
    items = [item.strip().lower() for item in raw.split(",") if item.strip()]
    
    normalized: list[str] = []
    seen: set[str] = set()

    # '.' 없으면 자동 보정
    for item in items:
        suffix = item if item.startswith(".") else f".{item}"

        # 중복 제거: set[str] (an unordered collection of unique elements)
        if suffix not in seen:
            seen.add(suffix)
            normalized.append(suffix)

    # 비어 있으면 예외
    if not normalized:
        raise ValueError("ALLOWED_IMAGE_SUFFIXES must contain at least one suffix")

    return tuple(normalized)

