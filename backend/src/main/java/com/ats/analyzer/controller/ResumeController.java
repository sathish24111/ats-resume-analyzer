package com.ats.analyzer.controller;

import com.ats.analyzer.model.Resume;
import com.ats.analyzer.service.ResumeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/resumes")
public class ResumeController {

    @Autowired
    private ResumeService resumeService;

    @GetMapping
    public ResponseEntity<List<Resume>> getResumes(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<Resume> resumes = resumeService.getResumesByUser(userId);
        return ResponseEntity.ok(resumes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resume> getResumeById(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Resume resume = resumeService.getResumeById(id, userId);
        return ResponseEntity.ok(resume);
    }

    @PostMapping
    public ResponseEntity<Resume> createResume(@RequestBody Resume resume, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        resume.setUserId(userId);
        resume.setIsUploaded(false);
        Resume saved = resumeService.saveResume(resume);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resume> updateResume(@PathVariable Long id, @RequestBody Resume details, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Resume existing = resumeService.getResumeById(id, userId);
        
        existing.setTitle(details.getTitle());
        existing.setTemplateId(details.getTemplateId());
        existing.setPersonalDetails(details.getPersonalDetails());
        existing.setEducation(details.getEducation());
        existing.setSkills(details.getSkills());
        existing.setExperience(details.getExperience());
        existing.setProjects(details.getProjects());
        existing.setCertifications(details.getCertifications());
        existing.setRawText(details.getRawText());
        
        Resume updated = resumeService.saveResume(existing);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        resumeService.deleteResume(id, userId);
        return ResponseEntity.ok(Map.of("message", "Resume deleted successfully."));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file, 
                                          @RequestParam("title") String title, 
                                          HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");

        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "File is empty. Please select a valid PDF or DOCX file."));
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        boolean isPdf = false;
        boolean isDocx = false;

        String contentType = file.getContentType();
        if ((contentType != null && contentType.equalsIgnoreCase("application/pdf")) || extension.equals(".pdf")) {
            isPdf = true;
        } else if ((contentType != null && (contentType.equalsIgnoreCase("application/vnd.openxmlformats-officedocument.wordprocessingml.document") || contentType.equalsIgnoreCase("application/msword"))) || extension.equals(".docx")) {
            isDocx = true;
        }

        if (!isPdf && !isDocx) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Only PDF and DOCX resumes are supported."));
        }

        try {
            // Extract text based on file format
            String rawText = isPdf ? resumeService.extractTextFromPdf(file) : resumeService.extractTextFromDocx(file);
            
            // Build the uploaded resume entry
            Resume resume = Resume.builder()
                    .userId(userId)
                    .title(title)
                    .templateId("uploaded")
                    .isUploaded(true)
                    .rawText(rawText)
                    .filePath(file.getOriginalFilename()) // Track parsed file source
                    .build();
            
            Resume saved = resumeService.saveResume(resume);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process resume: " + e.getMessage()));
        }
    }
}
