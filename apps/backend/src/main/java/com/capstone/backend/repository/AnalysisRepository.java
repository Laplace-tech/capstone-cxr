package com.capstone.backend.repository;

import com.capstone.backend.domain.Analysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnalysisRepository extends JpaRepository<Analysis, String> {
    // JpaRepository가 기본 CRUD 자동 생성
    // findById, save, delete 등 자동으로 됨
}
