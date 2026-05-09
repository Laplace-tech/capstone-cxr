// apps/frontend/src/components/history/HistoryCard.jsx

import { formatPercent } from "../../domain/formatters";

function HistoryCard({ item, isSelected, onPreview, onSelect }) {
  return (
    <article className={`history-worklist-card ${isSelected ? "selected" : ""}`}>
      <button className="history-card-visual" type="button" onClick={() => onPreview(item.id)}>
        <div className="history-image-pair">
          <ImageTile title="원본" src={item.originalImageUrl} alt={`${item.caseNo} original X-ray`} />
          <ImageTile title="Grad-CAM" src={item.gradcamImageUrl} alt={`${item.caseNo} Grad-CAM overlay`} />
        </div>
      </button>

      <div className="history-card-body">
        <div className="history-card-header">
          <div>
            <p className="history-case-label">{item.caseNo}</p>
            <h3>{item.topFindingKo}</h3>
            <span>{item.topFinding}</span>
          </div>
          <span className={`priority-badge ${item.priority}`}>{item.reviewStatus}</span>
        </div>

        <p className="history-summary-text">{item.summary}</p>

        <div className="history-metric-grid">
          <Metric label="최고 확률" value={formatPercent(item.topProbability)} />
          <Metric label="양성 소견" value={`${item.positiveCount} / ${item.totalLabels}`} />
          <Metric label="촬영 조건" value={item.viewPosition} />
        </div>

        <div className="history-card-footer">
          <div className="history-footnote">
            <span>{item.date}</span>
            <span>{item.imageQuality}</span>
          </div>
          <button className="review-case-button" type="button" onClick={() => onSelect(item.id)}>
            분석 화면 열기
          </button>
        </div>
      </div>
    </article>
  );
}

function ImageTile({ title, src, alt }) {
  return (
    <figure className="history-image-tile">
      <img src={src} alt={alt} loading="lazy" />
      <figcaption>{title}</figcaption>
    </figure>
  );
}

function Metric({ label, value }) {
  return (
    <div className="history-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default HistoryCard;
