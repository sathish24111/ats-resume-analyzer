package com.ats.analyzer.controller;

import com.ats.analyzer.model.JobDescription;
import com.ats.analyzer.model.Resume;
import com.ats.analyzer.model.ResumeAnalysis;
import com.ats.analyzer.service.AnalysisService;
import com.ats.analyzer.service.JobDescriptionService;
import com.ats.analyzer.service.ResumeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analysis")
public class AnalysisController {

    @Autowired
    private AnalysisService analysisService;

    @Autowired
    private ResumeService resumeService;

    @Autowired
    private JobDescriptionService jdService;

    @GetMapping("/resume/{resumeId}")
    public ResponseEntity<?> getLatestAnalysis(@PathVariable Long resumeId, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        // Verify resume ownership
        resumeService.getResumeById(resumeId, userId);
        
        ResumeAnalysis analysis = analysisService.getLatestAnalysis(resumeId);
        if (analysis == null) {
            return ResponseEntity.ok().body(Map.of("message", "No analysis report exists for this resume yet."));
        }
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/resume/{resumeId}/history")
    public ResponseEntity<?> getAnalysisHistory(@PathVariable Long resumeId, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        // Verify resume ownership
        resumeService.getResumeById(resumeId, userId);
        
        List<ResumeAnalysis> history = analysisService.getAnalysisHistory(resumeId);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/resume/{resumeId}")
    public ResponseEntity<?> analyzeResume(@PathVariable Long resumeId, 
                                           @RequestBody(required = false) Map<String, String> body,
                                           HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        // Verify resume ownership
        Resume resume = resumeService.getResumeById(resumeId, userId);
        
        String jdText = null;
        String jdTitle = null;
        if (body != null) {
            jdText = body.get("jobDescriptionText");
            jdTitle = body.get("jobDescriptionTitle");
        }

        // If job description is passed, save it to the history log
        if (jdText != null && !jdText.trim().isEmpty()) {
            if (jdTitle == null || jdTitle.trim().isEmpty()) {
                jdTitle = "Target Job: " + resume.getTitle();
            }
            JobDescription jd = JobDescription.builder()
                    .userId(userId)
                    .title(jdTitle)
                    .descriptionText(jdText)
                    .build();
            jdService.saveJobDescription(jd);
        }

        // Run detailed parser/ATS keyword matcher service
        ResumeAnalysis analysis = analysisService.performAnalysis(resume, jdText);
        return ResponseEntity.ok(analysis);
    }

    @PostMapping("/match")
    public ResponseEntity<?> compareMatch(@RequestBody Map<String, String> body, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String resumeIdStr = body.get("resumeId");
        String jdText = body.get("jobDescription");
        String jdTitle = body.get("jobTitle");

        if (resumeIdStr == null || jdText == null || jdText.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "resumeId and jobDescription are required parameters."));
        }

        Long resumeId = Long.parseLong(resumeIdStr);
        // Verify resume ownership
        Resume resume = resumeService.getResumeById(resumeId, userId);

        // Run analysis
        ResumeAnalysis analysis = analysisService.performAnalysis(resume, jdText);

        // Log JD
        JobDescription jd = JobDescription.builder()
                .userId(userId)
                .title(jdTitle != null && !jdTitle.trim().isEmpty() ? jdTitle : "Comparison Job Match")
                .descriptionText(jdText)
                .build();
        jdService.saveJobDescription(jd);

        return ResponseEntity.ok(analysis);
    }
}
