# apps/ai-service/src/ai_service/api/routers/health.py
from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check() -> dict[str, str]:
    return {"status": "ok"}