package com.ats.analyzer.config;

import com.ats.analyzer.model.Template;
import com.ats.analyzer.model.User;
import com.ats.analyzer.repository.TemplateRepository;
import com.ats.analyzer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedAdminUser();
        seedTemplates();
    }

    private void seedAdminUser() {
        String adminEmail = "admin@ats.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .email(adminEmail)
                    .fullName("Platform Admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role("ADMIN")
                    .build();
            userRepository.save(admin);
            System.out.println(">>> DatabaseSeeder: Seeded default Admin user (" + adminEmail + ")");
        }
    }

    private void seedTemplates() {
        if (templateRepository.count() == 0) {
            Template modern = Template.builder()
                    .id("modern")
                    .name("Modern Minimalist")
                    .code("{\"primaryColor\":\"#2563eb\",\"fontFamily\":\"Inter\",\"layout\":\"clean\"}")
                    .thumbnail("svg-modern-thumbnail")
                    .isActive(true)
                    .build();

            Template professional = Template.builder()
                    .id("professional")
                    .name("Professional Corporate")
                    .code("{\"primaryColor\":\"#1e293b\",\"fontFamily\":\"Georgia\",\"layout\":\"classic\"}")
                    .thumbnail("svg-prof-thumbnail")
                    .isActive(true)
                    .build();

            Template tech = Template.builder()
                    .id("tech")
                    .name("Creative Tech")
                    .code("{\"primaryColor\":\"#06b6d4\",\"fontFamily\":\"Outfit\",\"layout\":\"modern\"}")
                    .thumbnail("svg-tech-thumbnail")
                    .isActive(true)
                    .build();

            templateRepository.save(modern);
            templateRepository.save(professional);
            templateRepository.save(tech);
            System.out.println(">>> DatabaseSeeder: Seeded 3 default resume templates");
        }
    }
}
