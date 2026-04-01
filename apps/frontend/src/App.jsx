import { useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import AnalysisPage from "./pages/AnalysisPage";
import HistoryPage from "./pages/HistoryPage";
import { useAnalysis } from "./hooks/useAnalysis";
import { useAnalysisStore } from "./stores/analysisStore";

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("analysis");

  const { analysisStatus, result, error, selectedAnalysisId } = useAnalysis();
  const setSelectedAnalysisId = useAnalysisStore(
    (state) => state.setSelectedAnalysisId
  );

  const handleSelect = (id) => {
    setSelectedAnalysisId(id);
    setCurrentPage("analysis");
  };

  if (!user) {
    return <LoginPage onLogin={(userData) => setUser(userData)} />;
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className={`status-badge ${analysisStatus}`}>
            {analysisStatus}
          </span>
          <button
            onClick={() => setUser(null)}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1.5px solid #e2e8f0",
              background: "white",
              fontSize: "12px",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </div>
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