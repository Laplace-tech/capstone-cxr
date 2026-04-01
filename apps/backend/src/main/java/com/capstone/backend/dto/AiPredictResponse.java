package com.capstone.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class AiPredictResponse {

    @JsonProperty("model_version")
    private String modelVersion;

    @JsonProperty("image_size")
    private int imageSize;

    @JsonProperty("label_order")
    private List<String> labelOrder;

    private List<LabelResult> labels;

    @Getter
    @NoArgsConstructor
    public static class LabelResult {
        private String name;
        private double probability;
        private double threshold;
        private boolean prediction;
    }
}
