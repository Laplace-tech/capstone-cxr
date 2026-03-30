import { useState } from "react";
import xrayPlaceholder from "../../assets/xray-placeholder.png";

function GradCamViewer({ result }) {
    const [showOverlay, setShowOverlay] = useState(true);
    const [opacity, setOpacity] = useState(60);

    const originalImage = xrayPlaceholder;
    const gradCamUrl = result?.gradCamUrl || "";
    const canShowOverlay = Boolean(result?.originalImage && gradCamUrl);

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
                disabled={!canShowOverlay}
                />
                Overlay 표시
            </label>
            </div>

            <div className="image-frame overlay-frame">
            <img src={originalImage} alt="Base X-ray" />

            {showOverlay && canShowOverlay && (
                <img
                src={gradCamUrl}
                alt="Grad-CAM"
                className="overlay-image heatmap"
                style={{ opacity: opacity / 100 }}
                />
            )}

            {!gradCamUrl && (
                <div className="empty-overlay-message">
                <p>Grad-CAM 결과가 아직 생성되지 않았습니다.</p>
                </div>
            )}
            </div>

            {canShowOverlay && (
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
            )}
        </div>
        </section>
    );
}

export default GradCamViewer;