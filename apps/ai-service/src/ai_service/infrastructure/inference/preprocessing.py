# apps/ai-service/src/ai_service/infrastructure/inference/preprocessing.py

# preprocessing.py는 입력 이미지 파일을 열어서 RGB 3채널로 이미지를 맞추고,
# 모델 입력 크기로 resize하고, tensor 및 normalize를 적용한 뒤, 
# batch 차원과 device 이동까지 끝낸 PreprocessedImage를 반환하는 모듈

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import torch
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

from ai_service.common.exceptions import InternalServerError, NotFoundError


@dataclass(frozen=True, slots=True)
class PreprocessedImage:
    """
    전처리 결과 묶음

    - image_tensor: 모델 입력으로 바로 사용할 tensor [1, C, H, W]
    - original_width: 원본 이미지 가로 길이
    - original_height: 원본 이미지 세로 길이
    """
    image_tensor: torch.Tensor
    original_width: int
    original_height: int


# 입력 이미지 파일을 모델 추론용 tensor로 변환
def preprocess_image_for_inference(
    *,
    image_path: str | Path,
    image_size: int,
    device: torch.device,
) -> PreprocessedImage:
    
    if image_size <= 0:
        raise InternalServerError(
            code="INVALID_IMAGE_SIZE",
            message="image_size must be a positive integer.",
        )

    # 경로가 실제 파일인지 확인
    resolved_image_path = _resolve_image_path(image_path)
    
    # 이미지를 열고 RGB로 변환
    image = _load_rgb_image(resolved_image_path)

    # - 정사각형 resize / tensor 변환 / ImageNet (mean, std) 정규화
    # - batch 차원 추가
    # - 지정된 device(cpu/cuda)로 이동
    image_tensor = (
        _build_inference_transform(image_size)(image)
        .unsqueeze(0)  # [C, H, W] -> [1, C, H, W]
        .to(device)
    )

    return PreprocessedImage(
        image_tensor=image_tensor,
        original_width=image.width,
        original_height=image.height,
    )




# 이미지 경로가 실제 존재하는 일반 파일인지 확인
def _resolve_image_path(image_path: str | Path) -> Path:
    path = Path(image_path)

    if not path.exists() or not path.is_file():
        raise NotFoundError(
            code="INPUT_IMAGE_NOT_FOUND",
            message=f"Input image not found: {path}",
        )

    return path


# 이미지 파일을 열고 RGB 3채널 이미지로 변환
def _load_rgb_image(image_path: Path) -> Image.Image:
    try:
        with Image.open(image_path) as image:
            return image.convert("RGB")
        
    except UnidentifiedImageError as exc:
        raise InternalServerError(
            code="IMAGE_DECODE_FAILED",
            message=f"Failed to decode image file: {image_path.name}",
        ) from exc
    except OSError as exc:
        raise InternalServerError(
            code="IMAGE_READ_FAILED",
            message=f"Failed to read image file: {image_path.name}",
        ) from exc


# 서비스 기준 추론용 transform을 구성
def _build_inference_transform(image_size: int) -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)), # 정사각형 resize
            transforms.ToTensor(),                       # tensor 변환
            transforms.Normalize(                        # ImageNet mean/std 정규화
                mean=(0.485, 0.456, 0.406),
                std=(0.229, 0.224, 0.225),
            ),
        ]
    )