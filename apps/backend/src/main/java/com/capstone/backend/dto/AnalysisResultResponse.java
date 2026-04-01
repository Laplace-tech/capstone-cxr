package com.capstone.backend.dto;

import java.util.List;

public class AnalysisResultResponse {

    private String analysisId;
    private String status;
    private String modelVersion;
    private String thresholdVersion;
    private List<LabelResult> labels;
    private GradcamPayload gradcam;

    // Builder 패턴 직접 구현
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String analysisId;
        private String status;
        private String modelVersion;
        private String thresholdVersion;
        private List<LabelResult> labels;
        private GradcamPayload gradcam;

        public Builder analysisId(String v) { this.analysisId = v; return this; }
        public Builder status(String v) { this.status = v; return this; }
        public Builder modelVersion(String v) { this.modelVersion = v; return this; }
        public Builder thresholdVersion(String v) { this.thresholdVersion = v; return this; }
        public Builder labels(List<LabelResult> v) { this.labels = v; return this; }
        public Builder gradcam(GradcamPayload v) { this.gradcam = v; return this; }

        public AnalysisResultResponse build() {
            AnalysisResultResponse r = new AnalysisResultResponse();
            r.analysisId = this.analysisId;
            r.status = this.status;
            r.modelVersion = this.modelVersion;
            r.thresholdVersion = this.thresholdVersion;
            r.labels = this.labels;
            r.gradcam = this.gradcam;
            return r;
        }
    }

    // Getter
    public String getAnalysisId() { return analysisId; }
    public String getStatus() { return status; }
    public String getModelVersion() { return modelVersion; }
    public String getThresholdVersion() { return thresholdVersion; }
    public List<LabelResult> getLabels() { return labels; }
    public GradcamPayload getGradcam() { return gradcam; }

    // LabelResult
    public static class LabelResult {
        private String name;
        private double probability;
        private double threshold;
        private boolean prediction;

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private String name;
            private double probability;
            private double threshold;
            private boolean prediction;

            public Builder name(String v) { this.name = v; return this; }
            public Builder probability(double v) { this.probability = v; return this; }
            public Builder threshold(double v) { this.threshold = v; return this; }
            public Builder prediction(boolean v) { this.prediction = v; return this; }

            public LabelResult build() {
                LabelResult r = new LabelResult();
                r.name = this.name;
                r.probability = this.probability;
                r.threshold = this.threshold;
                r.prediction = this.prediction;
                return r;
            }
        }

        public String getName() { return name; }
        public double getProbability() { return probability; }
        public double getThreshold() { return threshold; }
        public boolean isPrediction() { return prediction; }
    }

    // GradcamPayload
    public static class GradcamPayload {
        private boolean available;
        private String overlayPath;

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private boolean available;
            private String overlayPath;

            public Builder available(boolean v) { this.available = v; return this; }
            public Builder overlayPath(String v) { this.overlayPath = v; return this; }

            public GradcamPayload build() {
                GradcamPayload g = new GradcamPayload();
                g.available = this.available;
                g.overlayPath = this.overlayPath;
                return g;
            }
        }

        public boolean isAvailable() { return available; }
        public String getOverlayPath() { return overlayPath; }
    }
}
