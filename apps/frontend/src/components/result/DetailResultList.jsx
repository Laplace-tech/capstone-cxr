function DetailResultList({ details = [] }) {
    return (
        <section className="result-card">
        <h3>질환별 상세 결과</h3>

        <div className="result-list">
            {details.map((item) => {
            const isPositive = item.result === "POSITIVE";

            return (
                <div className="result-row" key={item.name}>
                <div className="result-name">{item.name}</div>

                <div className="result-bar-area">
                    <div className="result-bar-bg">
                    <div
                        className={`result-bar-fill ${isPositive ? "positive" : "negative"}`}
                        style={{ width: `${item.probability}%` }}
                    />
                    </div>
                </div>

                <div className="result-meta">
                    <span className="result-prob">{item.probability.toFixed(1)}%</span>
                    <span className={`result-badge ${isPositive ? "positive" : "negative"}`}>
                    {item.result}
                    </span>
                </div>
                </div>
            );
            })}
        </div>
        </section>
    );
    }

export default DetailResultList;