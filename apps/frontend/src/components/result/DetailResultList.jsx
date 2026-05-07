// apps/frontend/src/components/result/DetailResultList.jsx

import { CONDITION_ORDER, getConditionInfo, getRiskLevel } from "../../domain/conditionInfo";

function DetailResultList({ details = [] }) {
  const orderedDetails = orderDetails(details);

  if (!orderedDetails.length) {
    return (
      <section className="result-card product-panel">
        <h3>질환별 상세 결과</h3>
        <div className="empty-state">표시할 예측 결과가 없습니다.</div>
      </section>
    );
  }

  return (
    <section className="result-card product-panel">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">Condition Details</span>
          <h3>질환별 상세 결과와 해석</h3>
          <p>
            확률은 모델 출력값이며, threshold 이상이면 양성으로 표시됩니다. 각 설명은 결과를 이해하기 위한 보조 정보입니다.
          </p>
        </div>
      </div>

      <div className="condition-card-list">
        {orderedDetails.map((item) => {
          const info = getConditionInfo(item.name);
          const isPositive = item.result === "POSITIVE" || item.predicted;
          const probabilityPercent = toPercent(item.probability);
          const thresholdPercent = toPercent(item.threshold);
          const riskLevel = getRiskLevel(item.probability, item.threshold, isPositive);

          return (
            <article className={`condition-card ${isPositive ? "positive" : "negative"}`} key={item.name}>
              <div className="condition-main">
                <div className="condition-title-row">
                  <div>
                    <h4>{info.koName}</h4>
                    <span>{info.englishName}</span>
                  </div>
                  <div className="condition-score-block">
                    <strong>{probabilityPercent}%</strong>
                    <em>{isPositive ? "POSITIVE" : "NEGATIVE"}</em>
                  </div>
                </div>

                <div className="condition-bar-bg" aria-label={`${info.koName} probability`}>
                  <div
                    className={`condition-bar-fill ${isPositive ? "positive" : "negative"}`}
                    style={{ width: `${probabilityPercent}%` }}
                  />
                  <span className="threshold-marker" style={{ left: `${thresholdPercent}%` }} />
                </div>

                <div className="condition-meta-row">
                  <span>Threshold {thresholdPercent}%</span>
                  <span>위험도: {riskLevel}</span>
                </div>
              </div>

              <div className="condition-explanation">
                <p className="condition-short">{info.shortDescription}</p>
                <dl>
                  <div>
                    <dt>임상적 의미</dt>
                    <dd>{info.clinicalMeaning}</dd>
                  </div>
                  <div>
                    <dt>X-ray 확인 포인트</dt>
                    <dd>{info.xrayHint}</dd>
                  </div>
                  <div>
                    <dt>AI 결과 해석</dt>
                    <dd>{info.productNote}</dd>
                  </div>
                </dl>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function orderDetails(details) {
  const rank = new Map(CONDITION_ORDER.map((label, index) => [label, index]));
  return [...details].sort((a, b) => {
    const aRank = rank.get(a.name) ?? 999;
    const bRank = rank.get(b.name) ?? 999;
    return aRank - bRank;
  });
}

function toPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.0";
  return (Math.min(Math.max(numeric, 0), 1) * 100).toFixed(1);
}

export default DetailResultList;
