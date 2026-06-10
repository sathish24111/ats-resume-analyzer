package com.ats.analyzer.service;

import com.ats.analyzer.exception.ResourceNotFoundException;
import com.ats.analyzer.exception.UnauthorizedException;
import com.ats.analyzer.model.JobDescription;
import com.ats.analyzer.repository.JobDescriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class JobDescriptionService {

    @Autowired
    private JobDescriptionRepository jobDescriptionRepository;

    public List<JobDescription> getJobDescriptionsByUser(Long userId) {
        return jobDescriptionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public JobDescription saveJobDescription(JobDescription jd) {
        return jobDescriptionRepository.save(jd);
    }

    public JobDescription getById(Long id, Long userId) {
        JobDescription jd = jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job description not found with ID: " + id));
        
        if (!jd.getUserId().equals(userId)) {
            throw new UnauthorizedException("You do not have access to this job description.");
        }
        return jd;
    }
}
