package com.ats.analyzer.controller;

import com.ats.analyzer.model.Template;
import com.ats.analyzer.model.User;
import com.ats.analyzer.repository.ResumeAnalysisRepository;
import com.ats.analyzer.repository.ResumeRepository;
import com.ats.analyzer.repository.UserRepository;
import com.ats.analyzer.service.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private ResumeAnalysisRepository analysisRepository;

    @Autowired
    private TemplateService templateService;

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalResumes = resumeRepository.count();
        
        long uploadedResumes = resumeRepository.findAll().stream()
                .filter(r -> r.getIsUploaded() != null && r.getIsUploaded())
                .count();
        long generatedResumes = totalResumes - uploadedResumes;

        // Calculate average ATS score
        double avgAts = analysisRepository.findAll().stream()
                .mapToInt(a -> a.getAtsScore() != null ? a.getAtsScore() : 0)
                .average()
                .orElse(0.0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalResumes", totalResumes);
        stats.put("uploadedResumes", uploadedResumes);
        stats.put("generatedResumes", generatedResumes);
        stats.put("averageAtsScore", Math.round(avgAts * 10.0) / 10.0);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Remove password hashes from security mapping before returning
        List<Map<String, Object>> mappedUsers = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("email", u.getEmail());
            map.put("fullName", u.getFullName());
            map.put("role", u.getRole());
            map.put("createdAt", u.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(mappedUsers);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found."));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully."));
    }

    @GetMapping("/templates")
    public ResponseEntity<List<Template>> getAllTemplates() {
        return ResponseEntity.ok(templateService.getAllTemplates());
    }

    @PostMapping("/templates")
    public ResponseEntity<Template> saveTemplate(@RequestBody Template template) {
        Template saved = templateService.saveTemplate(template);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<?> deleteTemplate(@PathVariable String id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.ok(Map.of("message", "Template deleted successfully."));
    }
}
