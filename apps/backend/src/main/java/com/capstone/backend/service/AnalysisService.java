package com.capstone.backend.service;

import com.capstone.backend.dto.AiPredictResponse;
import com.capstone.backend.dto.AnalysisResultResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnalysisService {

    private final WebClient webClient;

    // AI 서버 주소를 application.properties에서 가져옴
    public AnalysisService(@Value("${ai.service.base-url}") String aiBaseUrl) {
        this.webClient = WebClient.builder()
            .baseUrl(aiBaseUrl)
            .build();
    }

    // AI 서버에 이미지 보내고 결과 받기
    public AiPredictResponse callAiPredict(MultipartFile image) throws Exception {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new ByteArrayResource(image.getBytes()) {
            @Override
            public String getFilename() {
                return image.getOriginalFilename();
            }
        }).contentType(MediaType.IMAGE_PNG);

        return webClient.post()
            .uri("/predict")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(builder.build()))
            .retrieve()
            .bodyToMono(AiPredictResponse.class)
            .block(); // 동기 방식으로 응답 기다리기
    }

    // AI 응답 → 프론트 응답으로 변환
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

        return AnalysisResultResponse.builder()
            .analysisId(analysisId)
            .status("completed")
            .modelVersion(aiResponse.getModelVersion())
            .labels(labels)
            .build();
    }
}
