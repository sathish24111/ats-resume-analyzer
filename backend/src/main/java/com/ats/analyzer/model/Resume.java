package com.ats.analyzer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Resume {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(name = "template_id")
    private String templateId;
    
    @Column(name = "personal_details", columnDefinition = "TEXT")
    private String personalDetails; // JSON string representing personal info
    
    @Column(columnDefinition = "TEXT")
    private String education;        // JSON string representing educational history
    
    @Column(columnDefinition = "TEXT")
    private String skills;           // JSON string representing core skills
    
    @Column(columnDefinition = "TEXT")
    private String experience;       // JSON string representing work history
    
    @Column(columnDefinition = "TEXT")
    private String projects;         // JSON string representing key projects
    
    @Column(columnDefinition = "TEXT")
    private String certifications;   // JSON string representing certificate listings
    
    @Column(name = "raw_text", columnDefinition = "LONGTEXT")
    private String rawText;          // Extracted text content from resume
    
    @Column(name = "file_path")
    private String filePath;         // Full path for uploaded resumes
    
    @Column(name = "is_uploaded")
    private Boolean isUploaded;      // Indicator if resume is from template builder or upload
    
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
