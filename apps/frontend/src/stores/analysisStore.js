// apps/frontend/src/stores/analysisStore.js

import { create } from "zustand";

export const useAnalysisStore = create((set) => ({
  analysisStatus: "idle",
  result: null,
  error: "",
  selectedAnalysisId: "",

  setAnalysisStatus: (status) => set({ analysisStatus: status }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  setSelectedAnalysisId: (id) => set({ selectedAnalysisId: id || "" }),
}));
