package com.ats.analyzer.repository;

import com.ats.analyzer.model.ResumeAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, Long> {
    Optional<ResumeAnalysis> findFirstByResumeIdOrderByCreatedAtDesc(Long resumeId);
    List<ResumeAnalysis> findByResumeIdOrderByCreatedAtDesc(Long resumeId);
}
