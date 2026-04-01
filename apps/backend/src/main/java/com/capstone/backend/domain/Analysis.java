package com.capstone.backend.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analysis")
public class Analysis {

    @Id
    @Column(name = "analysis_id")
    private String analysisId;

    @Column(name = "status")
    private String status;

    @Column(name = "image_path")
    private String imagePath;

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "threshold_version")
    private String thresholdVersion;

    // AI 결과 JSON 통째로 저장
    @Column(name = "result_json", columnDefinition = "TEXT")
    private String resultJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 기본 생성자
    public Analysis() {}

    // 생성자
    public Analysis(String analysisId, String status, String imagePath) {
        this.analysisId = analysisId;
        this.status = status;
        this.imagePath = imagePath;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getter
    public String getAnalysisId() { return analysisId; }
    public String getStatus() { return status; }
    public String getImagePath() { return imagePath; }
    public String getModelVersion() { return modelVersion; }
    public String getThresholdVersion() { return thresholdVersion; }
    public String getResultJson() { return resultJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setter
    public void setStatus(String status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
    public void setModelVersion(String v) { this.modelVersion = v; }
    public void setThresholdVersion(String v) { this.thresholdVersion = v; }
    public void setResultJson(String v) { this.resultJson = v; }
}
