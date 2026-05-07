package com.capstone.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
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

    @Getter
    @NoArgsConstructor
    public static class LabelResult {
        private String name;
        private double probability;
        private double threshold;
        private boolean prediction;
    }

    @Getter
    @NoArgsConstructor
    public static class GradcamPayload {
        private boolean available;

        @JsonProperty("overlay_path")
        private String overlayPath;
    }
}
