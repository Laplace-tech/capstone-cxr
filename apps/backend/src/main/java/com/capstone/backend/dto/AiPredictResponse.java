package com.capstone.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class AiPredictResponse {

    @JsonProperty("analysis_id")
    private String analysisId;

    private String status;

    @JsonProperty("model_version")
    private String modelVersion;

    @JsonProperty("threshold_version")
    private String thresholdVersion;

    @JsonProperty("image_size")
    private int imageSize;

    @JsonProperty("label_order")
    private List<String> labelOrder;

    private List<LabelResult> labels;

    private GradcamPayload gradcam;

    // Getter 직접 작성
    public String getAnalysisId() { return analysisId; }
    public String getStatus() { return status; }
    public String getModelVersion() { return modelVersion; }
    public String getThresholdVersion() { return thresholdVersion; }
    public int getImageSize() { return imageSize; }
    public List<String> getLabelOrder() { return labelOrder; }
    public List<LabelResult> getLabels() { return labels; }
    public GradcamPayload getGradcam() { return gradcam; }

    public static class LabelResult {
        private String name;
        private double probability;
        private double threshold;
        private boolean prediction;

        public String getName() { return name; }
        public double getProbability() { return probability; }
        public double getThreshold() { return threshold; }
        public boolean isPrediction() { return prediction; }
    }

    public static class GradcamPayload {
        private boolean available;

        @JsonProperty("overlay_path")
        private String overlayPath;

        public boolean isAvailable() { return available; }
        public String getOverlayPath() { return overlayPath; }
    }
}
