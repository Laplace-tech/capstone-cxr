import { useEffect } from "react";
import { analysisResults } from "../mock/analysisResults";
import { useAnalysisStore } from "../stores/analysisStore";

export function useAnalysis() {
    const {
        analysisStatus,
        result,
        error,
        selectedAnalysisId,
        setAnalysisStatus,
        setResult,
        setError,
    } = useAnalysisStore();

    const mapAnalysisResult = (data) => {
        return {
        id: data.id,
        modelVersion: data.modelVersion,
        predictionSummary: {
            positiveLabels: data.predictionSummary?.positiveLabels || [],
            totalCount: data.predictionSummary?.totalCount || 0,
        },
        details: data.details || [],
        gradCamUrl: data.gradCamUrl || "",
        originalImage: data.originalImage || "",
        };
    };

    useEffect(() => {
        const fetchAnalysisResult = async () => {
        try {
            setAnalysisStatus("loading");
            setError("");

            // 나중에 실제 API 연결 시 교체
            // const response = await fetch(`/api/v1/analyses/${selectedAnalysisId}/result`);
            // if (!response.ok) throw new Error(`HTTP ${response.status}`);
            // const rawData = await response.json();

            const rawData = analysisResults[selectedAnalysisId];

            if (!rawData) {
            throw new Error("해당 분석 결과를 찾을 수 없습니다.");
            }

            const mappedData = mapAnalysisResult(rawData);
            setResult(mappedData);
            setAnalysisStatus("completed");
        } catch (err) {
            setError(err.message || "결과를 불러오지 못했습니다.");
            setAnalysisStatus("error");
        }
        };

        fetchAnalysisResult();
    }, [selectedAnalysisId, setAnalysisStatus, setError, setResult]);

    return {
        analysisStatus,
        result,
        error,
        selectedAnalysisId,
    };
}