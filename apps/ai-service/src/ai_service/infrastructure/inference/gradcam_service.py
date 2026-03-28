# apps/ai-service/src/ai_service/infrastructure/inference/gradcam_service.py
from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image, UnidentifiedImageError
from matplotlib import colormaps

from ai_service.common.exceptions import InternalServerError, NotFoundError
from ai_service.infrastructure.settings import Settings, get_settings

_GRADCAM_OUTPUT_FILENAME = "gradcam_overlay.png"
_GRADCAM_OVERLAY_ALPHA = 0.65
_TURBO_COLORMAP_NAME = "turbo"

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

    처리 순서:
    1) 입력 원본 이미지 로드
    2) Grad-CAM 대상 layer 선택
    3) hook 등록
    4) forward / backward 수행
    5) heatmap 생성
    6) 원본 이미지 위에 overlay 생성
    7) shared/generated 아래에 PNG 저장
    """
    cfg = settings or get_settings()
    resolved_image_path = _resolve_input_image_path(image_path)
    original_image = _load_original_rgb_image(resolved_image_path)

    activations: list[torch.Tensor] = []
    gradients: list[torch.Tensor] = []

    # Grad-CAM backward/hook 계산 중 autograd 충돌을 줄이기 위해
    # inplace 연산을 사용하는 모듈의 inplace 옵션을 비활성화한다.
    #
    # 주의:
    # - 현재 구현은 모델 객체를 직접 수정한다.
    # - 서비스 프로세스 생애주기 동안 이 변경은 유지된다.
    _disable_inplace_ops(model)

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

        return _save_overlay_image(
            analysis_id=analysis_id,
            overlay_image=overlay_image,
            settings=cfg,
        )
    finally:
        _remove_hooks(handles)
        model.zero_grad(set_to_none=True)


def _resolve_input_image_path(image_path: str | Path) -> Path:
    """
    입력 이미지 경로가 실제 존재하는 일반 파일인지 확인한다.
    """
    path = Path(image_path)

    if not path.exists() or not path.is_file():
        raise NotFoundError(
            code="INPUT_IMAGE_NOT_FOUND",
            message=f"Input image not found: {path}",
        )

    return path


def _load_original_rgb_image(image_path: Path) -> Image.Image:
    """
    원본 이미지를 열고 RGB 3채널 이미지로 변환한다.
    """
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


def _disable_inplace_ops(model: nn.Module) -> None:
    """
    Grad-CAM 계산 시 hook/autograd 충돌을 줄이기 위해
    모델 내부의 inplace 연산 옵션을 비활성화한다.
    """
    for module in model.modules():
        if hasattr(module, "inplace"):
            module.inplace = False


def _resolve_target_layer(model: nn.Module) -> nn.Module:
    """
    Grad-CAM 대상 layer를 결정한다.

    현재 DenseNet121 기준:
    - 우선순위 1: model.features.denseblock4
    - fallback   : model.features
    """
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
    """
    Grad-CAM에 필요한 forward / backward hook을 등록한다.

    - forward hook  : activation 저장
    - backward hook : gradient 저장
    """
    def forward_hook(
        _: nn.Module,
        __: tuple[torch.Tensor, ...],
        output: torch.Tensor,
    ) -> None:
        activations.clear()
        activations.append(output.detach().clone())

    def backward_hook(
        _: nn.Module,
        __: tuple[torch.Tensor | None, ...],
        grad_output: tuple[torch.Tensor | None, ...],
    ) -> None:
        gradients.clear()
        first_grad = grad_output[0]
        if first_grad is not None:
            gradients.append(first_grad.detach().clone())

    forward_handle = target_layer.register_forward_hook(forward_hook)
    backward_handle = target_layer.register_full_backward_hook(backward_hook)

    return forward_handle, backward_handle


def _remove_hooks(
    handles: tuple[
        torch.utils.hooks.RemovableHandle,
        torch.utils.hooks.RemovableHandle,
    ],
) -> None:
    """
    등록한 hook을 반드시 제거한다.
    """
    for handle in handles:
        handle.remove()


def _resolve_target_score(
    *,
    logits: torch.Tensor,
    target_label_index: int,
) -> torch.Tensor:
    """
    logits에서 Grad-CAM backward 대상 score를 꺼낸다.
    """
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
    """
    activation / gradient를 이용해 Grad-CAM heatmap을 만든다.
    """
    if target_height <= 0 or target_width <= 0:
        raise InternalServerError(
            code="GRADCAM_TARGET_SIZE_INVALID",
            message="Grad-CAM target size must be positive.",
        )

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

    # channel-wise importance weight 계산
    weights = gradient.mean(dim=(2, 3), keepdim=True)

    # weighted sum -> ReLU
    cam = (weights * activation).sum(dim=1, keepdim=True)
    cam = F.relu(cam)

    # 원본 이미지 크기로 upsampling
    cam = F.interpolate(
        cam,
        size=(target_height, target_width),
        mode="bilinear",
        align_corners=False,
    )

    cam = cam.squeeze().detach().float().cpu().numpy()

    cam_min = float(cam.min())
    cam_max = float(cam.max())

    # activation이 전부 같은 값이면 heatmap 정보가 없으므로 0 배열 반환
    if cam_max <= cam_min:
        return np.zeros((target_height, target_width), dtype=np.float32)

    normalized_cam = (cam - cam_min) / (cam_max - cam_min)
    return normalized_cam.astype(np.float32)


def _build_overlay_image(
    *,
    original_image: Image.Image,
    heatmap: np.ndarray,
) -> Image.Image:
    """
    원본 RGB 이미지와 heatmap을 섞어 overlay 이미지를 만든다.
    """
    original_np = np.asarray(original_image).astype(np.float32) / 255.0
    heatmap_rgb = _apply_simple_colormap(heatmap)

    alpha_mask = (heatmap[..., None] * _GRADCAM_OVERLAY_ALPHA).astype(np.float32)
    overlay_np = original_np * (1.0 - alpha_mask) + heatmap_rgb * alpha_mask
    overlay_np = np.clip(overlay_np * 255.0, 0.0, 255.0).astype(np.uint8)

    return Image.fromarray(overlay_np)


def _save_overlay_image(
    *,
    analysis_id: str,
    overlay_image: Image.Image,
    settings: Settings,
) -> str:
    """
    overlay 이미지를 shared/generated 아래에 저장하고,
    상대경로 문자열을 반환한다.
    """
    relative_output_path = Path("analyses") / analysis_id / _GRADCAM_OUTPUT_FILENAME
    absolute_output_path = settings.shared_generated_dir / relative_output_path

    try:
        absolute_output_path.parent.mkdir(parents=True, exist_ok=True)
        overlay_image.save(absolute_output_path)
    except OSError as exc:
        raise InternalServerError(
            code="GRADCAM_SAVE_FAILED",
            message=f"Failed to save Grad-CAM overlay: {absolute_output_path.name}",
        ) from exc

    return relative_output_path.as_posix()


# apps/ai-service/src/ai_service/infrastructure/inference/gradcam_service.py
def _apply_simple_colormap(heatmap: np.ndarray) -> np.ndarray:
    """
    matplotlib turbo colormap을 적용해 RGB heatmap을 만든다.

    입력:
    - heatmap: [H, W], 값 범위 [0, 1] 기대

    출력:
    - [H, W, 3] float32 RGB 배열, 값 범위 [0, 1]
    """
    clipped_heatmap = np.clip(heatmap, 0.0, 1.0)

    # matplotlib colormap 결과는 RGBA이므로 RGB만 사용
    turbo_rgba = colormaps[_TURBO_COLORMAP_NAME](clipped_heatmap)
    turbo_rgb = turbo_rgba[..., :3]

    return turbo_rgb.astype(np.float32)