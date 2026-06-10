-- MySQL Database Schema for ATS Resume Analyzer & Resume Builder

CREATE DATABASE IF NOT EXISTS ats_db;
USE ats_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' NOT NULL, -- 'USER' or 'ADMIN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Session Tokens Table (For robust custom token-based session tracking)
CREATE TABLE IF NOT EXISTS session_tokens (
    token VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    template_id VARCHAR(50) DEFAULT 'modern',
    
    -- Store builder data as JSON strings for flexibility
    personal_details TEXT, -- JSON holding { name, email, phone, address, summary, linkedin, website }
    education TEXT,        -- JSON holding Array of { school, degree, fieldOfStudy, startDate, endDate, description }
    skills TEXT,           -- JSON holding Array of strings or { name, level }
    experience TEXT,       -- JSON holding Array of { company, position, startDate, endDate, description }
    projects TEXT,         -- JSON holding Array of { title, description, technologies, link }
    certifications TEXT,   -- JSON holding Array of strings or { title, issuer, date }
    
    raw_text LONGTEXT,     -- Extracted text from uploaded PDF or compiled builder text for analysis
    file_path VARCHAR(500), -- If uploaded, contains path to physical file
    is_uploaded BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Job Descriptions Table (For storing pasted job descriptions to compare with)
CREATE TABLE IF NOT EXISTS job_descriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Resume Analysis Table (For storing ATS reports and JD comparisons)
CREATE TABLE IF NOT EXISTS resume_analysis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_id BIGINT NOT NULL,
    ats_score INT DEFAULT 0,
    formatting_score INT DEFAULT 0,
    keyword_score INT DEFAULT 0,
    missing_keywords TEXT,  -- Comma-separated or JSON list of missing keywords
    weak_sections TEXT,     -- Comma-separated or JSON list of weak sections
    suggestions TEXT,       -- JSON array of specific dynamic tips for improvement
    raw_analysis_json TEXT, -- Full detailed assessment JSON structure
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Templates Table (Prepopulated or editable layouts for the Resume Builder)
CREATE TABLE IF NOT EXISTS templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code TEXT NOT NULL,       -- CSS or structure styling JSON config
    thumbnail TEXT,          -- Thumbnail URL or inline SVG representations
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert initial resume templates to use out-of-the-box
INSERT INTO templates (id, name, code, thumbnail, is_active)
VALUES 
('modern', 'Modern Minimalist', '{"primaryColor":"#2563eb","fontFamily":"Inter","layout":"clean"}', 'svg-modern-thumbnail', 1),
('professional', 'Professional Corporate', '{"primaryColor":"#1e293b","fontFamily":"Georgia","layout":"classic"}', 'svg-prof-thumbnail', 1),
('tech', 'Creative Tech', '{"primaryColor":"#06b6d4","fontFamily":"Outfit","layout":"modern"}', 'svg-tech-thumbnail', 1)
ON DUPLICATE KEY UPDATE name=name;

-- Seed default Administrator User (password: 'admin123' hashed using a simple custom SHA-256 or BCrypt equivalent)
-- The password hash here matches standard BCrypt for 'admin123', e.g. $2a$10$T8Pqf2g934sB61lF2D3qOunLp3p1C8f0t7X.Q3t4yU.0s2bC1b9K6
-- In our service, we'll support both secure validation or quick SHA-256 for setup.
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@ats.com', '$2a$10$T8Pqf2g934sB61lF2D3qOunLp3p1C8f0t7X.Q3t4yU.0s2bC1b9K6', 'Platform Admin', 'ADMIN')
ON DUPLICATE KEY UPDATE email=email;
