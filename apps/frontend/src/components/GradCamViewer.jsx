import { useState } from "react";

function GradCamViewer({ result }) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [opacity, setOpacity] = useState(60);

  const originalImage =
    result?.originalImage ||
    "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=800&q=80";

  const gradCamUrl = result?.gradCamUrl || "";

  return (
    <section className="viewer-section">
      <div className="viewer-card">
        <h3>Original X-ray</h3>
        <div className="image-frame">
          <img src={originalImage} alt="Original X-ray" />
        </div>
      </div>

      <div className="viewer-card">
        <div className="viewer-header">
          <h3>Grad-CAM Overlay</h3>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showOverlay}
              onChange={() => setShowOverlay((prev) => !prev)}
            />
            Overlay 표시
          </label>
        </div>

        <div className="image-frame overlay-frame">
          <img src={originalImage} alt="Base X-ray" />

          {showOverlay && gradCamUrl ? (
            <img
              src={gradCamUrl}
              alt="Grad-CAM"
              className="overlay-image heatmap"
              style={{ opacity: opacity / 100 }}
            />
          ) : (
            <div className="empty-overlay-message">
              Grad-CAM 이미지가 아직 없습니다.
            </div>
          )}
        </div>

        <div className="slider-box">
          <label htmlFor="opacity-range">Overlay 투명도: {opacity}%</label>
          <input
            id="opacity-range"
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </div>
      </div>
    </section>
  );
}

export default GradCamViewer;