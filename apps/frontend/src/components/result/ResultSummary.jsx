function ResultSummary({ result }) {
    const positiveLabels = result?.predictionSummary?.positiveLabels || [];
    const positiveCount = positiveLabels.length;
    const modelVersion = result?.modelVersion || "-";

    return (
        <section className="summary-section">
        <h3>분석 결과 요약</h3>

        <div className="summary-grid">
            <div className="summary-item">
            <span className="summary-label">양성 병변</span>
            <strong className="summary-value">
                {positiveLabels.length > 0 ? positiveLabels.join(", ") : "없음"}
            </strong>
            </div>

            <div className="summary-item">
            <span className="summary-label">양성 개수</span>
            <strong className="summary-value">{positiveCount}</strong>
            </div>

            <div className="summary-item">
            <span className="summary-label">모델 버전</span>
            <strong className="summary-value">{modelVersion}</strong>
            </div>
        </div>
        </section>
    );
}

export default ResultSummary;