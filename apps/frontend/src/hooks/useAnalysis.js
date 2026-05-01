import { useState, useRef, useCallback } from "react";
import { useAnalysisStore } from "../stores/analysisStore";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

export function useAnalysis() {
  const {
    analysisStatus,
    result,
    error,
    setAnalysisStatus,
    setResult,
    setError,
    setSelectedAnalysisId,
  } = useAnalysisStore();

  const pollingRef = useRef(null);
  const startedAtRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchResult = useCallback(async (id) => {
    try {
      const response = await fetch(`/api/v1/analyses/${id}/result`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setResult({
        id: data.analysisId,
        modelVersion: data.modelVersion,
        predictionSummary: {
          positiveLabels: data.labels?.filter(l => l.prediction).map(l => l.name) || [],
          totalCount: data.labels?.length || 0,
        },
        details: data.labels?.map(l => ({
          name: l.name,
          probability: l.probability,
          result: l.prediction ? "POSITIVE" : "NEGATIVE",
        })) || [],
        gradCamUrl: data.gradcam?.available ? `/api/v1/files/${data.analysisId}/gradcam` : "",
        originalImage: `/api/v1/files/${data.analysisId}/original`,
      });
      setAnalysisStatus("completed");
      stopPolling();
    } catch {
      setAnalysisStatus("error");
      setError("결과를 불러오는 데 실패했어요.");
      stopPolling();
    }
  }, [setResult, setAnalysisStatus, setError, stopPolling]);

  const startPolling = useCallback((id) => {
    startedAtRef.current = Date.now();
    pollingRef.current = setInterval(async () => {
      if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
        setAnalysisStatus("error");
        setError("분석 시간이 초과됐어요. 다시 시도해 주세요.");
        stopPolling();
        return;
      }
      try {
        const response = await fetch(`/api/v1/analyses/${id}`);
        if (!response.ok) return;
        const data = await response.json();
        const status = data.status?.toLowerCase();
        if (status === "completed") {
          setAnalysisStatus("processing");
          await fetchResult(id);
        } else if (status === "failed") {
          setAnalysisStatus("error");
          setError("분석에 실패했어요.");
          stopPolling();
        } else if (status === "processing") {
          setAnalysisStatus("processing");
        } else {
          setAnalysisStatus("queued");
        }
      } catch {
        // 네트워크 오류 무시
      }
    }, POLL_INTERVAL_MS);
  }, [fetchResult, setAnalysisStatus, setError, stopPolling]);

  const startAnalysis = useCallback(async (file) => {
    if (!file) return;
    stopPolling();
    setAnalysisStatus("uploading");
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/v1/analyses", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const id = data.analysisId;
      setSelectedAnalysisId(id);
      setAnalysisStatus("queued");
      startPolling(id);
    } catch {
      setAnalysisStatus("error");
      setError("업로드에 실패했어요. 다시 시도해 주세요.");
    }
  }, [startPolling, stopPolling, setAnalysisStatus, setError, setResult, setSelectedAnalysisId]);

  const reset = useCallback(() => {
    stopPolling();
    setAnalysisStatus("idle");
    setResult(null);
    setError("");
  }, [stopPolling, setAnalysisStatus, setResult, setError]);

  return {
    analysisStatus,
    result,
    error,
    startAnalysis,
    reset,
  };
}