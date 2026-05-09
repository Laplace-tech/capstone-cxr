// apps/frontend/src/mock/demoResultFactory.js

import { getHistoryItemById } from "./historyData";

const RESULT_PRESETS = {
  "analysis-demo-001": {
    details: [
      { name: "Atelectasis", probability: 0.556, threshold: 0.46, predicted: true },
      { name: "Cardiomegaly", probability: 0.068, threshold: 0.11, predicted: false },
      { name: "Consolidation", probability: 0.452, threshold: 0.47, predicted: false },
      { name: "Edema", probability: 0.227, threshold: 0.34, predicted: false },
      { name: "Pleural Effusion", probability: 0.815, threshold: 0.37, predicted: true },
    ],
  },
  "analysis-demo-002": {
    details: [
      { name: "Atelectasis", probability: 0.214, threshold: 0.46, predicted: false },
      { name: "Cardiomegaly", probability: 0.684, threshold: 0.11, predicted: true },
      { name: "Consolidation", probability: 0.194, threshold: 0.47, predicted: false },
      { name: "Edema", probability: 0.281, threshold: 0.34, predicted: false },
      { name: "Pleural Effusion", probability: 0.306, threshold: 0.37, predicted: false },
    ],
  },
  "analysis-demo-003": {
    details: [
      { name: "Atelectasis", probability: 0.556, threshold: 0.46, predicted: true },
      { name: "Cardiomegaly", probability: 0.084, threshold: 0.11, predicted: false },
      { name: "Consolidation", probability: 0.238, threshold: 0.47, predicted: false },
      { name: "Edema", probability: 0.221, threshold: 0.34, predicted: false },
      { name: "Pleural Effusion", probability: 0.316, threshold: 0.37, predicted: false },
    ],
  },
  "analysis-demo-004": {
    details: [
      { name: "Atelectasis", probability: 0.386, threshold: 0.46, predicted: false },
      { name: "Cardiomegaly", probability: 0.126, threshold: 0.11, predicted: true },
      { name: "Consolidation", probability: 0.719, threshold: 0.47, predicted: true },
      { name: "Edema", probability: 0.372, threshold: 0.34, predicted: true },
      { name: "Pleural Effusion", probability: 0.334, threshold: 0.37, predicted: false },
    ],
  },
};

export function createDemoAnalysisResult({ analysisId, file, originalImage } = {}) {
  const id = analysisId || `demo-${Date.now()}`;
  const historyItem = getHistoryItemById(id);
  const preset = RESULT_PRESETS[id] || RESULT_PRESETS["analysis-demo-001"];
  const details = preset.details.map(normalizeDetail);
  const positiveDetails = details.filter((item) => item.predicted);
  const objectUrl = file instanceof File ? URL.createObjectURL(file) : "";

  return {
    id,
    status: "completed",
    modelVersion: historyItem?.modelVersion || "best",
    thresholdVersion: historyItem?.thresholdVersion || "f1",
    predictionSummary: {
      positiveLabels: positiveDetails.map((item) => item.name),
      positiveCount: positiveDetails.length,
      totalCount: details.length,
    },
    details,
    topFinding: getTopFinding(details),
    originalImage: originalImage || historyItem?.originalImageUrl || objectUrl || "",
    gradCamUrl: historyItem?.gradcamImageUrl || "",
    caseMeta: historyItem || null,
    isDemoFallback: true,
  };
}

export function createHistoryResult(historyItem) {
  return createDemoAnalysisResult({ analysisId: historyItem?.id });
}

function normalizeDetail(item) {
  const predicted = item.predicted ?? item.result === "POSITIVE";

  return {
    name: item.name,
    probability: normalizeProbability(item.probability),
    threshold: normalizeProbability(item.threshold, 0.5),
    predicted,
    result: predicted ? "POSITIVE" : "NEGATIVE",
  };
}

function normalizeProbability(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric > 1) return Math.min(Math.max(numeric / 100, 0), 1);
  return Math.min(Math.max(numeric, 0), 1);
}

function getTopFinding(details) {
  if (!details.length) return null;
  return [...details].sort((a, b) => b.probability - a.probability)[0];
}
