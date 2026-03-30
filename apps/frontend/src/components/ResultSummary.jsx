function ResultSummary({ result }) {
  const positiveLabels = result?.predictionSummary?.positiveLabels || [];

  return (
    <section className="summary-card">
      <h2>분석 결과 요약</h2>

      <div className="summary-grid">
        <div className="summary-item">
          <span className="label">양성 질환</span>
          <strong>
            {positiveLabels.length > 0 ? positiveLabels.join(", ") : "없음"}
          </strong>
        </div>

        <div className="summary-item">
          <span className="label">양성 개수</span>
          <strong>{positiveLabels.length}</strong>
        </div>

        <div className="summary-item">
          <span className="label">모델 버전</span>
          <strong>{result?.modelVersion || "-"}</strong>
        </div>
      </div>
    </section>
  );
}

export default ResultSummary;