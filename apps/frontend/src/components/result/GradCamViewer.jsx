// apps/frontend/src/components/result/GradCamViewer.jsx

import { useMemo, useState } from "react";
import xrayPlaceholder from "../../assets/xray-placeholder.png";

function GradCamViewer({ result }) {
  const [originalFailed, setOriginalFailed] = useState(false);
  const [gradCamFailed, setGradCamFailed] = useState(false);

  const images = useMemo(
    () => ({
      original: !originalFailed && result?.originalImage ? result.originalImage : xrayPlaceholder,
      gradcam: !gradCamFailed ? result?.gradCamUrl || "" : "",
    }),
    [gradCamFailed, originalFailed, result?.gradCamUrl, result?.originalImage],
  );

  return (
    <section className="viewer-section product-panel" aria-label="X-ray and Grad-CAM viewer">
      <ImageViewerCard
        eyebrow="Input Image"
        title="Original X-ray"
        imageUrl={images.original}
        linkUrl={result?.originalImage}
        linkLabel="원본 열기"
        alt="Original chest X-ray"
        onImageError={() => setOriginalFailed(true)}
      />

      <ImageViewerCard
        eyebrow="Explainability"
        title="Grad-CAM Evidence Map"
        imageUrl={images.gradcam}
        linkUrl={images.gradcam}
        linkLabel="결과 열기"
        alt="Grad-CAM evidence map"
        onImageError={() => setGradCamFailed(true)}
        emptyMessage="Grad-CAM 결과 없음"
        footer={
          <div className="gradcam-guide">
            <strong>해석 가이드</strong>
            <p>
              붉거나 밝게 강조된 영역은 모델이 예측에 상대적으로 더 많이 참고한 위치. 이 영역은 진단 자체가 아니라
              판독자가 확인할 후보 영역
            </p>
          </div>
        }
      />
    </section>
  );
}

function ImageViewerCard({
  eyebrow,
  title,
  imageUrl,
  linkUrl,
  linkLabel,
  alt,
  onImageError,
  emptyMessage,
  footer,
}) {
  return (
    <article className="viewer-card image-product-card">
      <div className="viewer-header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
        </div>
        {linkUrl && (
          <a className="viewer-link" href={linkUrl} target="_blank" rel="noreferrer">
            {linkLabel}
          </a>
        )}
      </div>

      <div className="image-frame medical-image-frame">
        {imageUrl ? (
          <img src={imageUrl} alt={alt} onError={onImageError} />
        ) : (
          <div className="empty-overlay-message">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>

      {footer}
    </article>
  );
}

export default GradCamViewer;
