export const analysisResults = {
    "analysis-001": {
        id: "analysis-001",
        modelVersion: "baseline_01_run_20260321_125758",
        predictionSummary: {
        positiveLabels: ["Atelectasis", "Cardiomegaly", "Edema"],
        totalCount: 3,
        },
        details: [
        { name: "Atelectasis", probability: 73.4, result: "POSITIVE" },
        { name: "Cardiomegaly", probability: 81.2, result: "POSITIVE" },
        { name: "Consolidation", probability: 42.8, result: "NEGATIVE" },
        { name: "Edema", probability: 77.6, result: "POSITIVE" },
        { name: "Pleural Effusion", probability: 35.1, result: "NEGATIVE" },
        ],
        gradCamUrl: "",
        originalImage:
        "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=800&q=80",
    },

    "analysis-002": {
        id: "analysis-002",
        modelVersion: "baseline_01_run_20260322_101500",
        predictionSummary: {
        positiveLabels: [],
        totalCount: 0,
        },
        details: [
        { name: "Atelectasis", probability: 18.2, result: "NEGATIVE" },
        { name: "Cardiomegaly", probability: 21.7, result: "NEGATIVE" },
        { name: "Consolidation", probability: 15.4, result: "NEGATIVE" },
        { name: "Edema", probability: 12.9, result: "NEGATIVE" },
        { name: "Pleural Effusion", probability: 9.8, result: "NEGATIVE" },
        ],
        gradCamUrl: "",
        originalImage:
        "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=800&q=80",
    },

    "analysis-003": {
        id: "analysis-003",
        modelVersion: "baseline_01_run_20260323_143210",
        predictionSummary: {
        positiveLabels: ["Pleural Effusion"],
        totalCount: 1,
        },
        details: [
        { name: "Atelectasis", probability: 24.1, result: "NEGATIVE" },
        { name: "Cardiomegaly", probability: 28.3, result: "NEGATIVE" },
        { name: "Consolidation", probability: 33.2, result: "NEGATIVE" },
        { name: "Edema", probability: 41.0, result: "NEGATIVE" },
        { name: "Pleural Effusion", probability: 78.5, result: "POSITIVE" },
        ],
        gradCamUrl: "",
        originalImage:
        "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=800&q=80",
    },
};