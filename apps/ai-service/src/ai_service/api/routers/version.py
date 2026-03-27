# apps/ai-service/src/ai_service/api/routers/version.py
from fastapi import APIRouter

from ai_service.infrastructure import settings
from ai_service.infrastructure.settings import get_settings

router = APIRouter(prefix="/version", tags=["version"])


@router.get("")
def get_version() -> dict[str, str]:
    settings = get_settings()
    return {
        "service_name": settings.service_name,
        "service_version": settings.service_version,
    }