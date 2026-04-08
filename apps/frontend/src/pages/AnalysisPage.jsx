import { useState } from "react";
import ResultSummary from "../components/result/ResultSummary";
import DetailResultList from "../components/result/DetailResultList";
import GradCamViewer from "../components/result/GradCamViewer";
import InfoSection from "../components/result/InfoSection";
import DragAndDropZone from "../components/upload/DragAndDropZone";
import Button from "../components/common/Button";
import StatusBadge from "../components/common/StatusBadge";
import { ResultSkeleton } from "../components/common/Skeleton";
import { useAnalysis } from "../hooks/useAnalysis";

function AnalysisPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const { analysisStatus, result, error, startAnalysis, reset } = useAnalysis();
  const isLoading = ["uploading", "queued", "processing"].includes(analysisStatus);

  function handleAnalyze() {
    if (!selectedFile) return;
    startAnalysis(selectedFile);
  }

  function handleReset() {
    reset();
    setSelectedFile(null);
  }

  return (
    <div className="analysis-page">
      <section className="state-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>X-ray 이미지 업로드</h2>
          <StatusBadge status={
            analysisStatus === "uploading"  ? "uploading"  :
            analysisStatus === "queued"     ? "queued"     :
            analysisStatus === "processing" ? "processing" :
            analysisStatus === "completed"  ? "completed"  :
            analysisStatus === "error"      ? "failed"     : "idle"
          } />
        </div>
        <DragAndDropZone onFileSelect={setSelectedFile} />
        <div style={{ marginTop: "1rem", display: "flex", gap: "8px" }}>
          <Button onClick={handleAnalyze} disabled={!selectedFile || isLoading} loading={isLoading}>
            {isLoading ? "분석 중..." : "분석 시작"}
          </Button>
          {analysisStatus !== "idle" && (
            <Button variant="secondary" onClick={handleReset}>초기화</Button>
          )}
        </div>
      </section>

      {isLoading && (
        <section className="state-card">
          <h2>
            {analysisStatus === "uploading" && "이미지 업로드 중..."}
            {analysisStatus === "queued" && "분석 대기 중..."}
            {analysisStatus === "processing" && "AI가 분석 중입니다..."}
          </h2>
          <ResultSkeleton />
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
    </div>
  );
}

export default AnalysisPage;