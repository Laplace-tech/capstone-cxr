// apps/frontend/src/stores/analysisStore.js

import { create } from "zustand";

const initialState = {
  analysisStatus: "idle",
  result: null,
  error: "",
  selectedAnalysisId: "",
};

export const useAnalysisStore = create((set) => ({
  ...initialState,

  setAnalysisStatus: (status) => set({ analysisStatus: status || "idle" }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error: error || "" }),
  setSelectedAnalysisId: (id) => set({ selectedAnalysisId: id || "" }),
  resetAnalysisState: () => set(initialState),
}));
