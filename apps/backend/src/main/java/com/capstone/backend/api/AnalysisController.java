package com.capstone.backend.api;

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

    // ① 분석 요청 (즉시 응답 + 백그라운드 처리)
    @PostMapping
    public ResponseEntity<?> createAnalysis(
        @RequestParam("image") MultipartFile image) {

        String analysisId = UUID.randomUUID().toString();

        try {
            // 1. 이미지 저장 (검증 포함)
            String imagePath = imageStorageService.save(analysisId, image);

            // 2. DB에 초기 저장 (queued 상태)
            analysisService.createAnalysis(analysisId, imagePath);

            // 3. AI 호출은 백그라운드에서 처리 (@Async)
            analysisService.processAnalysis(analysisId, imagePath);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "서버 오류가 발생했습니다."
            ));
        }

        // 4. AI 기다리지 않고 즉시 queued 상태로 반환
        return ResponseEntity.ok(Map.of(
            "analysisId", analysisId,
            "status", "queued"
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
