// apps/frontend/src/App.jsx

import { useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PendingPage from "./pages/PendingPage";
import AnalysisPage from "./pages/AnalysisPage";
import HistoryPage from "./pages/HistoryPage";
import { useAnalysis } from "./hooks/useAnalysis";
import { useAnalysisStore } from "./stores/analysisStore";

function App() {
  const [user, setUser] = useState(null);
  const [authPage, setAuthPage] = useState("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [currentPage, setCurrentPage] = useState("analysis");

  const { analysisStatus, selectedAnalysisId, loadExistingResult } = useAnalysis();
  const setSelectedAnalysisId = useAnalysisStore((state) => state.setSelectedAnalysisId);

  function handleSelect(analysisId) {
    setSelectedAnalysisId(analysisId);
    setCurrentPage("analysis");
    void loadExistingResult(analysisId);
  }

  if (!user) {
    if (authPage === "signup") {
      return (
        <SignupPage
          onGoLogin={(state, email) => {
            if (state === "pending") {
              setPendingEmail(email || "");
              setAuthPage("pending");
            } else {
              setAuthPage("login");
            }
          }}
        />
      );
    }

    if (authPage === "pending") {
      return <PendingPage email={pendingEmail} onGoLogin={() => setAuthPage("login")} />;
    }

    return (
      <LoginPage
        onLogin={(userData) => setUser(userData)}
        onGoSignup={() => setAuthPage("signup")}
      />
    );
  }

  return (
    <div className="app">
      <header className="header app-shell-header">
        <div>
          <span className="eyebrow">Capstone CXR</span>
          <h1>Chest X-ray Reading Assist System</h1>
          <p>예측 확률, 병변별 설명, Grad-CAM 근거 영상을 한 화면에 묶은 흉부 X-ray 판독 보조 워크스페이스</p>
          <p className="selected-id-text">
            선택 분석 ID {selectedAnalysisId || "없음"}
          </p>
        </div>

        <div className="header-actions">
          <span className={`status-badge ${analysisStatus}`}>{analysisStatus}</span>
          <button className="logout-button" onClick={() => setUser(null)}>
            로그아웃
          </button>
        </div>
      </header>

      <div className="tab-buttons product-tabs">
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
        {currentPage === "analysis" && <AnalysisPage />}
        {currentPage === "history" && <HistoryPage onSelect={handleSelect} />}
      </main>
    </div>
  );
}

export default App;
