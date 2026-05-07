// apps/frontend/src/api/analysisApi.js

import axiosClient from "./axiosClient";

export async function createAnalysis(file) {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await axiosClient.post("/analyses", formData);
  return data;
}

export async function getAnalysisStatus(analysisId) {
  const { data } = await axiosClient.get(`/analyses/${analysisId}`);
  return data;
}

export async function getAnalysisResult(analysisId) {
  const { data } = await axiosClient.get(`/analyses/${analysisId}/result`);
  return data;
}
