package com.ats.analyzer.service;

import com.ats.analyzer.exception.ResourceNotFoundException;
import com.ats.analyzer.model.Template;
import com.ats.analyzer.repository.TemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TemplateService {

    @Autowired
    private TemplateRepository templateRepository;

    public List<Template> getActiveTemplates() {
        return templateRepository.findByIsActiveTrue();
    }

    public List<Template> getAllTemplates() {
        return templateRepository.findAll();
    }

    public Template getTemplateById(String id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found with ID: " + id));
    }

    public Template saveTemplate(Template template) {
        if (template.getIsActive() == null) {
            template.setIsActive(true);
        }
        return templateRepository.save(template);
    }

    public void deleteTemplate(String id) {
        Template template = getTemplateById(id);
        templateRepository.delete(template);
    }
}
