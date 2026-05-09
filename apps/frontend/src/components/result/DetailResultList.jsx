// apps/frontend/src/components/result/DetailResultList.jsx

import {
  getConditionInfo,
  getRiskLevel,
  getRiskTone,
  orderByClinicalDisplay,
} from "../../domain/conditionInfo";
import { formatPercent, formatProbabilityValue } from "../../domain/formatters";

function DetailResultList({ details = [] }) {
  const orderedDetails = orderByClinicalDisplay(details);

  if (!orderedDetails.length) {
    return (
      <section className="result-card product-panel">
        <h3>질환별 상세 결과</h3>
        <div className="empty-state">표시할 예측 결과 없음</div>
      </section>
    );
  }

  return (
    <section className="result-card product-panel" aria-labelledby="condition-detail-title">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">Condition Details</span>
          <h3 id="condition-detail-title">질환별 상세 결과와 해석</h3>
          <p>
            확률은 모델 출력값, threshold 이상이면 양성으로 표시. 각 설명은 결과 이해를 위한 보조 정보
          </p>
        </div>
      </div>

      <div className="condition-card-list">
        {orderedDetails.map((item) => (
          <ConditionCard item={item} key={item.name} />
        ))}
      </div>
    </section>
  );
}

function ConditionCard({ item }) {
  const info = getConditionInfo(item.name);
  const isPositive = item.result === "POSITIVE" || item.predicted;
  const probabilityText = formatPercent(item.probability);
  const probabilityValue = formatProbabilityValue(item.probability);
  const thresholdText = formatPercent(item.threshold);
  const thresholdValue = formatProbabilityValue(item.threshold);
  const riskLevel = getRiskLevel(item.probability, item.threshold, isPositive);
  const riskTone = getRiskTone(riskLevel);

  return (
    <article className={`condition-card ${isPositive ? "positive" : "negative"}`}>
      <div className="condition-main">
        <div className="condition-title-row">
          <div className="condition-name-block">
            <h4>{info.koName}</h4>
            <span>{info.englishName}</span>
          </div>

          <div className="condition-score-block">
            <strong>{probabilityText}</strong>
            <em>{isPositive ? "POSITIVE" : "NEGATIVE"}</em>
          </div>
        </div>

        <div className="condition-bar-bg" aria-label={`${info.koName} prediction probability`}>
          <div
            className={`condition-bar-fill ${isPositive ? "positive" : "negative"}`}
            style={{ width: `${probabilityValue}%` }}
          />
          <span className="threshold-marker" style={{ left: `${thresholdValue}%` }} />
        </div>

        <div className="condition-meta-row">
          <span>Threshold {thresholdText}</span>
          <span className={`risk-pill ${riskTone}`}>위험도: {riskLevel}</span>
        </div>
      </div>

      <div className="condition-explanation">
        <p className="condition-short">{info.plainSummary}</p>
        <DescriptionList
          items={[
            ["임상적 의미", info.clinicalMeaning],
            ["X-ray 확인 포인트", info.xrayHint],
            ["AI 결과 해석", info.reviewGuide],
            ["주의", info.caution],
          ]}
        />
      </div>
    </article>
  );
}

function DescriptionList({ items }) {
  return (
    <dl>
      {items.map(([term, description]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{description}</dd>
        </div>
      ))}
    </dl>
  );
}

export default DetailResultList;
