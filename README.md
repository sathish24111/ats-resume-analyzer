# ATS Resume Analyzer & Resume Builder

A modern, full-stack **Applicant Tracking System (ATS) Resume Analyzer and Interactive Resume Builder** web application. 

This platform allows users to build highly-optimized resumes using structured professional templates, upload existing PDF resumes, run automated ATS parser audits, compare compatibility ratings against target job descriptions, and receive detailed suggestions to optimize their professional profiles.

---

## Technical Stack

*   **Frontend**: HTML5, Vanilla CSS3 (curated dark/light theme, modern glassmorphism, responsive flex grids, custom interactive SVG gauges, pulsing upload animations), Vanilla ES6 JavaScript.
*   **Backend**: Java 17, Spring Boot 3.2, Spring Data JPA, Apache PDFBox (high-fidelity PDF text parsing).
*   **Database**: MySQL 8.0 (Relational schema modeling users, resumes, analyses, job description logs, custom session security tokens).

---

## System Architecture & Directory Structure

```text
ats-resume-analyzer/
│
├── database/
│   └── schema.sql                # MySQL initialization script (schema + templates + admin seed)
│
├── frontend/                     # Client Application Pages & Assets
│   ├── index.html                # Single Page App main workspace frame
│   ├── styles.css                # Premium styling system, dark/light toggle & gauges
│   ├── app.js                    # Core system (Auth state, routes, dashboard totals)
│   ├── builder.js                # Resume Builder (Form arrays, preview templates, printing)
│   └── analyzer.js               # Parser uploads, circular Gauges, Job Match matcher
│
├── backend/                      # Spring Boot REST Application Core
│   ├── pom.xml                   # Maven dependencies (Web, JPA, MySQL, PDFBox, Lombok)
│   └── src/main/
│       ├── resources/
│       │   └── application.properties # Server database and upload boundaries limits
│       └── java/com/ats/analyzer/
│           ├── AtsAnalyzerApplication.java # Bootstrapper class
│           │
│           ├── config/
│           │   ├── RequireAuth.java      # Auth annotations validator
│           │   ├── AuthInterceptor.java  # Token interceptor, session extractor
│           │   ├── PasswordUtil.java     # Secure password hashing (SHA-256 + Salt)
│           │   └── WebConfig.java        # CORS maps & interceptors registry
│           │
│           ├── model/                    # JPA Entities
│           │   ├── User.java
│           │   ├── SessionToken.java
│           │   ├── Resume.java
│           │   ├── ResumeAnalysis.java
│           │   ├── JobDescription.java
│           │   └── Template.java
│           │
│           ├── repository/               # Data repositories
│           │   ├── UserRepository.java
│           │   ├── SessionTokenRepository.java
│           │   ├── ResumeRepository.java
│           │   ├── ResumeAnalysisRepository.java
│           │   ├── JobDescriptionRepository.java
│           │   └── TemplateRepository.java
│           │
│           ├── service/                  # Business Logic Services
│           │   ├── UserService.java      # Hashing, token registry, auth login
│           │   ├── ResumeService.java    # CRUD & PDFBox extraction
│           │   ├── AnalysisService.java  # Formatting assessments, keyword match rules
│           │   ├── TemplateService.java
│           │   └── JobDescriptionService.java
│           │
│           └── exception/                # Exception handlers mapping
│               ├── ResourceNotFoundException.java
│               ├── UnauthorizedException.java
│               └── GlobalExceptionHandler.java
└── README.md                     # Setup, run commands, and documentation
```

---

## Database Setup

1.  Start your local MySQL service.
2.  Log into your MySQL client (e.g. command line or Workbench):
    ```sql
    mysql -u root -p
    ```
3.  Load and execute the SQL initialization script found in `database/schema.sql`:
    ```sql
    SOURCE C:/Users/welcome/.gemini/antigravity/scratch/ats-resume-analyzer/database/schema.sql;
    ```
    *This creates the database `ats_db`, sets up the tables structure, seeds builder templates, and registers a default admin user:*
    *   **Admin Email**: `admin@ats.com`
    *   **Admin Password**: `admin123`

---

## Running the Application

### 1. Run the Spring Boot Backend

1.  Navigate into the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Verify Maven compiler and dependencies by packing the binary package:
    ```bash
    mvn clean install
    ```
3.  Launch the Spring Boot web application:
    ```bash
    mvn spring-boot:run
    ```
    *The REST APIs server starts running at: `http://localhost:8080/api`.*

### 2. Launch the Client Frontend

Since the client is constructed as static assets, you can launch it in two ways:
*   **Method A (Easiest)**: Double-click or open `frontend/index.html` in any modern web browser.
*   **Method B (Local server)**: Serve `frontend/` using any static files server (e.g., Live Server in VS Code, Python `http.server`, or npm `serve`).
    ```bash
    cd frontend
    npx serve
    ```

---

## API Reference Map

All endpoints require the custom authorization session token passed under the request header `X-Session-Token: <token>` or `Authorization: Bearer <token>`, except the register and login routes.

### 1. Authentication APIs (`/api/auth`)

| Method | Endpoint | Description | Requires Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/register` | Register a new user profile | No |
| `POST` | `/login` | Authenticate credentials and return Token | No |
| `POST` | `/logout` | Invalidate and purge active session token | Yes |
| `GET` | `/profile` | Fetch authenticated profile details | Yes |

### 2. Resumes APIs (`/api/resumes`)

| Method | Endpoint | Description | Requires Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Fetch all resumes for current user | Yes |
| `GET` | `/{id}` | Get specific resume details (builder / raw) | Yes |
| `POST` | `/` | Save a new resume built from the editor | Yes |
| `PUT` | `/{id}` | Update details of a saved builder resume | Yes |
| `DELETE`| `/{id}` | Permanently delete resume and reports history | Yes |
| `POST` | `/upload` | Upload resume PDF, parse text, and save | Yes |

### 3. Analysis & Matching APIs (`/api/analysis`)

| Method | Endpoint | Description | Requires Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/resume/{resumeId}` | Get latest ATS report for a resume | Yes |
| `POST` | `/resume/{resumeId}` | Run a new ATS scan audit (optional J.D.) | Yes |
| `POST` | `/match` | Run dynamic match comparison against job description | Yes |

### 4. Admin Management APIs (`/api/admin`)

| Method | Endpoint | Description | Requires Admin |
| :--- | :--- | :--- | :---: |
| `GET` | `/stats` | Fetch aggregate metrics across all users | Yes |
| `GET` | `/users` | List all accounts registered on the system | Yes |
| `DELETE`| `/users/{id}` | Delete a user profile and associated documents | Yes |
| `GET` | `/templates` | List all layout templates configurations | Yes |
