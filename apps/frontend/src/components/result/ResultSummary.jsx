// apps/frontend/src/components/result/ResultSummary.jsx

import { getConditionInfo } from "../../domain/conditionInfo";

function ResultSummary({ result }) {
  const details = result?.details || [];
  const positiveLabels = result?.predictionSummary?.positiveLabels || [];
  const positiveCount = result?.predictionSummary?.positiveCount ?? positiveLabels.length;
  const totalCount = result?.predictionSummary?.totalCount ?? details.length ?? 0;
  const modelVersion = result?.modelVersion || "-";
  const thresholdVersion = result?.thresholdVersion || "-";
  const topFinding = getTopFinding(details);
  const workflowMessage = getWorkflowMessage(positiveCount, topFinding);

  return (
    <section className="summary-section product-panel">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">AI Reading Assist</span>
          <h3>분석 결과 요약</h3>
          <p>
            모델이 5개 주요 흉부 이상 소견을 독립적으로 평가하고, threshold 기준으로 양성 여부를 표시합니다.
          </p>
        </div>
        <span className={`clinical-priority ${positiveCount > 0 ? "attention" : "stable"}`}>
          {positiveCount > 0 ? "Review Needed" : "No Positive Finding"}
        </span>
      </div>

      <div className="summary-hero-grid">
        <div className="summary-hero-card primary">
          <span className="summary-label">판독 보조 결론</span>
          <strong className="summary-value large">
            {positiveCount > 0 ? `${positiveCount}개 소견 양성` : "양성으로 분류된 소견 없음"}
          </strong>
          <p>{workflowMessage}</p>
        </div>

        <div className="summary-hero-card">
          <span className="summary-label">가장 높은 확률 소견</span>
          <strong className="summary-value">
            {topFinding ? `${getConditionInfo(topFinding.name).koName} (${topFinding.name})` : "-"}
          </strong>
          <p>{topFinding ? `예측 확률 ${toPercent(topFinding.probability)}%` : "표시할 결과가 없습니다."}</p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-item summary-item-wide">
          <span className="summary-label">양성 병변</span>
          <strong className="summary-value">
            {positiveLabels.length > 0
              ? positiveLabels.map((label) => getConditionInfo(label).koName).join(", ")
              : "없음"}
          </strong>
        </div>

        <div className="summary-item">
          <span className="summary-label">양성 개수</span>
          <strong className="summary-value">
            {positiveCount} / {totalCount || "-"}
          </strong>
        </div>

        <div className="summary-item">
          <span className="summary-label">모델 버전</span>
          <strong className="summary-value">{modelVersion}</strong>
        </div>

        <div className="summary-item">
          <span className="summary-label">Threshold 버전</span>
          <strong className="summary-value">{thresholdVersion}</strong>
        </div>
      </div>
    </section>
  );
}

function getTopFinding(details) {
  if (!details.length) return null;
  return [...details].sort((a, b) => Number(b.probability) - Number(a.probability))[0];
}

function getWorkflowMessage(positiveCount, topFinding) {
  if (!topFinding) return "분석 결과가 아직 준비되지 않았습니다.";
  if (positiveCount === 0) {
    return "현재 threshold 기준으로 양성 소견은 없지만, 원본 영상과 임상 정보를 함께 확인해야 합니다.";
  }
  if (positiveCount >= 3) {
    return "여러 소견이 동시에 양성으로 표시되었습니다. 우선순위 판독과 추가 확인이 필요합니다.";
  }
  return "양성으로 표시된 소견을 중심으로 원본 영상과 Grad-CAM 위치를 함께 확인하세요.";
}

function toPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.0";
  return (Math.min(Math.max(numeric, 0), 1) * 100).toFixed(1);
}

export default ResultSummary;
