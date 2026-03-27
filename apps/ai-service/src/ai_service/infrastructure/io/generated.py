# apps/ai-service/src/ai_service/infrastructure/io/generated.py
from __future__ import annotations

import base64
from pathlib import Path

from ai_service.infrastructure.settings import Settings, get_settings


# 1x1 투명 PNG 바이트
# mock 단계에서는 "진짜 Grad-CAM 이미지 생성" 대신
# 최소한의 placeholder 파일만 만들어도 전체 E2E 흐름 검증이 가능하다.
_ONE_PIXEL_TRANSPARENT_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlH0n0AAAAASUVORK5CYII="
)


def write_mock_gradcam_overlay(
    analysis_id: str,
    *,
    settings: Settings | None = None,
) -> str:
    """
    mock Grad-CAM 오버레이 파일을 shared/generated 아래에 생성하고,
    shared/generated 기준 상대경로를 반환한다.

    예:
        analyses/{analysis_id}/gradcam_overlay.png

    - 서비스 내부 절대경로를 외부에 직접 노출하지 않기 위해서 상대경로로 반환
    - backend / frontend는 shared/generated 기준 상대경로만 알아도 충분
    """
    
    cfg = settings or get_settings()

    # 생성 규칙:
    # shared/generated/analyses/{analysis_id}/gradcam_overlay.png
    #
    # relative_path는 외부 응답용/저장용 기준 경로
    # absolute_path는 실제 파일 시스템에 쓰는 경로
    relative_path = Path("analyses") / analysis_id / "gradcam_overlay.png"
    absolute_path = cfg.shared_generated_dir / relative_path

    absolute_path.parent.mkdir(parents=True, exist_ok=True)

    # 이미 파일이 있으면 덮어쓰지 않는다.
    # 지금 mock 단계에서는 같은 analysis_id에 대해 재호출되어도
    # 기존 placeholder를 재사용해도 충분하다는 판단이다.
    if not absolute_path.exists():
        absolute_path.write_bytes(_ONE_PIXEL_TRANSPARENT_PNG)

    # API 응답에는 shared/generated 기준 상대경로만 반환
    return relative_path.as_posix()