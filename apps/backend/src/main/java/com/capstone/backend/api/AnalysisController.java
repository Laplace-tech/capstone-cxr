package com.capstone.backend.api;

import com.capstone.backend.domain.Analysis;
import com.capstone.backend.dto.AiPredictResponse;
import com.capstone.backend.dto.AnalysisResultResponse;
import com.capstone.backend.repository.AnalysisRepository;
import com.capstone.backend.service.AnalysisService;
import com.capstone.backend.service.ImageStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analyses")
public class AnalysisController {

    @Autowired
    private AnalysisService analysisService;

    @Autowired
    private ImageStorageService imageStorageService;

    @Autowired
    private AnalysisRepository analysisRepository;

    // ① 분석 요청
    @PostMapping
    public ResponseEntity<Map<String, String>> createAnalysis(
        @RequestParam("image") MultipartFile image) {

        String analysisId = UUID.randomUUID().toString();

        try {
            // 1. 이미지 저장
            String imagePath = imageStorageService.save(analysisId, image);

            // 2. DB에 초기 저장
            analysisService.createAnalysis(analysisId, imagePath);

            // 3. AI 서버 호출
            AiPredictResponse aiResponse = analysisService.callAiPredict(
                analysisId, imagePath, false);

            // 4. 결과 DB 저장
            analysisService.saveResult(analysisId, aiResponse);

        } catch (Exception e) {
            analysisService.updateStatus(analysisId, "failed");
        }

        // 5. 현재 상태 조회 후 반환
        String status = analysisRepository.findById(analysisId)
            .map(a -> a.getStatus())
            .orElse("failed");

        return ResponseEntity.ok(Map.of(
            "analysisId", analysisId,
            "status", status
        ));
    }

    // ② 상태 조회
    @GetMapping("/{analysisId}")
    public ResponseEntity<Map<String, String>> getStatus(
        @PathVariable String analysisId) {

        String status = analysisRepository.findById(analysisId)
            .map(a -> a.getStatus())
            .orElse("not_found");

        return ResponseEntity.ok(Map.of(
            "analysisId", analysisId,
            "status", status
        ));
    }

    // ③ 결과 조회
    @GetMapping("/{analysisId}/result")
    public ResponseEntity<?> getResult(
        @PathVariable String analysisId) {

        AnalysisResultResponse result = analysisService.getResult(analysisId);

        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(result);
    }
}
