import { useEffect, useState } from "react";
import "./App.css";
import AnalysisPage from "./pages/AnalysisPage";
import HistoryPage from "./pages/HistoryPage";
import { analysisResults } from "./mock/analysisResults";

function App() {
  const [analysisStatus, setAnalysisStatus] = useState("loading");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState("analysis");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState("analysis-001");

  const handleSelect = (id) => {
    setSelectedAnalysisId(id);
    setCurrentPage("analysis");
  };

  const mapAnalysisResult = (data) => {
    return {
      id: data.id,
      modelVersion: data.modelVersion,
      predictionSummary: {
        positiveLabels: data.predictionSummary?.positiveLabels || [],
        totalCount: data.predictionSummary?.totalCount || 0,
      },
      details: data.details || [],
      gradCamUrl: data.gradCamUrl || "",
      originalImage: data.originalImage || "",
    };
  };

  useEffect(() => {
  const fetchAnalysisResult = async () => {
    try {
      setAnalysisStatus("loading");
      setError("");

      // 실제 API 연결 전 임시 코드
      // const response = await fetch(`/api/v1/analyses/${selectedAnalysisId}/result`);
      // if (!response.ok) {
      //   throw new Error(`HTTP ${response.status}`);
      // }
      // const rawData = await response.json();

      const rawData = analysisResults[selectedAnalysisId];

      if (!rawData) {
        throw new Error("해당 분석 결과를 찾을 수 없습니다.");
      }

      const mappedData = mapAnalysisResult(rawData);

      setResult(mappedData);
      setAnalysisStatus("completed");
    } catch (err) {
      setError(err.message || "결과를 불러오지 못했습니다.");
      setAnalysisStatus("error");
    }
  };

    fetchAnalysisResult();
    }, [selectedAnalysisId]);

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