// apps/frontend/src/components/history/HistoryPreviewPanel.jsx

import { formatPercent } from "../../domain/formatters";

function HistoryPreviewPanel({ item, onSelect }) {
  if (!item) {
    return (
      <aside className="history-preview-panel empty">
        <div className="preview-empty-icon">CXR</div>
        <h3>케이스 선택 대기</h3>
        <p>좌측 워크리스트에서 케이스를 선택하면 원본 X-ray, Grad-CAM 근거 영상, 주요 소견을 한 화면에서 확인</p>
      </aside>
    );
  }

  return (
    <aside className="history-preview-panel">
      <div className="preview-panel-header">
        <div>
          <span className="eyebrow">Selected Study</span>
          <h3>{item.caseNo}</h3>
          <p>{item.studyType} · {item.viewPosition}</p>
        </div>
        <span className={`priority-badge ${item.priority}`}>{item.reviewStatus}</span>
      </div>

      <div className="preview-compare-grid">
        <ImagePreview title="원본" src={item.originalImageUrl} />
        <ImagePreview title="Grad-CAM" src={item.gradcamImageUrl} />
      </div>

      <div className="preview-decision-card">
        <span>판독 보조 요약</span>
        <strong>{item.topFindingKo} 우선 확인</strong>
        <p>{item.summary}</p>
      </div>

      <div className="preview-finding-list">
        <PreviewMetric label="주요 소견" value={`${item.topFindingKo} · ${formatPercent(item.topProbability)}`} />
        <PreviewMetric label="양성 소견" value={item.positiveLabels.join(", ")} />
        <PreviewMetric label="모델 / Threshold" value={`${item.modelVersion} · ${item.thresholdVersion}`} />
        <PreviewMetric label="영상 품질" value={item.imageQuality} />
      </div>

      <button className="preview-primary-button" type="button" onClick={() => onSelect(item.id)}>
        분석 화면 열기
      </button>
    </aside>
  );
}

function ImagePreview({ title, src }) {
  return (
    <figure className="preview-image-card">
      <img src={src} alt={`${title} preview`} />
      <figcaption>{title}</figcaption>
    </figure>
  );
}

function PreviewMetric({ label, value }) {
  return (
    <div className="preview-metric-row">
      <span>{label}</span>
      <strong>{value || "없음"}</strong>
    </div>
  );
}

export default HistoryPreviewPanel;
