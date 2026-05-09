// apps/frontend/src/components/history/HistoryList.jsx

import { useMemo, useState } from "react";
import HistoryCard from "./HistoryCard";
import HistoryPreviewPanel from "./HistoryPreviewPanel";
import { historyData } from "../../mock/historyData";

const FILTERS = [
  { value: "all", label: "전체" },
  { value: "high", label: "우선 검토" },
  { value: "medium", label: "관찰 필요" },
  { value: "positive", label: "양성 소견 있음" },
];

function HistoryList({ onSelect }) {
  const [query, setQuery] = useState("");
  const [filter, set필터] = useState("all");
  const [sortBy, set정렬By] = useState("priority");
  const [selectedId, setSelectedId] = useState(historyData[0]?.id || "");

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return historyData
      .filter((item) => match필터(item, filter))
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [
          item.caseNo,
          item.id,
          item.topFinding,
          item.topFindingKo,
          item.viewPosition,
          item.reviewStatus,
          ...item.positiveLabels,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => sortHistoryItems(a, b, sortBy));
  }, [filter, query, sortBy]);

  const selectedItem = historyData.find((item) => item.id === selectedId) || visibleItems[0] || null;

  function handlePreview(analysisId) {
    setSelectedId(analysisId);
  }

  return (
    <section className="history-section pro-history-section">
      <div className="history-hero-panel">
        <div>
          <span className="eyebrow">Clinical Case Worklist</span>
          <h2>판독 검토 워크리스트</h2>
          <p>
            분석 완료 케이스를 우선순위, 주요 소견, 원본 영상, Grad-CAM 근거 영상 기준으로 빠르게 재검토
          </p>
        </div>
        <div className="history-hero-stats" aria-label="history summary">
          <StatBox label="Total Cases" value={historyData.length} />
          <StatBox label="Needs Review" value={historyData.filter((item) => item.priority === "high").length} />
          <StatBox label="Image Pairs" value="4" />
        </div>
      </div>

      <div className="history-toolbar">
        <label className="history-search-field">
          <span>검색</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="케이스 ID, 소견, 촬영 조건 검색"
          />
        </label>

        <div className="history-control-group">
          <label>
            <span>필터</span>
            <select value={filter} onChange={(event) => set필터(event.target.value)}>
              {FILTERS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>정렬</span>
            <select value={sortBy} onChange={(event) => set정렬By(event.target.value)}>
              <option value="priority">우선순위순</option>
              <option value="probability">확률 높은 순</option>
              <option value="recent">최근 분석순</option>
            </select>
          </label>
        </div>
      </div>

      <div className="history-workspace">
        <div className="history-worklist">
          {visibleItems.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onPreview={handlePreview}
              onSelect={onSelect}
            />
          ))}

          {!visibleItems.length && (
            <div className="history-empty-results">
              <h3>조건에 맞는 케이스 없음</h3>
              <p>검색어 또는 필터 조건 조정 필요</p>
            </div>
          )}
        </div>

        <HistoryPreviewPanel item={selectedItem} onSelect={onSelect} />
      </div>
    </section>
  );
}

function StatBox({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function match필터(item, filter) {
  if (filter === "high") return item.priority === "high";
  if (filter === "medium") return item.priority === "medium";
  if (filter === "positive") return item.positiveCount > 0;
  return true;
}

function sortHistoryItems(a, b, sortBy) {
  if (sortBy === "probability") return b.topProbability - a.topProbability;
  if (sortBy === "recent") return String(b.date).localeCompare(String(a.date));
  const rank = { high: 0, medium: 1, low: 2 };
  return (rank[a.priority] ?? 99) - (rank[b.priority] ?? 99) || b.topProbability - a.topProbability;
}

export default HistoryList;
