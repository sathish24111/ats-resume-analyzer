package com.ats.analyzer.config;

import com.ats.analyzer.model.User;
import com.ats.analyzer.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");
        final String xSessionTokenHeader = request.getHeader("X-Session-Token");

        String username = null;
        String jwt = null;

        // Try extracting from standard Bearer token header
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.warn("Unable to extract JWT token username: " + e.getMessage());
            }
        } 
        // Fallback: try extracting from custom X-Session-Token header (legacy/hybrid clients)
        else if (xSessionTokenHeader != null && !xSessionTokenHeader.trim().isEmpty()) {
            jwt = xSessionTokenHeader.trim();
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.warn("Unable to extract legacy token username: " + e.getMessage());
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);

                // Fetch User Entity to bind as attributes for strict backwards-compatibility with MVC controllers
                userRepository.findByEmail(username).ifPresent(user -> {
                    request.setAttribute("userId", user.getId());
                    request.setAttribute("userEmail", user.getEmail());
                    request.setAttribute("userRole", user.getRole());
                    request.setAttribute("user", user);
                });
            }
        }
        chain.doFilter(request, response);
    }
}
