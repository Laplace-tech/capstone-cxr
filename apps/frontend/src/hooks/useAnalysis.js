// apps/frontend/src/hooks/useAnalysis.js

import { useCallback, useEffect, useRef } from "react";
import { createAnalysis, getAnalysisResult, getAnalysisStatus } from "../api/analysisApi";
import { normalizeAnalysisResult } from "../domain/analysisResultMapper";
import { createHistoryResult } from "../mock/demoResultFactory";
import { getHistoryItemById, isDemoAnalysisId } from "../mock/historyData";
import { normalizeStatus, toUserMessage } from "../domain/formatters";
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
    if (!pollingRef.current) return;
    clearInterval(pollingRef.current);
    pollingRef.current = null;
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const completeWithResult = useCallback(
    async (analysisId) => {
      try {
        const data = await getAnalysisResult(analysisId);
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
        const data = await getAnalysisStatus(analysisId);
        const status = normalizeStatus(data?.status);

        if (status === "completed") {
          setAnalysisStatus("processing");
          await completeWithResult(analysisId);
          return;
        }

        if (["failed", "error"].includes(status)) {
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
        // 일시적인 네트워크 오류는 polling을 유지한다.
        console.warn("[useAnalysis] polling failed", error);
        setAnalysisStatus((current) => (LOADING_STATUSES.has(current) ? current : "processing"));
      }
    },
    [completeWithResult, setAnalysisStatus, setError, stopPolling],
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
        const data = await createAnalysis(file);
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
      setError("");

      if (isDemoAnalysisId(analysisId)) {
        setAnalysisStatus("completed");
        setResult(createHistoryResult(getHistoryItemById(analysisId)));
        return;
      }

      setAnalysisStatus("processing");
      await completeWithResult(analysisId);
    },
    [completeWithResult, setAnalysisStatus, setError, setResult, setSelectedAnalysisId, stopPolling],
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
