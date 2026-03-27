# apps/ai-service/src/ai_service/domain/constants/labels.py
from __future__ import annotations

from typing import Final

# 서비스에서 사용하는 공식 5개 질환 label 순서
# 이 순서는 threshold 파일, 모델 출력 인덱스, 응답 직렬화의 기준이 됨
CHEXPERT_LABELS: Final[tuple[str, ...]] = (
    "Atelectasis",
    "Cardiomegaly",
    "Consolidation",
    "Edema",
    "Pleural Effusion",
)

LABEL_COUNT: Final[int] = len(CHEXPERT_LABELS)
LABEL_TO_INDEX: Final[dict[str, int]] = {
    label: index for index, label in enumerate(CHEXPERT_LABELS)
}