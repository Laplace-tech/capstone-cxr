package com.capstone.backend.api;

import com.capstone.backend.dto.AiPredictResponse;
import com.capstone.backend.dto.AnalysisResultResponse;
import com.capstone.backend.service.AnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/analyses")
public class AnalysisController {

    @Autowired
    private AnalysisService analysisService;

    // 임시 저장소 (DB 연결 전까지 메모리에 저장)
    private final ConcurrentHashMap<String, AnalysisResultResponse> resultStore
        = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> statusStore
        = new ConcurrentHashMap<>();

    // ① 분석 요청
    @PostMapping
    public ResponseEntity<Map<String, String>> createAnalysis(
        @RequestParam("image") MultipartFile image) {

        String analysisId = UUID.randomUUID().toString();

        // 초기 상태 저장
        statusStore.put(analysisId, "processing");

        try {
            // AI 서버 호출
            AiPredictResponse aiResponse = analysisService.callAiPredict(image);

            // 결과 변환 후 저장
            AnalysisResultResponse result = analysisService.convertToResult(
                analysisId, aiResponse);
            resultStore.put(analysisId, result);
            statusStore.put(analysisId, "completed");

        } catch (Exception e) {
            statusStore.put(analysisId, "failed");
        }

        return ResponseEntity.ok(Map.of(
            "analysisId", analysisId,
            "status", statusStore.get(analysisId)
        ));
    }

    // ② 상태 조회
    @GetMapping("/{analysisId}")
    public ResponseEntity<Map<String, String>> getStatus(
        @PathVariable String analysisId) {

        String status = statusStore.getOrDefault(analysisId, "not_found");

        return ResponseEntity.ok(Map.of(
            "analysisId", analysisId,
            "status", status
        ));
    }

    // ③ 결과 조회
    @GetMapping("/{analysisId}/result")
    public ResponseEntity<?> getResult(
        @PathVariable String analysisId) {

        AnalysisResultResponse result = resultStore.get(analysisId);

        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(result);
    }
}
