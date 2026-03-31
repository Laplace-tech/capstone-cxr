import { useState } from "react";
import ResultSummary from "../components/result/ResultSummary";
import DetailResultList from "../components/result/DetailResultList";
import GradCamViewer from "../components/result/GradCamViewer";
import InfoSection from "../components/result/InfoSection";
import DragAndDropZone from "../components/upload/DragAndDropZone";
import Button from "../components/common/Button";
import StatusBadge from "../components/common/StatusBadge";
import { ResultSkeleton } from "../components/common/Skeleton";

function AnalysisPage({ analysisStatus, result, error }) {
  const [selectedFile, setSelectedFile] = useState(null);

  function handleAnalyze() {
    if (!selectedFile) return;
    // TODO: 백엔드 연동 시 여기서 실제 API 호출
    alert("업로드 기능은 백엔드 연동 후 활성화됩니다.");
  }

  return (
    <div className="analysis-page">

      {/* ── 업로드 영역 (A파트) ── */}
      <section className="state-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>X-ray 이미지 업로드</h2>
          <StatusBadge status={
            analysisStatus === "loading"   ? "processing" :
            analysisStatus === "completed" ? "completed"  :
            analysisStatus === "error"     ? "failed"     : "idle"
          } />
        </div>
        <DragAndDropZone onFileSelect={setSelectedFile} />
        <div style={{ marginTop: "1rem" }}>
          <Button onClick={handleAnalyze} disabled={!selectedFile}>
            분석 시작
          </Button>
        </div>
      </section>

      {/* ── 로딩 ── */}
      {analysisStatus === "loading" && (
        <section className="state-card">
          <h2>분석 결과를 불러오는 중입니다...</h2>
          <ResultSkeleton />
        </section>
      )}

      {/* ── 에러 ── */}
      {analysisStatus === "error" && (
        <section className="state-card error-card">
          <h2>오류가 발생했습니다</h2>
          <p>{error}</p>
        </section>
      )}

      {/* ── 결과 (B파트) ── */}
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