# apps/ai-service/tests/test_predict_contract.py
from __future__ import annotations

from PIL import Image
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ai_service.api.main import app
from ai_service.infrastructure.settings import get_settings


# run: PYTHONPATH=src pytest -q tests/test_predict_contract.py

# 각 테스트 전/후에 캐시를 비워서 테스트가 서로 독립적으로 돌게 만든다
@pytest.fixture(autouse=True)
def clear_settings_cache() -> None:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()



# pytest의 임시 디렉터리(tmp_path) 아래에 테스트용 shared / artifacts 폴더 생성
# 매 테스트마다 깨끗한 가짜 환경을 구성하는 용도
@pytest.fixture()
def shared_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> dict[str, Path]:
    shared_root = tmp_path / "shared"
    shared_uploads_dir = shared_root / "uploads"
    shared_generated_dir = shared_root / "generated"

    shared_uploads_dir.mkdir(parents=True, exist_ok=True)
    shared_generated_dir.mkdir(parents=True, exist_ok=True)

    # monkeypatch.setenv(...) 로 환경변수를 테스트용 값으로 덮어쓴다.
    #
    # ai-service 내부 settings가 이 환경변수를 읽어
    # shared/uploads, shared/generated, artifacts 경로를 결정할 것이다.
    monkeypatch.setenv("SHARED_ROOT", str(shared_root))
    monkeypatch.setenv("SHARED_UPLOADS_DIR", str(shared_uploads_dir))
    monkeypatch.setenv("SHARED_GENERATED_DIR", str(shared_generated_dir))
    monkeypatch.setenv("MAX_UPLOAD_SIZE_MB", "20")
    monkeypatch.setenv("ALLOWED_IMAGE_SUFFIXES", ".png,.jpg,.jpeg,.webp")

    # 테스트 본문에서 바로 꺼내 쓰기 편하게 dict로 반환
    return {
        "shared_root": shared_root,
        "shared_uploads_dir": shared_uploads_dir,
        "shared_generated_dir": shared_generated_dir,
    }


# FastAPI 앱에 대한 테스트용 HTTP 클라이언트
# - 이 client가 실행되기 전에 환경변수/디렉터리 세팅이 먼저 끝나게 하기 위해
#   shared_env를 의존하게 만든다.
@pytest.fixture()
def client(shared_env: dict[str, Path]) -> TestClient:
    return TestClient(app)


# 성공 케이스 테스트
#
# 1) shared/uploads 아래에 가짜 이미지 파일 생성
# 2) /predict 호출
# 3) 200 응답 + success payload + gradcam overlay 생성까지 확인
def test_predict_success_with_gradcam(
    client: TestClient,
    shared_env: dict[str, Path],
) -> None:
    image_path = shared_env["shared_uploads_dir"] / "analyses" / "uuid-123" / "input.jpg"
    image_path.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", (512, 512), color=(255, 255, 255)).save(image_path)
    
    response = client.post(
        "/predict",
        json={
            "analysis_id": "uuid-123",
            "image_path": "analyses/uuid-123/input.jpg",
            "include_gradcam": True,
        },
    )

    # HTTP status 코드가 200이어야 함
    assert response.status_code == 200

    # 응답 계약 검증
    # analysis_id / status / model_version / threshold_version / image_size
    # label_order / labels / gradcam 구조가 기대값과 맞는지 확인
    payload = response.json()
    assert payload["analysis_id"] == "uuid-123"
    assert payload["status"] == "success"
    
    assert isinstance(payload["model_version"], str)
    assert payload["model_version"] != ""
    
    assert isinstance(payload["threshold_version"], str)
    assert payload["threshold_version"] != ""
    
    assert payload["image_size"] == 320
    assert payload["label_order"] == [
        "Atelectasis",
        "Cardiomegaly",
        "Consolidation",
        "Edema",
        "Pleural Effusion",
    ]
    assert len(payload["labels"]) == 5
    assert payload["gradcam"]["available"] is True
    assert payload["gradcam"]["overlay_path"] == "analyses/uuid-123/gradcam_overlay.png"

    # 응답에 경로만 있는 게 아니라
    # 실제로 shared/generated 아래에 overlay 파일이 생성됐는지도 확인
    overlay_file = shared_env["shared_generated_dir"] / payload["gradcam"]["overlay_path"]
    assert overlay_file.exists()



def test_predict_returns_404_when_image_is_missing(
    client: TestClient,
) -> None:
    # 실패 케이스 1: 입력 이미지가 아예 없음
    #
    # 기대:
    # - 404
    # - analysis_id 유지
    # - status == failed
    # - error.code == INPUT_IMAGE_NOT_FOUND
    response = client.post(
        "/predict",
        json={
            "analysis_id": "uuid-404",
            "image_path": "analyses/uuid-404/missing.jpg",
            "include_gradcam": False,
        },
    )

    assert response.status_code == 404

    payload = response.json()
    assert payload["analysis_id"] == "uuid-404"
    assert payload["status"] == "failed"
    assert payload["error"]["code"] == "INPUT_IMAGE_NOT_FOUND"


def test_predict_rejects_invalid_suffix(
    client: TestClient,
    shared_env: dict[str, Path],
) -> None:
    # 실패 케이스 2: 파일은 존재하지만 확장자가 허용되지 않음
    #
    # 여기서는 input.txt 를 만들어서
    # suffix 검증 로직이 제대로 동작하는지 본다.
    image_path = shared_env["shared_uploads_dir"] / "analyses" / "uuid-bad" / "input.txt"
    image_path.parent.mkdir(parents=True, exist_ok=True)
    image_path.write_bytes(b"not-an-image")

    response = client.post(
        "/predict",
        json={
            "analysis_id": "uuid-bad",
            "image_path": "analyses/uuid-bad/input.txt",
            "include_gradcam": False,
        },
    )

    assert response.status_code == 400

    payload = response.json()
    assert payload["analysis_id"] == "uuid-bad"
    assert payload["status"] == "failed"
    assert payload["error"]["code"] == "INVALID_IMAGE_FILE"


def test_predict_rejects_absolute_path(client: TestClient) -> None:
    # 실패 케이스 3: 절대경로 금지
    #
    # /predict 계약상 image_path는 반드시
    # shared/uploads 기준 "상대경로" 여야 한다.
    #
    # 그래서 /tmp/input.jpg 같은 절대경로는 400으로 막아야 한다.
    response = client.post(
        "/predict",
        json={
            "analysis_id": "uuid-abs",
            "image_path": "/tmp/input.jpg",
            "include_gradcam": False,
        },
    )

    assert response.status_code == 400

    payload = response.json()
    assert payload["analysis_id"] == "uuid-abs"
    assert payload["status"] == "failed"
    assert payload["error"]["code"] == "INVALID_IMAGE_PATH"


def test_predict_returns_422_for_invalid_request_body(client: TestClient) -> None:
    # 실패 케이스 4: 요청 body 자체가 스키마를 만족하지 않음
    #
    # 여기서는 image_path가 빠져 있으므로
    # FastAPI/Pydantic 요청 검증에서 422가 나와야 한다.
    response = client.post(
        "/predict",
        json={
            "analysis_id": "uuid-422",
        },
    )

    assert response.status_code == 422

    payload = response.json()
    assert payload["analysis_id"] == "uuid-422"
    assert payload["status"] == "failed"
    assert payload["error"]["code"] == "REQUEST_VALIDATION_ERROR"