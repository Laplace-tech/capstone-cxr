// apps/frontend/src/components/result/ResultSummary.jsx

import { getConditionInfo } from "../../domain/conditionInfo";
import { formatPercent } from "../../domain/formatters";

function ResultSummary({ result }) {
  const details = result?.details || [];
  const positiveLabels = result?.predictionSummary?.positiveLabels || [];
  const positiveCount = result?.predictionSummary?.positiveCount ?? positiveLabels.length;
  const totalCount = result?.predictionSummary?.totalCount ?? details.length ?? 0;
  const modelVersion = result?.modelVersion || "-";
  const thresholdVersion = result?.thresholdVersion || "-";
  const topFinding = result?.topFinding || getTopFinding(details);
  const workflowMessage = getWorkflowMessage(positiveCount, topFinding);

  return (
    <section className="summary-section product-panel" aria-labelledby="summary-title">
      <div className="section-title-row summary-title-row">
        <div>
          <span className="eyebrow">AI Reading Assist</span>
          <h3 id="summary-title">분석 결과 요약</h3>
          <p>
            모델이 5개 주요 흉부 이상 소견을 독립 평가하고 threshold 기준 양성 여부 표시
          </p>
        </div>
        <span className={`clinical-priority ${positiveCount > 0 ? "attention" : "stable"}`}>
          {positiveCount > 0 ? "Review Needed" : "No Positive Finding"}
        </span>
      </div>

      <div className="summary-hero-grid">
        <SummaryHeroCard
          label="판독 보조 결론"
          value={positiveCount > 0 ? `${positiveCount}개 소견 양성` : "양성으로 분류된 소견 없음"}
          description={workflowMessage}
          primary
        />

        <TopFindingCard topFinding={topFinding} />
      </div>

      <div className="summary-grid" aria-label="analysis metadata">
        <SummaryMetric
          label="양성 병변"
          value={formatPositiveLabels(positiveLabels)}
          wide
        />
        <SummaryMetric label="양성 개수" value={`${positiveCount} / ${totalCount || 5}`} />
        <SummaryMetric label="모델 버전" value={modelVersion} />
        <SummaryMetric label="Threshold 버전" value={thresholdVersion} />
      </div>
    </section>
  );
}

function SummaryHeroCard({ label, value, description, primary = false }) {
  return (
    <article className={`summary-hero-card ${primary ? "primary" : ""}`}>
      <span className="summary-label">{label}</span>
      <strong className="summary-value large">{value}</strong>
      <p>{description}</p>
    </article>
  );
}

function TopFindingCard({ topFinding }) {
  if (!topFinding) {
    return (
      <article className="summary-hero-card top-finding-card">
        <span className="summary-label">가장 높은 확률 소견</span>
        <strong className="summary-value">-</strong>
        <p>표시할 결과 없음</p>
      </article>
    );
  }

  const info = getConditionInfo(topFinding.name);

  return (
    <article className="summary-hero-card top-finding-card">
      <span className="summary-label">가장 높은 확률 소견</span>
      <div className="top-finding-name">
        <strong>{info.koName}</strong>
        <span>{info.englishName}</span>
      </div>
      <p>예측 확률 {formatPercent(topFinding.probability)}</p>
    </article>
  );
}

function SummaryMetric({ label, value, wide = false }) {
  return (
    <article className={`summary-item ${wide ? "summary-item-wide" : ""}`}>
      <span className="summary-label">{label}</span>
      <strong className="summary-value">{value}</strong>
    </article>
  );
}

function formatPositiveLabels(labels) {
  if (!labels.length) return "없음";
  return labels.map((label) => getConditionInfo(label).koName).join(", ");
}

function getTopFinding(details) {
  if (!details?.length) return null;
  return [...details].sort((a, b) => b.probability - a.probability)[0];
}

function getWorkflowMessage(positiveCount, topFinding) {
  if (positiveCount > 0) {
    return "양성 분류 소견을 우선 검토하고 원본 영상과 Grad-CAM 근거 영역을 함께 확인";
  }

  if (topFinding) {
    const info = getConditionInfo(topFinding.name);
    return `현재 threshold 기준 양성 소견 없음. 가장 높은 확률 항목은 ${info.koName}`;
  }

  return "현재 표시할 예측 결과 없음";
}

export default ResultSummary;
