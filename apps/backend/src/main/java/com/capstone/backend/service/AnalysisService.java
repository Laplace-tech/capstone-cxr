package com.capstone.backend.service;

import com.capstone.backend.domain.Analysis;
import com.capstone.backend.dto.AiPredictRequest;
import com.capstone.backend.dto.AiPredictResponse;
import com.capstone.backend.dto.AnalysisResultResponse;
import com.capstone.backend.repository.AnalysisRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnalysisService {

    private final WebClient webClient;

    @Autowired
    private AnalysisRepository analysisRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public AnalysisService(@Value("${ai.service.base-url}") String aiBaseUrl) {
        this.webClient = WebClient.builder()
            .baseUrl(aiBaseUrl)
            .build();
    }

    // 분석 요청 초기 저장
    public Analysis createAnalysis(String analysisId, String imagePath) {
        Analysis analysis = new Analysis(analysisId, "queued", imagePath);
        return analysisRepository.save(analysis);
    }

    // 상태 업데이트
    public void updateStatus(String analysisId, String status) {
        analysisRepository.findById(analysisId).ifPresent(analysis -> {
            analysis.setStatus(status);
            analysisRepository.save(analysis);
        });
    }

    // AI 서버 호출 + 결과 저장 (비동기)
    @Async
    public void processAnalysis(String analysisId, String imagePath) {
        try {
            // 1. 상태 processing으로 변경
            updateStatus(analysisId, "processing");

            // 2. AI 서버 호출
            AiPredictRequest request = new AiPredictRequest(
                analysisId, imagePath, true);

            AiPredictResponse aiResponse = webClient.post()
                .uri("/predict")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiPredictResponse.class)
                .block();

            // 3. 결과 DB 저장
            saveResult(analysisId, aiResponse);

        } catch (Exception e) {
            // AI 호출 실패
            updateStatus(analysisId, "failed");
        }
    }

    // AI 응답 DB 저장
    public void saveResult(String analysisId, AiPredictResponse aiResponse) {
        analysisRepository.findById(analysisId).ifPresent(analysis -> {
            try {
                String resultJson = objectMapper.writeValueAsString(aiResponse);
                analysis.setResultJson(resultJson);
                analysis.setModelVersion(aiResponse.getModelVersion());
                analysis.setThresholdVersion(aiResponse.getThresholdVersion());
                analysis.setStatus("completed");
                analysisRepository.save(analysis);
            } catch (Exception e) {
                analysis.setStatus("failed");
                analysisRepository.save(analysis);
            }
        });
    }

    // DB에서 결과 조회 → 프론트 응답으로 변환
    public AnalysisResultResponse getResult(String analysisId) {
        Analysis analysis = analysisRepository.findById(analysisId)
            .orElse(null);

        if (analysis == null || analysis.getResultJson() == null) {
            return null;
        }

        try {
            AiPredictResponse aiResponse = objectMapper
                .readValue(analysis.getResultJson(), AiPredictResponse.class);
            return convertToResult(analysisId, aiResponse);
        } catch (Exception e) {
            return null;
        }
    }

    // AI 응답 → 프론트 응답 변환
    public AnalysisResultResponse convertToResult(
        String analysisId,
        AiPredictResponse aiResponse) {

        List<AnalysisResultResponse.LabelResult> labels = aiResponse.getLabels()
            .stream()
            .map(label -> AnalysisResultResponse.LabelResult.builder()
                .name(label.getName())
                .probability(label.getProbability())
                .threshold(label.getThreshold())
                .prediction(label.isPrediction())
                .build())
            .collect(Collectors.toList());

        AnalysisResultResponse.GradcamPayload gradcam =
            AnalysisResultResponse.GradcamPayload.builder()
                .available(aiResponse.getGradcam().isAvailable())
                .overlayPath(aiResponse.getGradcam().getOverlayPath())
                .build();

        return AnalysisResultResponse.builder()
            .analysisId(analysisId)
            .status("completed")
            .modelVersion(aiResponse.getModelVersion())
            .thresholdVersion(aiResponse.getThresholdVersion())
            .labels(labels)
            .gradcam(gradcam)
            .build();
    }
}
