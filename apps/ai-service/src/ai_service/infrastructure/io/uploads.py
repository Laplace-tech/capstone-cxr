# apps/ai-service/src/ai_service/infrastructure/io/uploads.py
from __future__ import annotations

import re
from pathlib import Path

from ai_service.common.exceptions import NotFoundError, ValidationError
from ai_service.infrastructure.settings import Settings, get_settings


# 허용할 상대경로 문자 패턴
_ALLOWED_RELATIVE_PATH_PATTERN = re.compile(r"^[A-Za-z0-9._/\-]+$")


def resolve_upload_image_path(
    image_path: str,
    *,
    settings: Settings | None = None,
) -> Path:
    """
    backend가 보낸 shared/uploads 기준 상대경로를 절대경로로 변환한다.

    허용 예:
        analyses/uuid-123/input.jpg

    이 함수의 책임:
    - "문자열 경로"를 받아
    - shared/uploads 내부의 "절대경로"로 안전하게 변환
    - 아직 파일 존재/확장자/크기까지는 검증하지 않음
    """
    cfg = settings or get_settings()

    # 앞뒤 공백 제거
    normalized = image_path.strip()

    # 빈 문자열 금지
    if not normalized:
        raise ValidationError(
            code="INVALID_IMAGE_PATH",
            message="image_path must not be empty.",
        )

    raw_path = Path(normalized)

    # 절대경로 금지
    if raw_path.is_absolute():
        raise ValidationError(
            code="INVALID_IMAGE_PATH",
            message="image_path must be relative to shared/uploads, not an absolute path.",
        )

    # 허용 문자 외의 문자가 섞이면 차단
    if not _ALLOWED_RELATIVE_PATH_PATTERN.fullmatch(normalized):
        raise ValidationError(
            code="INVALID_IMAGE_PATH",
            message="image_path contains invalid characters.",
        )

    # shared/uploads 기준으로 절대경로 생성 후 resolve()
    resolved_path = (cfg.shared_uploads_dir / raw_path).resolve()
    uploads_root = cfg.shared_uploads_dir.resolve()

    # 최종 경로가 정말 shared/uploads 내부인지 확인
    # 예:
    #   image_path = ../../etc/passwd
    # 같은 우회 입력이 들어오면 relative_to에서 ValueError 발생
    try:
        resolved_path.relative_to(uploads_root)
    except ValueError as exc:
        raise ValidationError(
            code="INVALID_IMAGE_PATH",
            message="image_path must stay within shared/uploads.",
        ) from exc

    # 여기까지 통과하면 "안전한 절대경로"는 확보한 셈
    return resolved_path


def validate_upload_image_file(
    image_file_path: Path,
    *,
    settings: Settings | None = None,
) -> None:
    """
    업로드된 입력 이미지 파일이 실제 추론 가능한 최소 조건을 만족하는지 검증

    이 함수의 책임:
    - 파일이 실제 존재하는가
    - 파일인가 (디렉터리 아님)
    - 확장자가 허용되는가
    - 파일 크기가 0보다 큰가
    - 파일 크기가 최대 업로드 크기를 넘지 않는가

    즉, resolve_upload_image_path()가 "경로 보안" 담당이라면
    validate_upload_image_file()은 "실제 입력 파일 유효성" 담당
    """
    cfg = settings or get_settings()

    # 파일이 없으면 404
    if not image_file_path.exists():
        raise NotFoundError(
            code="INPUT_IMAGE_NOT_FOUND",
            message=f"Input image not found: {image_file_path.name}",
        )

    # 존재는 하지만 일반 파일이 아니면 거부
    if not image_file_path.is_file():
        raise ValidationError(
            code="INVALID_IMAGE_FILE",
            message="Resolved image_path is not a file.",
        )

    # 확장자 검사
    suffix = image_file_path.suffix.lower()
    if suffix not in cfg.allowed_image_suffixes:
        raise ValidationError(
            code="INVALID_IMAGE_FILE",
            message=f"Invalid image suffix: {suffix}. Allowed: {cfg.allowed_image_suffixes}",
        )

    # 빈 파일 차단
    file_size = image_file_path.stat().st_size
    if file_size <= 0:
        raise ValidationError(
            code="INVALID_IMAGE_FILE",
            message="Input image file is empty.",
        )

    # 업로드 허용 최대 크기 검사
    max_upload_size_bytes = _get_max_upload_size_bytes(cfg)
    if file_size > max_upload_size_bytes:
        raise ValidationError(
            code="INVALID_IMAGE_FILE",
            message=f"Input image exceeds max size: {file_size} > {max_upload_size_bytes}",
        )


def _get_max_upload_size_bytes(settings: Settings) -> int:
    """
    설정 객체에서 최대 업로드 크기를 byte 단위로 가져온다.
    """
    if hasattr(settings, "max_upload_size_bytes"):
        return int(settings.max_upload_size_bytes)

    if hasattr(settings, "max_upload_size_mb"):
        return int(settings.max_upload_size_mb) * 1024 * 1024

    # 둘 다 없으면 settings 계약이 깨진 상태
    raise RuntimeError(
        "Settings must define max_upload_size_bytes or max_upload_size_mb."
    )
    
    
