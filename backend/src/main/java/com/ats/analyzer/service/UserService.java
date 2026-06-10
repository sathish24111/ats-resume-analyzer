package com.ats.analyzer.service;

import com.ats.analyzer.config.JwtUtil;
import com.ats.analyzer.exception.UnauthorizedException;
import com.ats.analyzer.model.User;
import com.ats.analyzer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    public User registerUser(String email, String password, String fullName) {
        return registerUser(email, password, fullName, "USER");
    }

    @Transactional
    public User registerUser(String email, String password, String fullName, String role) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered.");
        }

        // Secure password hashing using BCrypt
        String hash = passwordEncoder.encode(password);

        User user = User.builder()
                .email(email)
                .passwordHash(hash)
                .fullName(fullName)
                .role(role == null || role.trim().isEmpty() ? "USER" : role.toUpperCase())
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        // Verify password using BCrypt
        boolean valid = passwordEncoder.matches(password, user.getPasswordHash());
        if (!valid) {
            // Fallback for custom SHA hashes if needed, but BCrypt handles our seed 'admin123' hash
            throw new UnauthorizedException("Invalid email or password.");
        }

        // Generate stateless JWT token
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        // Prepare response details
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("role", user.getRole());

        return response;
    }

    @Transactional
    public void logout(String token) {
        // Stateless JWT doesn't require server-side invalidation.
        // In database sessions, we deleted session tokens, but JWT is client-invalidated.
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
