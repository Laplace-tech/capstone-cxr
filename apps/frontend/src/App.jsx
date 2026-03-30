import { useEffect, useState } from "react";
import "./App.css";
import ResultSummary from "./components/ResultSummary";
import DetailResultList from "./components/DetailResultList";
import GradCamViewer from "./components/GradCamViewer";
import InfoSection from "./components/InfoSection";

function App() {
  const [analysisStatus, setAnalysisStatus] = useState("loading");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalysisResult = async () => {
      try {
        setAnalysisStatus("loading");
        setError("");

        // 임시 더미 데이터
        const data = {
          id: "uuid-123",
          modelVersion: "baseline_01_run_20260321_125758",
          predictionSummary: {
            positiveLabels: ["Atelectasis", "Cardiomegaly", "Edema"],
            totalCount: 5,
          },
          details: [
            {
              name: "Atelectasis",
              probability: 73.4,
              result: "POSITIVE",
            },
            {
              name: "Cardiomegaly",
              probability: 81.2,
              result: "POSITIVE",
            },
            {
              name: "Consolidation",
              probability: 42.8,
              result: "NEGATIVE",
            },
            {
              name: "Edema",
              probability: 77.6,
              result: "POSITIVE",
            },
            {
              name: "Pleural Effusion",
              probability: 35.1,
              result: "NEGATIVE",
            },
          ],
          gradCamUrl: "",
          originalImage:
            "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=800&q=80",
        };

        setTimeout(() => {
          setResult(data);
          setAnalysisStatus("completed");
        }, 500);
      } catch (err) {
        setError(err.message || "결과를 불러오지 못했습니다.");
        setAnalysisStatus("error");
      }
    };

    fetchAnalysisResult();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Chest X-ray Analysis Dashboard</h1>
          <p>AI 판독 결과와 Grad-CAM 시각화를 확인할 수 있습니다.</p>
        </div>
        <span className={`status-badge ${analysisStatus}`}>
          {analysisStatus}
        </span>
      </header>

      <main className="dashboard">
        {analysisStatus === "loading" && (
          <section className="state-card">
            <h2>분석 결과를 불러오는 중입니다...</h2>
            <p>잠시만 기다려 주세요.</p>
          </section>
        )}

        {analysisStatus === "error" && (
          <section className="state-card error-card">
            <h2>오류가 발생했습니다</h2>
            <p>{error}</p>
          </section>
        )}

        {analysisStatus === "completed" && result && (
          <>
            <ResultSummary result={result} />
            <DetailResultList details={result.details} />
            <GradCamViewer result={result} />
            <InfoSection />
          </>
        )}
      </main>
    </div>
  );
}

export default App;