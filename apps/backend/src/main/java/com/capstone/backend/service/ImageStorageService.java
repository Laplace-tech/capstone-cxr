package com.capstone.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class ImageStorageService {

    // application.properties에서 경로 가져옴
    @Value("${shared.uploads.dir}")
    private String uploadsDir;

    // 이미지 저장하고 상대경로 반환
    // 예: "analyses/abc123/input.jpg"
    public String save(String analysisId, MultipartFile file) throws IOException {

        // 저장할 폴더 생성
        // shared/uploads/analyses/abc123/
        Path dir = Paths.get(uploadsDir, "analyses", analysisId);
        Files.createDirectories(dir);

        // 파일 저장
        // shared/uploads/analyses/abc123/input.jpg
        String filename = "input.jpg";
        Path filePath = dir.resolve(filename);
        file.transferTo(filePath.toFile());

        // AI한테 넘길 상대경로 반환
        return "analyses/" + analysisId + "/" + filename;
    }
}
