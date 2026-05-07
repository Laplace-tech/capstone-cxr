// apps/frontend/src/components/result/GradCamViewer.jsx

import { useState } from "react";
import xrayPlaceholder from "../../assets/xray-placeholder.png";

function GradCamViewer({ result }) {
  const [originalFailed, setOriginalFailed] = useState(false);
  const [gradCamFailed, setGradCamFailed] = useState(false);

  const originalImage = !originalFailed && result?.originalImage ? result.originalImage : xrayPlaceholder;
  const gradCamUrl = !gradCamFailed ? result?.gradCamUrl || "" : "";

  return (
    <section className="viewer-section product-panel">
      <div className="viewer-card image-product-card">
        <div className="viewer-header">
          <div>
            <span className="eyebrow">Input Image</span>
            <h3>Original X-ray</h3>
          </div>
          {result?.originalImage && (
            <a className="viewer-link" href={result.originalImage} target="_blank" rel="noreferrer">
              원본 열기
            </a>
          )}
        </div>

        <div className="image-frame medical-image-frame">
          <img
            src={originalImage}
            alt="Original X-ray"
            onError={() => setOriginalFailed(true)}
          />
        </div>
      </div>

      <div className="viewer-card image-product-card">
        <div className="viewer-header">
          <div>
            <span className="eyebrow">Explainability</span>
            <h3>Grad-CAM Evidence Map</h3>
          </div>
          {gradCamUrl && (
            <a className="viewer-link" href={gradCamUrl} target="_blank" rel="noreferrer">
              결과 열기
            </a>
          )}
        </div>

        <div className="image-frame medical-image-frame">
          {gradCamUrl ? (
            <img
              src={gradCamUrl}
              alt="Grad-CAM evidence map"
              onError={() => setGradCamFailed(true)}
            />
          ) : (
            <div className="empty-overlay-message">
              <p>Grad-CAM 결과가 아직 생성되지 않았습니다.</p>
            </div>
          )}
        </div>

        <div className="gradcam-guide">
          <strong>해석 가이드</strong>
          <p>
            붉거나 밝게 강조된 영역은 모델이 예측에 상대적으로 더 많이 참고한 위치입니다. 강조 영역은 진단 자체가 아니라
            판독자가 확인할 후보 영역을 제시하는 보조 정보입니다.
          </p>
        </div>
      </div>
    </section>
  );
}

export default GradCamViewer;
