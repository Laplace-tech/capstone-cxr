# apps/ai-service/src/ai_service/api/routers/predict.py
from fastapi import APIRouter

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("")
def predict_placeholder() -> dict[str, str]:
    return {"message": "predict endpoint placeholder"}