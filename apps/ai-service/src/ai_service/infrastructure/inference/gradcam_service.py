# apps/ai-service/src/ai_service/infrastructure/inference/gradcam_service.py
from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image, UnidentifiedImageError

from ai_service.common.exceptions import InternalServerError, NotFoundError
from ai_service.infrastructure.settings import Settings, get_settings


_GRADCAM_OUTPUT_FILENAME = "gradcam_overlay.png"
_GRADCAM_OVERLAY_ALPHA = 0.45


def generate_gradcam_overlay(
    *,
    analysis_id: str,
    image_path: str | Path,
    image_tensor: torch.Tensor,
    model: nn.Module,
    target_label_index: int,
    settings: Settings | None = None,
) -> str:
    """
    실제 Grad-CAM overlay를 생성하고,
    shared/generated 기준 상대경로를 반환한다.
    """
    cfg = settings or get_settings()
    resolved_image_path = _resolve_input_image_path(image_path)
    original_image = _load_original_rgb_image(resolved_image_path)

    activations: list[torch.Tensor] = []
    gradients: list[torch.Tensor] = []

    # [FIX] PyTorch Autograd 충돌 방지: 모델 내부의 모든 inplace 연산을 비활성화
    for module in model.modules():
        if hasattr(module, 'inplace'):
            module.inplace = False

    target_layer = _resolve_target_layer(model)
    handles = _register_gradcam_hooks(
        target_layer=target_layer,
        activations=activations,
        gradients=gradients,
    )

    try:
        model.zero_grad(set_to_none=True)
        logits = model(image_tensor)
        target_score = _resolve_target_score(
            logits=logits,
            target_label_index=target_label_index,
        )
        target_score.backward()

        heatmap = _build_gradcam_heatmap(
            activations=activations,
            gradients=gradients,
            target_height=original_image.height,
            target_width=original_image.width,
        )

        overlay_image = _build_overlay_image(
            original_image=original_image,
            heatmap=heatmap,
        )

        relative_output_path = Path("analyses") / analysis_id / _GRADCAM_OUTPUT_FILENAME
        absolute_output_path = cfg.shared_generated_dir / relative_output_path
        absolute_output_path.parent.mkdir(parents=True, exist_ok=True)
        overlay_image.save(absolute_output_path)

        return relative_output_path.as_posix()
    finally:
        for handle in handles:
            handle.remove()
        model.zero_grad(set_to_none=True)


def _resolve_input_image_path(image_path: str | Path) -> Path:
    path = Path(image_path)

    if not path.exists() or not path.is_file():
        raise NotFoundError(
            code="INPUT_IMAGE_NOT_FOUND",
            message=f"Input image not found: {path}",
        )

    return path


def _load_original_rgb_image(image_path: Path) -> Image.Image:
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

def _resolve_target_layer(model: nn.Module) -> nn.Module:
    if hasattr(model, "features") and hasattr(model.features, "denseblock4"):
        return model.features.denseblock4

    if hasattr(model, "features"):
        return model.features

    raise InternalServerError(
        code="GRADCAM_TARGET_LAYER_NOT_FOUND",
        message="Could not resolve Grad-CAM target layer from model.",
    )


def _register_gradcam_hooks(
    *,
    target_layer: nn.Module,
    activations: list[torch.Tensor],
    gradients: list[torch.Tensor],
) -> tuple[torch.utils.hooks.RemovableHandle, torch.utils.hooks.RemovableHandle]:
    def forward_hook(_: nn.Module, __: tuple[torch.Tensor, ...], output: torch.Tensor) -> None:
        activations.clear()
        activations.append(output.clone().detach())

    def backward_hook(
        _: nn.Module,
        __: tuple[torch.Tensor | None, ...],
        grad_output: tuple[torch.Tensor | None, ...],
    ) -> None:
        gradients.clear()
        first_grad = grad_output[0]
        if first_grad is not None:
            gradients.append(first_grad.clone().detach())

    forward_handle = target_layer.register_forward_hook(forward_hook)
    backward_handle = target_layer.register_full_backward_hook(backward_hook)

    return forward_handle, backward_handle

def _resolve_target_score(
    *,
    logits: torch.Tensor,
    target_label_index: int,
) -> torch.Tensor:
    if not isinstance(logits, torch.Tensor):
        raise InternalServerError(
            code="LOGITS_INVALID",
            message="Model output logits must be a torch.Tensor.",
        )

    if logits.ndim == 1:
        logits = logits.unsqueeze(0)

    if logits.ndim != 2 or logits.shape[0] != 1:
        raise InternalServerError(
            code="LOGITS_SHAPE_INVALID",
            message="Grad-CAM expects model logits with shape [1, num_labels].",
        )

    if not (0 <= target_label_index < logits.shape[1]):
        raise InternalServerError(
            code="GRADCAM_TARGET_INDEX_INVALID",
            message="Target label index is out of range for logits.",
        )

    return logits[0, target_label_index]


def _build_gradcam_heatmap(
    *,
    activations: list[torch.Tensor],
    gradients: list[torch.Tensor],
    target_height: int,
    target_width: int,
) -> np.ndarray:
    if not activations or not gradients:
        raise InternalServerError(
            code="GRADCAM_HOOK_DATA_MISSING",
            message="Grad-CAM hook data is missing.",
        )

    activation = activations[0]
    gradient = gradients[0]

    if activation.ndim != 4 or gradient.ndim != 4:
        raise InternalServerError(
            code="GRADCAM_HOOK_SHAPE_INVALID",
            message="Grad-CAM activation/gradient tensors must be 4D.",
        )

    weights = gradient.mean(dim=(2, 3), keepdim=True)
    cam = (weights * activation).sum(dim=1, keepdim=True)
    cam = F.relu(cam)

    cam = F.interpolate(
        cam,
        size=(target_height, target_width),
        mode="bilinear",
        align_corners=False,
    )

    cam = cam.squeeze().detach().float().cpu().numpy()

    cam_min = float(cam.min())
    cam_max = float(cam.max())

    if cam_max <= cam_min:
        return np.zeros((target_height, target_width), dtype=np.float32)

    normalized_cam = (cam - cam_min) / (cam_max - cam_min)
    return normalized_cam.astype(np.float32)


def _build_overlay_image(
    *,
    original_image: Image.Image,
    heatmap: np.ndarray,
) -> Image.Image:
    original_np = np.asarray(original_image).astype(np.float32) / 255.0
    heatmap_rgb = _apply_simple_colormap(heatmap)

    alpha_mask = (heatmap[..., None] * _GRADCAM_OVERLAY_ALPHA).astype(np.float32)
    overlay_np = original_np * (1.0 - alpha_mask) + heatmap_rgb * alpha_mask
    overlay_np = np.clip(overlay_np * 255.0, 0.0, 255.0).astype(np.uint8)

    return Image.fromarray(overlay_np)


def _apply_simple_colormap(heatmap: np.ndarray) -> np.ndarray:
    """
    matplotlib 없이 간단한 warm colormap을 만든다.
    """
    red = np.clip(1.5 * heatmap, 0.0, 1.0)
    green = np.clip(1.5 * heatmap - 0.5, 0.0, 1.0)
    blue = np.clip(1.5 * heatmap - 1.0, 0.0, 1.0)

    return np.stack([red, green, blue], axis=-1).astype(np.float32)