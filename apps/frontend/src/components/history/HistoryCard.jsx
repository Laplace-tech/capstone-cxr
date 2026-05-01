function HistoryCard({ item, onSelect }) {
    return (
        <div className="history-card">
        <div className="history-top">
            <h3>{item.id}</h3>
            <span className={`status-badge ${item.status}`}>
            {item.status}
            </span>
        </div>

        <p className="history-date">{item.date}</p>

        <div className="history-labels">
            {item.positiveLabels.length > 0
            ? item.positiveLabels.join(", ")
            : "이상 없음"}
        </div>

        <button
            className="detail-button"
            onClick={() => onSelect(item.id)}
        >
            상세 보기
        </button>
        </div>
    );
}

export default HistoryCard;