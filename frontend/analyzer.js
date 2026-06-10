/**
 * ATS Resume Analyzer & Builder - Analyzer & Matcher Engine
 * Manages Drag & Drop PDF upload, Analysis Reports rendering, and Job matching
 */

let selectedFile = null;
window.analyzerSelectId = null; // Set from Dashboard when view details is clicked

// 1. Initialize listeners on load
document.addEventListener('DOMContentLoaded', () => {
    setupDropzone();
    setupTabControls();
    
    // Scan click
    document.getElementById('btn-run-analysis').addEventListener('click', runUploadAndAnalysis);

    // Job Match click
    document.getElementById('btn-run-match').addEventListener('click', runJobDescriptionMatch);
});

// 2. Setup drag and drop dropzone
function setupDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('analyzer-file-input');
    const labelInput = document.getElementById('analyzer-resume-title');
    const scanBtn = document.getElementById('btn-run-analysis');

    // Click triggers file open
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        handleFileSelection(fileInput.files[0]);
    });

    // Drag-over styling
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('active');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('active');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('active');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });
}

function handleFileSelection(file) {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Currently only PDF resumes are supported.', 'error');
        return;
    }

    selectedFile = file;

    // Map UI
    document.getElementById('progress-file-name').textContent = file.name;
    document.getElementById('progress-percent').textContent = 'Ready';
    document.getElementById('progress-bar-fill').style.width = '0%';
    document.getElementById('upload-progress-container').classList.remove('hidden');

    // Pre-populate custom label if empty
    const labelInput = document.getElementById('analyzer-resume-title');
    if (!labelInput.value.trim()) {
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        labelInput.value = baseName + ' (Parsed)';
    }

    // Enable scan button
    document.getElementById('btn-run-analysis').disabled = false;
    showToast('PDF Resume selected successfully.', 'success');
}

// 3. Execution parser & scan API call
async function runUploadAndAnalysis() {
    if (!selectedFile) return;

    const scanBtn = document.getElementById('btn-run-analysis');
    const labelInput = document.getElementById('analyzer-resume-title');
    const title = labelInput.value.trim() || 'My Parsed Resume';

    scanBtn.disabled = true;
    showToast('Uploading PDF to backend...', 'info');

    // Build Form payload
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);

    try {
        // Step 3.1: Upload file and parse text
        const response = await fetch('http://localhost:8080/api/resumes/upload', {
            method: 'POST',
            headers: {
                'X-Session-Token': window.AppState.token
                // Note: Content-Type omitted to let browser set boundary parameter automatically
            },
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to parse resume PDF.');
        }

        const resume = await response.json();
        showToast('Text extracted! Running ATS calculations...', 'success');

        // Step 3.2: Perform primary scan evaluation
        const scanRes = await fetch(`http://localhost:8080/api/analysis/resume/${resume.id}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (scanRes.ok) {
            const report = await scanRes.json();
            showToast('Scan complete!', 'success');
            renderAnalysisReport(report, title);
            
            // Clean up file uploads triggers
            selectedFile = null;
            document.getElementById('upload-progress-container').classList.add('hidden');
            document.getElementById('analyzer-resume-title').value = '';
        } else {
            showToast('Failed to analyze extracted text.', 'error');
        }
    } catch (e) {
        showToast(e.message || 'Error executing scan.', 'error');
    } finally {
        scanBtn.disabled = false;
    }
}

// 4. Render reports elements into Report card panel
function renderAnalysisReport(report, title) {
    document.getElementById('report-resume-title').textContent = title || 'Technical Evaluation';
    document.getElementById('report-ats-score').textContent = report.atsScore;
    
    // Animate Circular Score Gauge (dash-array max = 314)
    const gauge = document.getElementById('gauge-fill-ats');
    const offset = 314 - (314 * report.atsScore) / 100;
    gauge.style.strokeDashoffset = offset;

    // Apply color highlights based on grade
    if (report.atsScore >= 80) {
        gauge.style.stroke = 'var(--accent-green)';
    } else if (report.atsScore >= 50) {
        gauge.style.stroke = 'var(--accent-blue)';
    } else {
        gauge.style.stroke = 'var(--accent-red)';
    }

    // Set keyword score progress
    document.getElementById('report-keyword-percent').textContent = report.keywordScore + '%';
    document.getElementById('report-keyword-fill').style.width = report.keywordScore + '%';

    // Set formatting score progress
    document.getElementById('report-format-percent').textContent = report.formattingScore + '%';
    document.getElementById('report-format-fill').style.width = report.formattingScore + '%';

    // Parse sub reports structures from rawJson
    const stats = JSON.parse(report.rawAnalysisJson);
    
    // Tab 1: Keywords Injections
    const missingChips = document.getElementById('missing-keywords-chips');
    missingChips.innerHTML = '';
    
    if (report.missingKeywords && report.missingKeywords.trim()) {
        const missing = report.missingKeywords.split(',').map(k => k.trim());
        document.getElementById('missing-count').textContent = missing.length;
        
        missing.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'chip chip-error';
            span.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${tag}`;
            missingChips.appendChild(span);
        });
    } else {
        document.getElementById('missing-count').textContent = '0';
        missingChips.innerHTML = `<p class="helper-text" style="color: var(--accent-green);"><i class="fa-solid fa-circle-check"></i> Exceptional job! Zero missing core keywords detected.</p>`;
    }

    // Tab 2: Formatting Checklist Injections
    const checklist = document.getElementById('format-checklist');
    checklist.innerHTML = '';
    
    // Render list of checks
    const formatChecks = [
        { label: 'Standard Contact Credentials (Email)', passed: stats.formattingScore >= 85 || !report.suggestions.includes('email') },
        { label: 'Mobile Phone Contact Representation', passed: stats.formattingScore >= 85 || !report.suggestions.includes('phone') },
        { label: 'Essential Standard Headings Presence', passed: !report.weakSections },
        { label: 'Optimal Word Density Check', passed: stats.formattingScore >= 70 }
    ];

    formatChecks.forEach(check => {
        const item = document.createElement('div');
        item.className = 'checklist-item';
        const icon = check.passed 
            ? `<i class="fa-solid fa-circle-check checklist-icon-success"></i>` 
            : `<i class="fa-solid fa-circle-exclamation checklist-icon-warning"></i>`;
        
        item.innerHTML = `
            ${icon}
            <span>${check.label}</span>
        `;
        checklist.appendChild(item);
    });

    // Tab 3: Action Suggestions Checklist
    const list = document.getElementById('analysis-suggestions-list');
    list.innerHTML = '';
    
    const suggs = JSON.parse(report.suggestions);
    if (suggs && suggs.length > 0) {
        suggs.forEach(sug => {
            const li = document.createElement('li');
            li.textContent = sug;
            list.appendChild(li);
        });
    } else {
        list.innerHTML = `<li>No recommendations found. Your resume satisfies standard parsing structures.</li>`;
    }

    // Unhide report panel
    document.getElementById('analysis-report-container').classList.remove('hidden');
}

// 5. Setup Tab View Swappers
function setupTabControls() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            const parent = btn.closest('.analysis-details-tabs');
            
            // Manage Active Classes
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            parent.querySelector(`#${target}`).classList.add('active');
        });
    });
}

// 6. Job Description Match Comparison Engine
window.populateMatcherResumes = async function() {
    const select = document.getElementById('matcher-resume-select');
    select.innerHTML = `<option value="">-- Choose a Resume --</option>`;

    toggleLoader(true, 'Fetching saved resumes...');
    try {
        const response = await fetch('http://localhost:8080/api/resumes', {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const resumes = await response.json();
            resumes.forEach(res => {
                const opt = document.createElement('option');
                opt.value = res.id;
                opt.textContent = res.title + (res.isUploaded ? ' (PDF)' : ' (Builder)');
                select.appendChild(opt);
            });
            
            // Prefill selection if coming from detailed click
            if (window.analyzerSelectId) {
                select.value = window.analyzerSelectId;
                window.analyzerSelectId = null;
            }
        }
    } catch (e) {
        showToast('Error syncing user resumes lists.', 'error');
    } finally {
        toggleLoader(false);
    }
};

async function runJobDescriptionMatch() {
    const select = document.getElementById('matcher-resume-select');
    const jdText = document.getElementById('matcher-jd-text').value;
    const jdTitle = document.getElementById('matcher-jd-title').value;
    const matchBtn = document.getElementById('btn-run-match');

    const resumeId = select.value;
    if (!resumeId) {
        showToast('Please select a saved resume profile to compare.', 'error');
        return;
    }

    if (!jdText.trim()) {
        showToast('Please paste a Target Job Description.', 'error');
        return;
    }

    matchBtn.disabled = true;
    toggleLoader(true, 'Comparing resume with job description...');

    try {
        const response = await fetch('http://localhost:8080/api/analysis/match', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                resumeId: resumeId,
                jobDescription: jdText,
                jobTitle: jdTitle || 'Target Comparison Match'
            })
        });

        if (response.ok) {
            const report = await response.json();
            showToast('Evaluation complete!', 'success');
            renderJobMatcherReport(report);
        } else {
            showToast('Failed to analyze comparison match.', 'error');
        }
    } catch (e) {
        showToast('Network error during comparison.', 'error');
    } finally {
        matchBtn.disabled = false;
        toggleLoader(false);
    }
}

function renderJobMatcherReport(report) {
    const scoreVal = report.atsScore;
    document.getElementById('match-percent-value').textContent = scoreVal + '%';

    const banner = document.getElementById('match-verdict-banner');
    const icon = document.getElementById('match-verdict-icon');
    const title = document.getElementById('match-verdict-title');
    const desc = document.getElementById('match-verdict-description');

    // Reset verdict styling
    banner.classList.remove('success', 'warning', 'danger');

    if (scoreVal >= 85) {
        banner.classList.add('success');
        icon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
        title.textContent = 'Excellent Match!';
        desc.textContent = 'Your resume aligns perfectly with the target job profile keywords. Highly competitive!';
    } else if (scoreVal >= 55) {
        banner.classList.add('warning');
        icon.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>`;
        title.textContent = 'Solid Fit (Tailoring Recommended)';
        desc.textContent = 'Your profile is highly relevant, but integrating the missing keywords listed below will raise performance.';
    } else {
        banner.classList.add('danger');
        icon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
        title.textContent = 'Weak Match';
        desc.textContent = 'Several key technologies are missing from your resume. Incorporate relevant details to satisfy parsing checks.';
    }

    // Inject Keyword overlaps lists
    const matchedContainer = document.getElementById('matcher-matched-chips');
    matchedContainer.innerHTML = '';
    
    const missingContainer = document.getElementById('matcher-missing-chips');
    missingContainer.innerHTML = '';

    // Load matches
    const rawData = JSON.parse(report.rawAnalysisJson);
    const scorePct = report.keywordScore;

    if (report.missingKeywords && report.missingKeywords.trim()) {
        const missing = report.missingKeywords.split(',').map(m => m.trim());
        missing.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'chip chip-error';
            span.innerHTML = `<i class="fa-solid fa-plus"></i> ${tag}`;
            missingContainer.appendChild(span);
        });
    } else {
        missingContainer.innerHTML = `<p class="helper-text" style="color: var(--accent-green);"><i class="fa-solid fa-circle-check"></i> 100% overlap with target job description terms!</p>`;
    }

    // Generate simulated matches list for user display
    const simulatedTechs = ["java", "spring boot", "sql", "javascript", "react", "html", "css", "git", "rest api"];
    let hasMatches = false;

    simulatedTechs.forEach(t => {
        if (!report.missingKeywords.includes(t)) {
            hasMatches = true;
            const span = document.createElement('span');
            span.className = 'chip chip-success';
            span.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${t}`;
            matchedContainer.appendChild(span);
        }
    });

    if (!hasMatches) {
        matchedContainer.innerHTML = `<p class="helper-text">No technical skills detected matching the requirements.</p>`;
    }

    // Unhide results
    document.getElementById('matcher-results-container').classList.remove('hidden');
}

// 7. Load details when coming from dashboard click
window.addEventListener('hashchange', checkCustomDeepLink);
function checkCustomDeepLink() {
    if (window.analyzerSelectId && document.getElementById('analyzer-view').classList.contains('hidden') === false) {
        loadExistingAnalysis(window.analyzerSelectId);
    }
}

async function loadExistingAnalysis(resumeId) {
    toggleLoader(true, 'Fetching analysis data...');
    try {
        const response = await fetch(`http://localhost:8080/api/analysis/resume/${resumeId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const report = await response.json();
            if (report && report.atsScore !== undefined) {
                renderAnalysisReport(report, 'Resume Profile scan');
                window.analyzerSelectId = null;
            } else {
                showToast('No parsed analysis results found. Trigger fresh evaluation scan.', 'info');
                // Auto fill the drag inputs if possible
                document.getElementById('analyzer-resume-title').value = 'Evaluation Scan';
            }
        }
    } catch (e) {
        showToast('Error syncing details.', 'error');
    } finally {
        toggleLoader(false);
    }
}
