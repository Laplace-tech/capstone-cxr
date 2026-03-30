import HistoryCard from "./HistoryCard";
import { historyData } from "../../mock/historyData";

function HistoryList({ onSelect }) {
    return (
        <section className="history-section">
        <h2>과거 판독 기록</h2>

        <div className="history-list">
            {historyData.map((item) => (
            <HistoryCard
                key={item.id}
                item={item}
                onSelect={onSelect}
            />
            ))}
        </div>
        </section>
    );
    }

export default HistoryList;