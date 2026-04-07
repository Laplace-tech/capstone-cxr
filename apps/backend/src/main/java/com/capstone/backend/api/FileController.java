package com.capstone.backend.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    @Value("${shared.generated.dir}")
    private String generatedDir;

    // gradcam 이미지 반환
    @GetMapping("/{analysisId}/gradcam")
    public ResponseEntity<Resource> getGradcam(
        @PathVariable String analysisId) {

        Path filePath = Paths.get(generatedDir,
            "analyses", analysisId, "gradcam_overlay.png");

        Resource resource = new FileSystemResource(filePath);

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_PNG)
            .body(resource);
    }
}
