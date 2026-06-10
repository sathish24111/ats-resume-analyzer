/**
 * ATS Resume Analyzer & Builder - Core JS Engine
 * Handles State, Sessions, Navigation, Themes, and Dashboard Stats
 */

const API_BASE = 'http://localhost:8080/api'; // Standard backend port configured in application.properties

// Global Application State
window.AppState = {
    token: localStorage.getItem('ats_token') || null,
    user: null,
    resumes: [],
    stats: {
        total: 0,
        avgAts: 0,
        uploaded: 0,
        bestMatch: 0
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// 1. Initialize Application
async function initApp() {
    setupEventListeners();
    setupTheme();
    
    // Check if session token exists
    if (window.AppState.token) {
        const success = await fetchUserProfile();
        if (success) {
            showAuthenticatedView();
        } else {
            clearSession();
            showView('auth-view');
        }
    } else {
        showView('auth-view');
    }
}

// 2. Set up Event Listeners
function setupEventListeners() {
    // Navigation routing
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            
            // Manage active class
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            showView(target);
            onViewChange(target);
        });
    });

    // Theme Toggle Listener
    const themeCheckbox = document.getElementById('theme-checkbox');
    themeCheckbox.addEventListener('change', () => {
        toggleTheme(themeCheckbox.checked);
    });

    // Auth Form Toggles
    document.getElementById('toggle-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('auth-title').textContent = 'Create Account';
        document.getElementById('auth-subtitle').textContent = 'Sign up to build and scan optimized resumes';
    });

    document.getElementById('toggle-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('auth-title').textContent = 'Welcome Back';
        document.getElementById('auth-subtitle').textContent = 'Login to scan and elevate your resume';
    });

    // Login Submission
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Register Submission
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Logout Click
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Dashboard Action Buttons Redirect
    document.getElementById('dash-new-resume').addEventListener('click', () => {
        navigateToView('builder-view');
    });
    
    document.getElementById('dash-scan-resume').addEventListener('click', () => {
        navigateToView('analyzer-view');
    });
}

// 3. View Routing & Navigation
function showView(viewId) {
    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');
}

function navigateToView(viewId) {
    const link = document.querySelector(`.nav-link[data-target="${viewId}"]`);
    if (link) {
        link.click();
    } else {
        showView(viewId);
        onViewChange(viewId);
    }
}

async function onViewChange(viewId) {
    if (viewId === 'dashboard-view') {
        await refreshDashboard();
    } else if (viewId === 'builder-view') {
        if (typeof window.initBuilder === 'function') {
            window.initBuilder();
        }
    } else if (viewId === 'matcher-view') {
        if (typeof window.populateMatcherResumes === 'function') {
            window.populateMatcherResumes();
        }
    } else if (viewId === 'admin-view') {
        await refreshAdminDashboard();
    }
}

// 4. Authentication Logic
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    toggleLoader(true, 'Authenticating user...');

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.AppState.token = data.token;
            localStorage.setItem('ats_token', data.token);
            
            window.AppState.user = {
                id: data.userId,
                email: data.email,
                fullName: data.fullName,
                role: data.role
            };

            showToast('Welcome back, ' + data.fullName + '!', 'success');
            showAuthenticatedView();
        } else {
            showToast(data.error || 'Login failed. Check your credentials.', 'error');
        }
    } catch (err) {
        showToast('Network error during authentication.', 'error');
    } finally {
        toggleLoader(false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (!fullName || !email || !password) {
        showToast('Please fill out all required register fields.', 'error');
        return;
    }

    toggleLoader(true, 'Creating account...');

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });

        const data = await response.json();

        if (response.status === 201) {
            showToast('Registration successful! Please log in.', 'success');
            document.getElementById('toggle-to-login').click();
            document.getElementById('login-email').value = email;
        } else {
            showToast(data.error || 'Registration failed.', 'error');
        }
    } catch (err) {
        showToast('Network error during registration.', 'error');
    } finally {
        toggleLoader(false);
    }
}

async function handleLogout(e) {
    e.preventDefault();
    toggleLoader(true, 'Logging out...');
    
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (err) {
        // Suppress network errors on logout, proceed to local clean up
    } finally {
        clearSession();
        showToast('Signed out successfully.', 'info');
        toggleLoader(false);
        showView('auth-view');
    }
}

async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            window.AppState.user = data;
            return true;
        }
        return false;
    } catch (err) {
        return false;
    }
}

function showAuthenticatedView() {
    document.getElementById('sidebar').classList.remove('hidden');
    
    // Bind profile text info
    document.getElementById('user-display-name').textContent = window.AppState.user.fullName;
    document.getElementById('user-display-role').textContent = window.AppState.user.role === 'ADMIN' ? 'Platform Administrator' : 'Applicant Developer';
    
    // Manage administrator visual features
    if (window.AppState.user.role === 'ADMIN') {
        document.getElementById('admin-nav-link').classList.remove('hidden');
    } else {
        document.getElementById('admin-nav-link').classList.add('hidden');
    }

    // Set form fields defaults to avoid leftovers
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';

    navigateToView('dashboard-view');
}

function clearSession() {
    window.AppState.token = null;
    window.AppState.user = null;
    window.AppState.resumes = [];
    localStorage.removeItem('ats_token');
    document.getElementById('sidebar').classList.add('hidden');
}

// 5. Dashboard Data Fetching & Rendering
async function refreshDashboard() {
    toggleLoader(true, 'Refreshing dashboard data...');
    try {
        // 1. Fetch user resumes
        const resResponse = await fetch(`${API_BASE}/resumes`, {
            headers: getAuthHeaders()
        });
        
        if (resResponse.ok) {
            window.AppState.resumes = await resResponse.json();
            await populateResumesTable();
            await calculateDashboardStats();
        } else {
            showToast('Failed to fetch resumes.', 'error');
        }
    } catch (err) {
        showToast('Connection to server failed. Start server on port 8080.', 'error');
    } finally {
        toggleLoader(false);
    }
}

async function populateResumesTable() {
    const tbody = document.getElementById('resumes-table-body');
    tbody.innerHTML = '';

    if (window.AppState.resumes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">No resumes found. Start by building or uploading one!</td></tr>`;
        return;
    }

    for (const resume of window.AppState.resumes) {
        // Fetch latest analysis score for each resume
        let scoreText = `<span class="badge badge-blue">Pending</span>`;
        let scoreVal = 0;
        try {
            const scoreRes = await fetch(`${API_BASE}/analysis/resume/${resume.id}`, {
                headers: getAuthHeaders()
            });
            if (scoreRes.ok) {
                const analysis = await scoreRes.json();
                if (analysis && analysis.atsScore !== undefined) {
                    scoreVal = analysis.atsScore;
                    const badgeClass = scoreVal >= 80 ? 'badge-green' : (scoreVal >= 50 ? 'badge-blue' : 'badge-error');
                    scoreText = `<span class="badge ${badgeClass} badge-score">${scoreVal}%</span>`;
                }
            }
        } catch (e) {
            // Ignore minor errors fetching individuals
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${resume.title}</strong></td>
            <td><span class="badge badge-purple">${resume.isUploaded ? 'PDF Upload' : 'Dynamic Builder'}</span></td>
            <td>${new Date(resume.createdAt || Date.now()).toLocaleDateString()}</td>
            <td>${scoreText}</td>
            <td class="actions-cell">
                <button class="btn-icon" onclick="editResume(${resume.id}, ${resume.isUploaded})" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>
                <button class="btn-icon" onclick="analyzeResume(${resume.id})" title="View Details"><i class="fa-solid fa-magnifying-glass-chart"></i></button>
                <button class="btn-icon delete" onclick="deleteResume(${resume.id})" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

async function calculateDashboardStats() {
    const resumes = window.AppState.resumes;
    const count = resumes.length;
    let sumAts = 0;
    let analyzedCount = 0;
    let uploadedCount = 0;
    let highestAts = 0;

    for (const r of resumes) {
        if (r.isUploaded) uploadedCount++;
        try {
            const aRes = await fetch(`${API_BASE}/analysis/resume/${r.id}`, {
                headers: getAuthHeaders()
            });
            if (aRes.ok) {
                const analysis = await aRes.json();
                if (analysis && analysis.atsScore !== undefined) {
                    sumAts += analysis.atsScore;
                    analyzedCount++;
                    if (analysis.atsScore > highestAts) {
                        highestAts = analysis.atsScore;
                    }
                }
            }
        } catch (err) {}
    }

    const avg = analyzedCount > 0 ? Math.round(sumAts / analyzedCount) : 0;

    // Set in State
    window.AppState.stats = {
        total: count,
        avgAts: avg,
        uploaded: uploadedCount,
        bestMatch: highestAts
    };

    // Bind to DOM
    document.getElementById('stat-total-resumes').textContent = count;
    document.getElementById('stat-avg-ats').textContent = avg + '%';
    document.getElementById('stat-uploaded-count').textContent = uploadedCount;
    document.getElementById('stat-best-match').textContent = highestAts + '%';
}

// 6. Global Actions mapped to window context
window.editResume = function(id, isUploaded) {
    if (isUploaded) {
        showToast('PDF uploaded resumes cannot be modified. Rescan a fresh file under ATS Analyzer.', 'info');
        return;
    }
    // Set edit resume ID on builder state
    window.builderEditId = id;
    navigateToView('builder-view');
};

window.analyzeResume = function(id) {
    window.analyzerSelectId = id;
    navigateToView('analyzer-view');
};

window.deleteResume = async function(id) {
    if (!confirm('Are you sure you want to permanently delete this resume and its analysis history?')) return;
    
    toggleLoader(true, 'Deleting resume...');
    try {
        const response = await fetch(`${API_BASE}/resumes/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (response.ok) {
            showToast('Resume deleted successfully.', 'success');
            await refreshDashboard();
        } else {
            showToast('Failed to delete resume.', 'error');
        }
    } catch (e) {
        showToast('Connection failed during delete.', 'error');
    } finally {
        toggleLoader(false);
    }
};

// 7. Admin View Integrations
async function refreshAdminDashboard() {
    toggleLoader(true, 'Gathering administrative metrics...');
    try {
        // Fetch stats
        const statsRes = await fetch(`${API_BASE}/admin/stats`, { headers: getAuthHeaders() });
        if (statsRes.ok) {
            const stats = await statsRes.json();
            document.getElementById('admin-stat-users').textContent = stats.totalUsers;
            document.getElementById('admin-stat-resumes').textContent = stats.totalResumes;
            document.getElementById('admin-stat-avg-score').textContent = stats.averageAtsScore + '%';
        }

        // Fetch users list
        const usersRes = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
        if (usersRes.ok) {
            const users = await usersRes.json();
            const tbody = document.getElementById('admin-users-table-body');
            tbody.innerHTML = '';
            
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.id}</td>
                    <td><strong>${u.fullName}</strong></td>
                    <td>${u.email}</td>
                    <td><span class="badge ${u.role === 'ADMIN' ? 'badge-green' : 'badge-purple'}">${u.role}</span></td>
                    <td>
                        <button class="btn-icon delete" onclick="deleteUserAccount(${u.id})" ${u.id === window.AppState.user.id ? 'disabled' : ''}>
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Fetch builder styles templates listing
        const templatesRes = await fetch(`${API_BASE}/admin/templates`, { headers: getAuthHeaders() });
        if (templatesRes.ok) {
            const templates = await templatesRes.json();
            const container = document.getElementById('admin-templates-container');
            container.innerHTML = '';
            
            templates.forEach(t => {
                const div = document.createElement('div');
                div.className = 'admin-template-item';
                div.innerHTML = `
                    <div class="template-meta">
                        <h4>${t.name}</h4>
                        <span>Layout configuration: ${t.id}</span>
                    </div>
                    <div>
                        <span class="badge badge-green">Active</span>
                    </div>
                `;
                container.appendChild(div);
            });
        }
    } catch (e) {
        showToast('Failed to load administrator metrics.', 'error');
    } finally {
        toggleLoader(false);
    }
}

window.deleteUserAccount = async function(id) {
    if (!confirm('Are you sure you want to delete this user? All their resumes and logs will be deleted!')) return;
    
    toggleLoader(true, 'Removing user...');
    try {
        const res = await fetch(`${API_BASE}/admin/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            showToast('User account successfully removed.', 'success');
            await refreshAdminDashboard();
        } else {
            showToast('Failed to delete user account.', 'error');
        }
    } catch (e) {
        showToast('Error sending delete query.', 'error');
    } finally {
        toggleLoader(false);
    }
};

// 8. Shared Helpers
window.getAuthHeaders = function() {
    return {
        'X-Session-Token': window.AppState.token,
        'Content-Type': 'application/json'
    };
};

// Theme Management
function setupTheme() {
    const preference = localStorage.getItem('theme_preference') || 'dark';
    const body = document.body;
    const themeCheckbox = document.getElementById('theme-checkbox');
    const textEl = document.querySelector('.theme-mode-text');
    
    if (preference === 'dark') {
        body.className = 'dark-theme';
        themeCheckbox.checked = true;
        textEl.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
    } else {
        body.className = 'light-theme';
        themeCheckbox.checked = false;
        textEl.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
    }
}

function toggleTheme(isDark) {
    const body = document.body;
    const textEl = document.querySelector('.theme-mode-text');
    if (isDark) {
        body.className = 'dark-theme';
        localStorage.setItem('theme_preference', 'dark');
        textEl.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
    } else {
        body.className = 'light-theme';
        localStorage.setItem('theme_preference', 'light');
        textEl.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
    }
}

// Fullscreen Loading Handler
window.toggleLoader = function(show, text = 'Loading...') {
    const loader = document.getElementById('app-loader');
    const label = document.getElementById('loader-text');
    label.textContent = text;
    if (show) {
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
};

// Toast Notifications System
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    else if (type === 'error') icon = 'fa-circle-exclamation';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Automatically fade out and delete
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};
