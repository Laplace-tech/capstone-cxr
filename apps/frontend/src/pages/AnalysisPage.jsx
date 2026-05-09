// apps/frontend/src/pages/AnalysisPage.jsx

import { useState } from "react";
import Button from "../components/common/Button";
import { ResultSkeleton } from "../components/common/Skeleton";
import StatusBadge from "../components/common/StatusBadge";
import DetailResultList from "../components/result/DetailResultList";
import GradCamViewer from "../components/result/GradCamViewer";
import InfoSection from "../components/result/InfoSection";
import ResultSummary from "../components/result/ResultSummary";
import DragAndDropZone from "../components/upload/DragAndDropZone";
import { useAnalysis } from "../hooks/useAnalysis";

function AnalysisPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const { analysisStatus, result, error, selectedAnalysisId, isLoading, startAnalysis, reset } = useAnalysis();

  function handleAnalyze() {
    if (!selectedFile || isLoading) return;
    void startAnalysis(selectedFile);
  }

  function handleReset() {
    reset();
    setSelectedFile(null);
  }

  return (
    <div className="analysis-page">
      <section className="product-hero">
        <div>
          <span className="eyebrow">Chest X-ray Reading Assistant</span>
          <h2>흉부 X-ray 판독 보조 대시보드</h2>
          <p>
            DenseNet121 기반 다중 라벨 예측, 병변별 설명, Grad-CAM 근거 영상을 연결해 판독 검토 흐름을 한 화면에 정리
          </p>
        </div>
        <div className="workflow-steps" aria-label="analysis workflow">
          <span>Upload</span>
          <span>AI Analysis</span>
          <span>Clinical Review</span>
        </div>
      </section>

      <section className="state-card upload-card product-panel">
        <div className="upload-card-header">
          <div>
            <span className="eyebrow">New Study</span>
            <h2>X-ray 이미지 업로드</h2>
            <p>PNG 또는 JPEG 흉부 X-ray 이미지를 업로드해 AI 분석 시작</p>
          </div>
          <StatusBadge status={toBadgeStatus(analysisStatus)} />
        </div>

        <DragAndDropZone onFileSelect={setSelectedFile} disabled={isLoading} />

        <div className="action-row">
          <Button onClick={handleAnalyze} disabled={!selectedFile || isLoading} loading={isLoading}>
            {isLoading ? "분석 중..." : "분석 시작"}
          </Button>
          {analysisStatus !== "idle" && (
            <Button variant="secondary" onClick={handleReset} disabled={isLoading && analysisStatus === "uploading"}>
              초기화
            </Button>
          )}
        </div>

        {selectedAnalysisId && <p className="analysis-id-text">분석 ID: {selectedAnalysisId}</p>}
      </section>

      {isLoading && (
        <section className="state-card product-panel loading-panel" aria-live="polite">
          <h2>{statusMessage(analysisStatus)}</h2>
          <p>분석 완료 후 결과 화면 자동 표시</p>
          <ResultSkeleton />
        </section>
      )}

      {analysisStatus === "error" && (
        <section className="state-card error-card product-panel" aria-live="polite">
          <h2>오류 발생</h2>
          <p>{error}</p>
          <Button variant="secondary" onClick={handleReset}>
            다시 시도
          </Button>
        </section>
      )}

      {analysisStatus === "completed" && result && (
        <div className="result-dashboard">
          <ResultSummary result={result} />
          <GradCamViewer result={result} />
          <DetailResultList details={result.details} />
          <InfoSection />
        </div>
      )}
    </div>
  );
}

function toBadgeStatus(status) {
  if (status === "error") return "failed";
  return status || "idle";
}

function statusMessage(status) {
  if (status === "uploading") return "이미지 업로드 중...";
  if (status === "queued") return "분석 대기 중...";
  if (status === "processing") return "AI 분석 진행 중...";
  return "처리 중...";
}

export default AnalysisPage;
