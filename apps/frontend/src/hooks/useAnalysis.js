// apps/frontend/src/hooks/useAnalysis.js

import { useCallback, useEffect, useRef } from "react";
import axiosClient from "../api/axiosClient";
import { useAnalysisStore } from "../stores/analysisStore";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 180000;

const TERMINAL_STATUSES = new Set(["completed", "failed", "error", "not_found"]);
const LOADING_STATUSES = new Set(["uploading", "queued", "processing"]);

export function useAnalysis() {
  const {
    analysisStatus,
    result,
    error,
    selectedAnalysisId,
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

  useEffect(() => stopPolling, [stopPolling]);

  const fetchResult = useCallback(
    async (analysisId) => {
      try {
        const { data } = await axiosClient.get(`/analyses/${analysisId}/result`);
        const normalized = normalizeAnalysisResult(data, analysisId);

        setResult(normalized);
        setSelectedAnalysisId(normalized.id);
        setAnalysisStatus("completed");
        setError("");
        stopPolling();

        return normalized;
      } catch (error) {
        setAnalysisStatus("error");
        setError(toUserMessage(error, "결과를 불러오는 데 실패했습니다."));
        stopPolling();
        return null;
      }
    },
    [setAnalysisStatus, setError, setResult, setSelectedAnalysisId, stopPolling],
  );

  const pollOnce = useCallback(
    async (analysisId) => {
      if (!analysisId) return;

      if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
        setAnalysisStatus("error");
        setError("분석 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
        stopPolling();
        return;
      }

      try {
        const { data } = await axiosClient.get(`/analyses/${analysisId}`);
        const status = normalizeStatus(data?.status);

        if (status === "completed") {
          setAnalysisStatus("processing");
          await fetchResult(analysisId);
          return;
        }

        if (status === "failed" || status === "error") {
          setAnalysisStatus("error");
          setError(data?.error || data?.message || "AI 분석에 실패했습니다.");
          stopPolling();
          return;
        }

        if (status === "not_found") {
          setAnalysisStatus("error");
          setError("분석 요청을 찾을 수 없습니다.");
          stopPolling();
          return;
        }

        setAnalysisStatus(status);
      } catch (error) {
        // 일시적인 네트워크 오류는 polling을 유지한다. 단, 사용자는 처리 중 상태를 보게 한다.
        console.warn("[useAnalysis] polling failed", error);
        setAnalysisStatus((current) => (LOADING_STATUSES.has(current) ? current : "processing"));
      }
    },
    [fetchResult, setAnalysisStatus, setError, stopPolling],
  );

  const startPolling = useCallback(
    (analysisId) => {
      stopPolling();
      startedAtRef.current = Date.now();
      void pollOnce(analysisId);
      pollingRef.current = setInterval(() => {
        void pollOnce(analysisId);
      }, POLL_INTERVAL_MS);
    },
    [pollOnce, stopPolling],
  );

  const startAnalysis = useCallback(
    async (file) => {
      if (!file) {
        setError("분석할 이미지를 먼저 선택해 주세요.");
        return;
      }

      stopPolling();
      setAnalysisStatus("uploading");
      setError("");
      setResult(null);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axiosClient.post("/analyses", formData);
        const analysisId = data?.analysisId || data?.analysis_id || data?.id;

        if (!analysisId) {
          throw new Error("분석 ID가 응답에 없습니다.");
        }

        setSelectedAnalysisId(analysisId);
        setAnalysisStatus(normalizeStatus(data?.status || "queued"));
        startPolling(analysisId);
      } catch (error) {
        setAnalysisStatus("error");
        setError(toUserMessage(error, "업로드에 실패했습니다. 다시 시도해 주세요."));
      }
    },
    [setAnalysisStatus, setError, setResult, setSelectedAnalysisId, startPolling, stopPolling],
  );

  const loadExistingResult = useCallback(
    async (analysisId) => {
      if (!analysisId) return;
      stopPolling();
      setSelectedAnalysisId(analysisId);
      setAnalysisStatus("processing");
      setError("");
      await fetchResult(analysisId);
    },
    [fetchResult, setAnalysisStatus, setError, setSelectedAnalysisId, stopPolling],
  );

  const reset = useCallback(() => {
    stopPolling();
    setAnalysisStatus("idle");
    setResult(null);
    setError("");
    setSelectedAnalysisId("");
  }, [setAnalysisStatus, setError, setResult, setSelectedAnalysisId, stopPolling]);

  return {
    analysisStatus,
    result,
    error,
    selectedAnalysisId,
    isLoading: LOADING_STATUSES.has(analysisStatus),
    isTerminal: TERMINAL_STATUSES.has(analysisStatus),
    startAnalysis,
    loadExistingResult,
    reset,
  };
}

function normalizeAnalysisResult(data, fallbackId) {
  const analysisId = data?.analysisId || data?.analysis_id || data?.id || fallbackId;
  const rawLabels = data?.labels || data?.predictions || data?.results || [];
  const details = rawLabels.map(normalizeLabelResult);
  const positiveLabels = details
    .filter((item) => item.predicted)
    .map((item) => item.name);

  const gradcamAvailable = Boolean(
    data?.gradcam?.available ??
      data?.gradCam?.available ??
      data?.gradcamAvailable ??
      data?.grad_cam_available ??
      data?.gradcamUrl ??
      data?.gradCamUrl,
  );

  const cacheKey = Date.now();

  return {
    id: analysisId,
    status: normalizeStatus(data?.status || "completed"),
    modelVersion: data?.modelVersion || data?.model_version || "-",
    thresholdVersion: data?.thresholdVersion || data?.threshold_version || "-",
    predictionSummary: {
      positiveLabels,
      positiveCount: positiveLabels.length,
      totalCount: details.length,
    },
    details,
    originalImage: analysisId ? `/api/v1/files/${analysisId}/original?t=${cacheKey}` : "",
    gradCamUrl:
      analysisId && gradcamAvailable
        ? `/api/v1/files/${analysisId}/gradcam?t=${cacheKey}`
        : "",
    raw: data,
  };
}

function normalizeLabelResult(item) {
  const name = item?.name || item?.label || item?.className || item?.condition || "Unknown";
  const probability = normalizeProbability(
    item?.probability ?? item?.prob ?? item?.score ?? item?.value ?? 0,
  );
  const threshold = normalizeProbability(item?.threshold ?? item?.cutoff ?? 0.5);
  const predicted = normalizePrediction(item, probability, threshold);

  return {
    name,
    probability,
    threshold,
    predicted,
    result: predicted ? "POSITIVE" : "NEGATIVE",
  };
}

function normalizeProbability(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric > 1) return clamp(numeric / 100, 0, 1);
  return clamp(numeric, 0, 1);
}

function normalizePrediction(item, probability, threshold) {
  if (typeof item?.prediction === "boolean") return item.prediction;
  if (typeof item?.predicted === "boolean") return item.predicted;
  if (typeof item?.isPositive === "boolean") return item.isPositive;

  const text = String(item?.prediction ?? item?.result ?? item?.status ?? "").toLowerCase();
  if (["positive", "pos", "1", "true"].includes(text)) return true;
  if (["negative", "neg", "0", "false"].includes(text)) return false;

  return probability >= threshold;
}

function normalizeStatus(status) {
  const value = String(status || "idle").toLowerCase();
  if (value === "success" || value === "done") return "completed";
  if (value === "failure") return "failed";
  if (["idle", "uploading", "queued", "processing", "completed", "failed", "error", "not_found"].includes(value)) {
    return value;
  }
  return "processing";
}

function toUserMessage(error, fallback) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
