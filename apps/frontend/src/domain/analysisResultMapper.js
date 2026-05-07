// apps/frontend/src/domain/analysisResultMapper.js

import { CONDITION_ORDER } from "./conditionInfo";
import { normalizeProbability, normalizeStatus } from "./formatters";

export function normalizeAnalysisResult(data, fallbackId) {
  const analysisId = data?.analysisId || data?.analysis_id || data?.id || fallbackId || "";
  const details = extractLabels(data).map(normalizeLabelResult);
  const positiveDetails = details.filter((item) => item.predicted);
  const gradcamAvailable = hasGradcam(data);
  const cacheKey = Date.now();

  return {
    id: analysisId,
    status: normalizeStatus(data?.status || "completed"),
    modelVersion: data?.modelVersion || data?.model_version || "-",
    thresholdVersion: data?.thresholdVersion || data?.threshold_version || "-",
    predictionSummary: {
      positiveLabels: positiveDetails.map((item) => item.name),
      positiveCount: positiveDetails.length,
      totalCount: details.length,
    },
    details,
    topFinding: getTopFinding(details),
    originalImage: analysisId ? `/api/v1/files/${analysisId}/original?t=${cacheKey}` : "",
    gradCamUrl: analysisId && gradcamAvailable ? `/api/v1/files/${analysisId}/gradcam?t=${cacheKey}` : "",
    raw: data,
  };
}

export function normalizeLabelResult(item) {
  const name = item?.name || item?.label || item?.className || item?.condition || "Unknown";
  const probability = normalizeProbability(
    item?.probability ?? item?.prob ?? item?.score ?? item?.value ?? 0,
  );
  const threshold = normalizeProbability(item?.threshold ?? item?.cutoff ?? 0.5, 0.5);
  const predicted = normalizePrediction(item, probability, threshold);

  return {
    name,
    probability,
    threshold,
    predicted,
    result: predicted ? "POSITIVE" : "NEGATIVE",
  };
}

export function getTopFinding(details = []) {
  if (!details.length) return null;
  return [...details].sort((a, b) => b.probability - a.probability)[0];
}

function extractLabels(data) {
  if (Array.isArray(data?.labels)) return data.labels;
  if (Array.isArray(data?.predictions)) return data.predictions;
  if (Array.isArray(data?.results)) return data.results;

  if (data?.predictionResults && typeof data.predictionResults === "object") {
    return CONDITION_ORDER.map((label) => ({ label, ...data.predictionResults[label] })).filter(Boolean);
  }

  return [];
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

function hasGradcam(data) {
  return Boolean(
    data?.gradcam?.available ??
      data?.gradCam?.available ??
      data?.gradcamAvailable ??
      data?.grad_cam_available ??
      data?.gradcamUrl ??
      data?.gradCamUrl,
  );
}
