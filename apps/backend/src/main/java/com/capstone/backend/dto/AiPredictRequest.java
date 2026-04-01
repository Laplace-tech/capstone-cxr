package com.capstone.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AiPredictRequest {

    @JsonProperty("analysis_id")
    private String analysisId;

    @JsonProperty("image_path")
    private String imagePath;

    @JsonProperty("include_gradcam")
    private boolean includeGradcam;

    // 생성자 직접 작성
    public AiPredictRequest(String analysisId, String imagePath, boolean includeGradcam) {
        this.analysisId = analysisId;
        this.imagePath = imagePath;
        this.includeGradcam = includeGradcam;
    }

    public String getAnalysisId() { return analysisId; }
    public String getImagePath() { return imagePath; }
    public boolean isIncludeGradcam() { return includeGradcam; }
}
