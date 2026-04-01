package com.capstone.backend.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class AnalysisResultResponse {

    private String analysisId;
    private String status;
    private String modelVersion;
    private List<LabelResult> labels;

    @Getter
    @Builder
    public static class LabelResult {
        private String name;
        private double probability;
        private double threshold;
        private boolean prediction;
    }
}
