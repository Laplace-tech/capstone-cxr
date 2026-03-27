# apps/ai-service/src/ai_service/infrastructure/inference/preprocessing.py
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import torch
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

from ai_service.common.exceptions import InternalServerError, NotFoundError


@dataclass(frozen=True, slots=True)
class PreprocessedImage:
    image_tensor: torch.Tensor
    original_width: int
    original_height: int


def preprocess_image_for_inference(
    *,
    image_path: str | Path,
    image_size: int,
    device: torch.device,
) -> PreprocessedImage:
    resolved_image_path = _resolve_image_path(image_path)
    image = _load_rgb_image(resolved_image_path)
    image_tensor = _build_inference_transform(image_size)(image).unsqueeze(0).to(device)

    return PreprocessedImage(
        image_tensor=image_tensor,
        original_width=image.width,
        original_height=image.height,
    )


def _resolve_image_path(image_path: str | Path) -> Path:
    path = Path(image_path)

    if not path.exists() or not path.is_file():
        raise NotFoundError(
            code="INPUT_IMAGE_NOT_FOUND",
            message=f"Input image not found: {path}",
        )

    return path


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


def _build_inference_transform(image_size: int) -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=(0.485, 0.456, 0.406),
                std=(0.229, 0.224, 0.225),
            ),
        ]
    )