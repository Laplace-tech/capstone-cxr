package com.capstone.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class ImageStorageService {

    @Value("${shared.uploads.dir}")
    private String uploadsDir;

    // 허용 확장자
    private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png");

    // 최대 파일 크기 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    public String save(String analysisId, MultipartFile file) throws IOException {

        // 1. 파일 비어있는지 확인
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        // 2. 파일 크기 확인
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("파일 크기가 10MB를 초과합니다.");
        }

        // 3. 확장자 확인
        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("jpg, jpeg, png 파일만 허용됩니다.");
        }

        // 4. 저장 폴더 생성
        Path dir = Paths.get(uploadsDir, "analyses", analysisId);
        Files.createDirectories(dir);

        // 5. 파일 저장 (확장자 유지)
        String filename = "input." + extension;
        Path filePath = dir.resolve(filename);
        file.transferTo(filePath.toFile());

        // 6. AI한테 넘길 상대경로 반환
        return "analyses/" + analysisId + "/" + filename;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new IllegalArgumentException("파일 확장자가 없습니다.");
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
