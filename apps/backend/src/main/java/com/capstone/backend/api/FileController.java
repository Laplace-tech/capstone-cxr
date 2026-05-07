package com.capstone.backend.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    @Value("${shared.generated.dir}")
    private String generatedDir;

    @Value("${shared.uploads.dir}")
    private String uploadsDir;

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

    // 원본 이미지 반환
    @GetMapping("/{analysisId}/original")
    public ResponseEntity<Resource> getOriginal(
        @PathVariable String analysisId) {

        Path dir = Paths.get(uploadsDir, "analyses", analysisId);

        for (String ext : List.of("png", "jpg", "jpeg")) {
            Path filePath = dir.resolve("input." + ext);
            Resource resource = new FileSystemResource(filePath);
            if (resource.exists()) {
                MediaType mediaType = ext.equals("png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
                return ResponseEntity.ok()
                    .contentType(mediaType)
                    .body(resource);
            }
        }
        return ResponseEntity.notFound().build();
    }
}