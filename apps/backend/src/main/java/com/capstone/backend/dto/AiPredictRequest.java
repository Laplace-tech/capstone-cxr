package com.capstone.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AiPredictRequest {

    @JsonProperty("analysis_id")
    private String analysisId;

    @JsonProperty("image_path")
    private String imagePath;

    @JsonProperty("include_gradcam")
    private boolean includeGradcam;
}
