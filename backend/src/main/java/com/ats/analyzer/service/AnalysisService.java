package com.ats.analyzer.service;

import com.ats.analyzer.model.JobDescription;
import com.ats.analyzer.model.Resume;
import com.ats.analyzer.model.ResumeAnalysis;
import com.ats.analyzer.repository.ResumeAnalysisRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AnalysisService {

    @Autowired
    private ResumeAnalysisRepository analysisRepository;

    private static final List<String> TECH_KEYWORDS = Arrays.asList(
        "java", "spring boot", "javascript", "react", "html", "css", "sql", "mysql", "git", "docker", 
        "aws", "cloud", "python", "typescript", "node.js", "rest api", "kubernetes", "agile", "scrum",
        "ci/cd", "maven", "hibernate", "jpa", "microservices", "nosql", "linux", "c++", "angular", "vue"
    );

    private static final List<String> CORE_SECTIONS = Arrays.asList(
        "experience", "work history", "employment", "education", "skills", "projects", "certifications"
    );

    private static final List<String> ACTION_VERBS = Arrays.asList(
        "managed", "developed", "designed", "implemented", "led", "created", "built", "spearheaded",
        "engineered", "optimized", "increased", "decreased", "automated", "facilitated", "formulated"
    );

    public ResumeAnalysis getLatestAnalysis(Long resumeId) {
        return analysisRepository.findFirstByResumeIdOrderByCreatedAtDesc(resumeId).orElse(null);
    }

    public List<ResumeAnalysis> getAnalysisHistory(Long resumeId) {
        return analysisRepository.findByResumeIdOrderByCreatedAtDesc(resumeId);
    }

    public ResumeAnalysis performAnalysis(Resume resume, String jobDescriptionText) {
        String text = resume.getRawText();
        if (text == null || text.trim().isEmpty()) {
            text = compileResumeText(resume);
        }

        String normalizedText = text.toLowerCase();

        // 1. Calculate Formatting Score (out of 100)
        int formattingScore = 0;
        List<String> weakSections = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        // 1.1 Contact details check
        boolean hasEmail = normalizedText.contains("@");
        boolean hasPhone = Pattern.compile("\\b\\d{10}\\b|\\b\\d{3}[-\\s]\\d{3}[-\\s]\\d{4}\\b|\\+\\d{1,3}").matcher(normalizedText).find();
        
        if (hasEmail) {
            formattingScore += 20;
        } else {
            suggestions.add("Add a professional email address to the contact section.");
        }
        if (hasPhone) {
            formattingScore += 20;
        } else {
            suggestions.add("Include a phone number so recruiters can reach out easily.");
        }

        // 1.2 Section check
        boolean hasExperienceSection = false;
        boolean hasProjectsSection = false;
        for (String section : CORE_SECTIONS) {
            if (normalizedText.contains(section)) {
                formattingScore += 10;
                if (section.equals("experience") || section.equals("work history") || section.equals("employment")) {
                    hasExperienceSection = true;
                }
                if (section.equals("projects")) {
                    hasProjectsSection = true;
                }
            } else {
                if (section.equals("experience") || section.equals("education") || section.equals("skills")) {
                    weakSections.add(section.substring(0, 1).toUpperCase() + section.substring(1));
                    suggestions.add("Missing core section: '" + section.substring(0, 1).toUpperCase() + section.substring(1) + "'.");
                }
            }
        }

        // 1.3 Word count check (standard resume length is between 400 and 1200 words)
        String[] words = text.split("\\s+");
        int wordCount = words.length;
        if (wordCount >= 400 && wordCount <= 1200) {
            formattingScore += 10;
        } else if (wordCount >= 200 && wordCount <= 1500) {
            formattingScore += 5;
            if (wordCount < 400) {
                suggestions.add("Your resume is somewhat short (" + wordCount + " words). Expand on your experience and skills details.");
            } else {
                suggestions.add("Your resume is somewhat long (" + wordCount + " words). Try to condense it to a concise 1-2 pages.");
            }
        } else {
            if (wordCount < 200) {
                suggestions.add("Your resume is extremely short (" + wordCount + " words). Please add more detailed sections.");
            } else {
                suggestions.add("Your resume is extremely long (" + wordCount + " words). A clean 1-2 page format is highly recommended.");
            }
        }

        formattingScore = Math.min(100, Math.max(0, formattingScore));

        // 2. Classify and Extract Keywords for Skills Score and Keyword Score
        List<String> targetKeywords = TECH_KEYWORDS;
        boolean jdMode = false;

        if (jobDescriptionText != null && !jobDescriptionText.trim().isEmpty()) {
            jdMode = true;
            targetKeywords = extractKeywordsFromJd(jobDescriptionText);
        }

        if (targetKeywords.isEmpty()) {
            targetKeywords = TECH_KEYWORDS;
        }

        // Classify keywords into Tech Skills vs General Keywords
        List<String> targetSkills = new ArrayList<>();
        List<String> targetGeneralKeywords = new ArrayList<>();
        for (String keyword : targetKeywords) {
            if (TECH_KEYWORDS.contains(keyword.toLowerCase())) {
                targetSkills.add(keyword);
            } else {
                targetGeneralKeywords.add(keyword);
            }
        }

        // Handle case where classification is skewed
        if (targetSkills.isEmpty()) {
            targetSkills.addAll(targetKeywords.subList(0, Math.min(targetKeywords.size(), 5)));
            targetGeneralKeywords.addAll(targetKeywords.subList(Math.min(targetKeywords.size(), 5), targetKeywords.size()));
        }

        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        for (String skill : targetSkills) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(skill) + "\\b", Pattern.CASE_INSENSITIVE);
            if (pattern.matcher(normalizedText).find()) {
                matchedSkills.add(skill);
            } else {
                missingSkills.add(skill);
            }
        }

        List<String> matchedGeneralKeywords = new ArrayList<>();
        List<String> missingGeneralKeywords = new ArrayList<>();
        for (String keyword : targetGeneralKeywords) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(keyword) + "\\b", Pattern.CASE_INSENSITIVE);
            if (pattern.matcher(normalizedText).find()) {
                matchedGeneralKeywords.add(keyword);
            } else {
                missingGeneralKeywords.add(keyword);
            }
        }

        int skillsScore = targetSkills.isEmpty() ? 100 : (matchedSkills.size() * 100) / targetSkills.size();
        int keywordScore = targetGeneralKeywords.isEmpty() ? 100 : (matchedGeneralKeywords.size() * 100) / targetGeneralKeywords.size();

        // 3. Experience Match (20%)
        int actionVerbCount = 0;
        for (String verb : ACTION_VERBS) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(verb) + "\\b", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(normalizedText);
            while (matcher.find()) {
                actionVerbCount++;
            }
        }

        int experienceScore = 0;
        experienceScore += Math.min(50, actionVerbCount * 10); // 10 points per action verb, up to 50
        if (hasExperienceSection) {
            experienceScore += 30;
        } else {
            suggestions.add("Add a distinct 'Experience' section to highlight your professional contributions.");
        }
        if (hasProjectsSection) {
            experienceScore += 20;
        }

        if (actionVerbCount < 4) {
            suggestions.add("Use more strong action verbs (e.g. 'designed', 'optimized', 'spearheaded') to demonstrate impact.");
        }

        experienceScore = Math.min(100, Math.max(0, experienceScore));

        // 4. Overall Weighted ATS Score:
        // Skills Match (40%), Keyword Match (30%), Experience Match (20%), Formatting (10%)
        int atsScore = (int) ((skillsScore * 0.40) + (keywordScore * 0.30) + (experienceScore * 0.20) + (formattingScore * 0.10));
        atsScore = Math.min(100, Math.max(0, atsScore));

        // Generate missing keywords and lists
        List<String> missingKeywordsList = new ArrayList<>();
        missingKeywordsList.addAll(missingSkills);
        missingKeywordsList.addAll(missingGeneralKeywords);

        // Suggestions based on score levels
        if (skillsScore < 60 && !missingSkills.isEmpty()) {
            suggestions.add("Tailor your skills section to include more matching technology keywords like: " + 
                missingSkills.stream().limit(3).collect(Collectors.joining(", ")));
        }
        if (atsScore >= 80) {
            suggestions.add("Outstanding! Your resume demonstrates a highly optimized keyword density and formatting layout.");
        } else if (atsScore >= 60) {
            suggestions.add("Your resume is well-structured, but adding missing technical keywords will significantly boost search discoverability.");
        } else {
            suggestions.add("Consider refactoring your layout to highlight core technical skills and adding action-oriented work descriptions.");
        }

        List<String> finalSuggestions = suggestions.stream().distinct().collect(Collectors.toList());

        // Prepare outputs
        String suggestionsJson = "[" + finalSuggestions.stream().map(s -> "\"" + s.replace("\"", "\\\"") + "\"").collect(Collectors.joining(",")) + "]";
        String weakSectionsStr = String.join(", ", weakSections);
        String missingKeywordsStr = String.join(", ", missingKeywordsList);

        // Comprehensive detailed JSON representation for frontend
        String rawAnalysisJson = String.format(
            "{\"atsScore\":%d,\"skillsScore\":%d,\"keywordScore\":%d,\"experienceScore\":%d,\"formattingScore\":%d,\"wordCount\":%d,\"actionVerbCount\":%d,\"jdMode\":%b,\"matchedCount\":%d,\"targetCount\":%d}",
            atsScore, skillsScore, keywordScore, experienceScore, formattingScore, wordCount, actionVerbCount, jdMode, 
            (matchedSkills.size() + matchedGeneralKeywords.size()), targetKeywords.size()
        );

        ResumeAnalysis analysis = ResumeAnalysis.builder()
                .resumeId(resume.getId())
                .atsScore(atsScore)
                .formattingScore(formattingScore)
                .keywordScore(keywordScore)
                .missingKeywords(missingKeywordsStr)
                .weakSections(weakSectionsStr)
                .suggestions(suggestionsJson)
                .rawAnalysisJson(rawAnalysisJson)
                .build();

        return analysisRepository.save(analysis);
    }

    private List<String> extractKeywordsFromJd(String jdText) {
        String normalizedJd = jdText.toLowerCase();
        Set<String> keywords = new HashSet<>();

        // Check against our comprehensive tech keywords list
        for (String skill : TECH_KEYWORDS) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(skill) + "\\b");
            if (pattern.matcher(normalizedJd).find()) {
                keywords.add(skill);
            }
        }

        // Add additional common key terms if found
        List<String> otherKeyTerms = Arrays.asList(
            "frontend", "backend", "fullstack", "full stack", "engineer", "developer", "designer", "architect",
            "manager", "analytics", "consultant", "analyst", "security", "testing", "quality assurance"
        );

        for (String term : otherKeyTerms) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(term) + "\\b");
            if (pattern.matcher(normalizedJd).find()) {
                keywords.add(term);
            }
        }

        return new ArrayList<>(keywords);
    }

    private String compileResumeText(Resume resume) {
        StringBuilder sb = new StringBuilder();
        
        if (resume.getTitle() != null) sb.append(resume.getTitle()).append("\n");
        if (resume.getPersonalDetails() != null) sb.append(resume.getPersonalDetails()).append("\n");
        if (resume.getSkills() != null) sb.append(resume.getSkills()).append("\n");
        if (resume.getExperience() != null) sb.append(resume.getExperience()).append("\n");
        if (resume.getEducation() != null) sb.append(resume.getEducation()).append("\n");
        if (resume.getProjects() != null) sb.append(resume.getProjects()).append("\n");
        if (resume.getCertifications() != null) sb.append(resume.getCertifications()).append("\n");
        
        return sb.toString();
    }
}
