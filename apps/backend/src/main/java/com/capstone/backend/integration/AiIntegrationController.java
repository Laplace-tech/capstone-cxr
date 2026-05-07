package com.capstone.backend.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class AiIntegrationController {

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${ai.service.base-url}")
    private String aiServiceBaseUrl;

    @GetMapping("/api/integration/ai-health")
    public ResponseEntity<?> aiHealth() {
        String targetUrl = aiServiceBaseUrl + "/health";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(targetUrl))
                .GET()
                .build();

        try {
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("target", targetUrl);
            result.put("statusCode", response.statusCode());
            result.put("body", response.body());

            return ResponseEntity.ok(result);

        } catch (IOException | InterruptedException e) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("target", targetUrl);
            error.put("error", e.getClass().getSimpleName());
            error.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
        }
    }
}
