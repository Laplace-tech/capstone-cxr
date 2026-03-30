import { useState } from "react";
import "./App.css";
import AnalysisPage from "./pages/AnalysisPage";
import HistoryPage from "./pages/HistoryPage";
import { useAnalysis } from "./hooks/useAnalysis";
import { useAnalysisStore } from "./stores/analysisStore";

function App() {
  const [currentPage, setCurrentPage] = useState("analysis");

  const { analysisStatus, result, error, selectedAnalysisId } = useAnalysis();
  const setSelectedAnalysisId = useAnalysisStore(
    (state) => state.setSelectedAnalysisId
  );

  const handleSelect = (id) => {
    setSelectedAnalysisId(id);
    setCurrentPage("analysis");
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Chest X-ray Analysis Dashboard</h1>
          <p>AI 판독 결과와 Grad-CAM 시각화를 확인할 수 있습니다.</p>
          <p className="selected-id-text">
            현재 선택된 분석 ID: {selectedAnalysisId}
          </p>
        </div>

        <span className={`status-badge ${analysisStatus}`}>
          {analysisStatus}
        </span>
      </header>

      <div className="tab-buttons">
        <button
          className={currentPage === "analysis" ? "active" : ""}
          onClick={() => setCurrentPage("analysis")}
        >
          Analysis
        </button>

        <button
          className={currentPage === "history" ? "active" : ""}
          onClick={() => setCurrentPage("history")}
        >
          History
        </button>
      </div>

      <main className="dashboard">
        {currentPage === "analysis" && (
          <AnalysisPage
            analysisStatus={analysisStatus}
            result={result}
            error={error}
          />
        )}

        {currentPage === "history" && (
          <HistoryPage onSelect={handleSelect} />
        )}
      </main>
    </div>
  );
}

export default App;