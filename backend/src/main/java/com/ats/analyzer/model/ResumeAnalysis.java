package com.ats.analyzer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "resume_analysis")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysis {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "resume_id", nullable = false)
    private Long resumeId;
    
    @Column(name = "ats_score")
    private Integer atsScore;
    
    @Column(name = "formatting_score")
    private Integer formattingScore;
    
    @Column(name = "keyword_score")
    private Integer keywordScore;
    
    @Column(name = "missing_keywords", columnDefinition = "TEXT")
    private String missingKeywords;  // Comma-separated or JSON list of missing keywords
    
    @Column(name = "weak_sections", columnDefinition = "TEXT")
    private String weakSections;     // Comma-separated or JSON list of weak sections
    
    @Column(columnDefinition = "TEXT")
    private String suggestions;       // JSON string of improvement action points
    
    @Column(name = "raw_analysis_json", columnDefinition = "TEXT")
    private String rawAnalysisJson;  // Comprehensive raw score JSON structures
    
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
