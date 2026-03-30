function DetailResultList({ details = [] }) {
    return (
        <section className="detail-card">
        <h2>질환별 상세 결과</h2>

        <div className="detail-list">
            {details.length === 0 ? (
            <p className="empty-text">상세 결과가 없습니다.</p>
            ) : (
            details.map((item, index) => (
                <div key={`${item.name}-${index}`} className="detail-item">
                <div className="detail-top">
                    <h3>{item.name}</h3>
                    <span
                    className={`result-badge ${
                        item.result === "POSITIVE" ? "positive" : "negative"
                    }`}
                    >
                    {item.result}
                    </span>
                </div>

                <div className="detail-meta">
                    <span>확률: {item.probability}%</span>
                </div>

                <div className="probability-bar">
                    <div
                    className={`probability-fill ${
                        item.result === "POSITIVE" ? "positive" : "negative"
                    }`}
                    style={{ width: `${item.probability}%` }}
                    />
                </div>
                </div>
            ))
            )}
        </div>
        </section>
    );
}

export default DetailResultList;