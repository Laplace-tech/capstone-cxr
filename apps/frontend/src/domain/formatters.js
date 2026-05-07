// apps/frontend/src/domain/formatters.js

const PERCENT_DIGITS = 1;

export function clampNumber(value, min = 0, max = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(Math.max(numeric, min), max);
}

export function normalizeProbability(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric > 1) return clampNumber(numeric / 100);
  return clampNumber(numeric);
}

export function formatPercent(value, digits = PERCENT_DIGITS) {
  return `${(normalizeProbability(value) * 100).toFixed(digits)}%`;
}

export function formatProbabilityValue(value, digits = PERCENT_DIGITS) {
  return (normalizeProbability(value) * 100).toFixed(digits);
}

export function normalizeStatus(status) {
  const value = String(status || "idle").toLowerCase();

  if (["success", "done"].includes(value)) return "completed";
  if (["failure", "fail"].includes(value)) return "failed";

  if (["idle", "uploading", "queued", "processing", "completed", "failed", "error", "not_found"].includes(value)) {
    return value;
  }

  return "processing";
}

export function toUserMessage(error, fallback) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
