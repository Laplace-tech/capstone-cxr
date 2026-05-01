import { create } from "zustand";

export const useAnalysisStore = create((set) => ({
    analysisStatus: "loading",
    result: null,
    error: "",
    selectedAnalysisId: "analysis-001",

    setAnalysisStatus: (status) => set({ analysisStatus: status }),
    setResult: (result) => set({ result }),
    setError: (error) => set({ error }),
    setSelectedAnalysisId: (id) => set({ selectedAnalysisId: id }),
}));