import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ResumeBuilder from './components/ResumeBuilder';
import AtsAnalyzer from './components/AtsAnalyzer';
import JobMatcher from './components/JobMatcher';
import AdminPanel from './components/AdminPanel';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeView, setActiveView] = useState('dashboard');
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState(''); // Extra field for demo registration as ADMIN
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync theme class with body
  useEffect(() => {
    document.body.className = isDark ? 'dark-theme' : 'light-theme';
  }, [isDark]);

  // Load User profile if token exists
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchUserProfile = async () => {
    setGlobalLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        showToast(data.error || 'Session expired. Please log in again.', 'error');
        logout();
      }
    } catch (err) {
      showToast('Cannot connect to ATS backend server.', 'error');
      logout();
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setGlobalLoading(true);
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { email, password }
      : { fullName, email, password, role: adminKey === 'admin123' ? 'ADMIN' : 'USER' };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        const name = data.fullName || (data.user && data.user.fullName) || 'User';
        showToast(isLogin ? `Welcome back, ${name}!` : 'Account registered successfully!', 'success');
        setToken(data.token);
        // Clear fields
        setPassword('');
        setAdminKey('');
      } else {
        showToast(data.error || 'Authentication failed', 'error');
      }
    } catch (err) {
      showToast('Network error connecting to auth service.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setActiveView('dashboard');
    setActiveResumeId(null);
    showToast('Logged out successfully', 'info');
  };

  return (
    <>
      {/* Toast System */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <i className={
              t.type === 'success' ? 'fa-solid fa-circle-check' :
              t.type === 'error' ? 'fa-solid fa-circle-exclamation' :
              'fa-solid fa-circle-info'
            }></i>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Global Loader */}
      {globalLoading && (
        <div className="app-loader-container">
          <div className="spinner"></div>
          <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Analyzing Systems...</p>
        </div>
      )}

      {!user ? (
        // Premium Glassmorphic Hero Landing Page
        <div className="landing-container">
          {/* Top Navbar */}
          <header className="landing-header">
            <div className="brand">
              <div className="brand-icon">
                <i className="fa-solid fa-rocket"></i>
              </div>
              <span>ATS NEXUS</span>
            </div>
            <div className="landing-nav-actions">
              <button className="btn btn-secondary" onClick={() => { setIsLogin(true); setShowAuthModal(true); }}>
                <i className="fa-solid fa-right-to-bracket"></i> Sign In
              </button>
              <button className="btn btn-primary" onClick={() => { setIsLogin(false); setShowAuthModal(true); }}>
                Get Started
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <section className="landing-hero">
            <div className="hero-content">
              <div className="badge-glow">
                <i className="fa-solid fa-bolt"></i> Next-Gen ATS Algorithmic Engine
              </div>
              <h1>
                Optimize Your Resume.<br />
                <span className="text-gradient">Land 10x More Interviews.</span>
              </h1>
              <p className="hero-subtitle">
                ATS Nexus is a state-of-the-art Applicant Tracking System simulator. Reverse-engineer recruiting filters, bypass automated barriers, scan formatting defects, and match keywords with 100% precision.
              </p>
              <div className="hero-cta-buttons">
                <button className="btn btn-primary btn-lg" onClick={() => { setIsLogin(false); setShowAuthModal(true); }}>
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Audit Your Resume Free
                </button>
                <a href="#features" className="btn btn-secondary btn-lg">
                  Explore Ecosystem
                </a>
              </div>
            </div>

            {/* Glowing Interactive Graphic / Stats Grid */}
            <div className="hero-visual">
              <div className="glass-graphic-card main-gauge">
                <div className="visual-score-circle">
                  <span>88</span>
                  <span className="pct">%</span>
                </div>
                <h3>ATS MATCH FACTOR</h3>
                <p>Highly Compatible with Enterprise Systems</p>
              </div>

              <div className="visual-badge-floating tag-skills">
                <i className="fa-solid fa-check-double"></i> 40% Skills Score
              </div>
              <div className="visual-badge-floating tag-keywords">
                <i className="fa-solid fa-keyboard"></i> 30% Keyword Density
              </div>
              <div className="visual-badge-floating tag-verbs">
                <i className="fa-solid fa-fire"></i> 20% Action Verbs
              </div>
              <div className="visual-badge-floating tag-format">
                <i className="fa-solid fa-border-all"></i> 10% Formatting
              </div>
            </div>
          </section>

          {/* Core Features Grid */}
          <section id="features" className="landing-features">
            <div className="section-title-wrapper">
              <h2>Engineered for Job Seekers & Administrators</h2>
              <p>Everything you need to beat recruiters' black-box algorithms and manage talent pipelines.</p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon bg-blue">
                  <i className="fa-solid fa-file-pen"></i>
                </div>
                <h3>Interactive Resume Builder</h3>
                <p>Build stunning ATS-compliant resumes with responsive dynamic templates inside our sleek markdown-backed visual designer.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-purple">
                  <i className="fa-solid fa-gauge-high"></i>
                </div>
                <h3>ATS Audit Scanner</h3>
                <p>Scan PDF and DOCX documents via Apache POI and PDFBox engines to obtain deep keyword, contact info, and structural checklists.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-cyan">
                  <i className="fa-solid fa-code-compare"></i>
                </div>
                <h3>Job JD Matcher</h3>
                <p>Paste any corporate job description to calculate exact technical keyword overlaps, classify skill pools, and retrieve missing tags.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-green">
                  <i className="fa-solid fa-users-cog"></i>
                </div>
                <h3>Administrative Analytics</h3>
                <p>Manage users, compile system logs, audit resume counts, and monitor templates utilizing Spring Boot JWT stateless control boards.</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="landing-footer">
            <p>&copy; 2026 ATS Nexus Portal. Crafted for maximum career acceleration.</p>
          </footer>

          {/* Auth Modal Overlay */}
          {showAuthModal && (
            <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
              <div className="auth-card modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" title="Close" onClick={() => setShowAuthModal(false)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
                <div className="auth-header">
                  <div className="brand auth-brand">
                    <div className="brand-icon">
                      <i className="fa-solid fa-rocket"></i>
                    </div>
                    <span>ATS NEXUS</span>
                  </div>
                  <h2>{isLogin ? 'Sign In to Portal' : 'Create ATS Account'}</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {isLogin 
                      ? 'Access your resume scorecards and builder' 
                      : 'Start optimizing your career documents today'}
                  </p>
                </div>

                <form onSubmit={handleAuth}>
                  {!isLogin && (
                    <div className="form-group">
                      <label htmlFor="fullname">Full Name</label>
                      <div className="input-wrapper">
                        <i className="fa-solid fa-user"></i>
                        <input 
                          type="text" 
                          id="fullname" 
                          placeholder="John Doe" 
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <div className="input-wrapper">
                      <i className="fa-solid fa-envelope"></i>
                      <input 
                        type="email" 
                        id="email" 
                        placeholder="john@example.com" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-wrapper">
                      <i className="fa-solid fa-lock"></i>
                      <input 
                        type="password" 
                        id="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="form-group">
                      <label htmlFor="adminKey">Admin Invitation Key (Optional)</label>
                      <div className="input-wrapper">
                        <i className="fa-solid fa-key"></i>
                        <input 
                          type="password" 
                          id="adminKey" 
                          placeholder="For administrator capabilities" 
                          value={adminKey}
                          onChange={e => setAdminKey(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }} disabled={globalLoading}>
                    {globalLoading ? (
                      <>
                        <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}></div>
                        Connecting...
                      </>
                    ) : isLogin ? (
                      <>
                        <i className="fa-solid fa-right-to-bracket"></i> Login to Portal
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-user-plus"></i> Register Profile
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-toggle">
                  {isLogin ? (
                    <p>Don't have an account? <span style={{ color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setIsLogin(false)}>Sign up</span></p>
                  ) : (
                    <p>Already have an account? <span style={{ color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setIsLogin(true)}>Log in</span></p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Authenticated App Shell
        <div className="app-wrapper">
          {/* Navigation Sidebar */}
          <aside className="sidebar-nav">
            <div className="sidebar-header">
              <div className="brand">
                <div className="brand-icon">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <span>ATS NEXUS</span>
              </div>
            </div>

            <nav className="nav-links">
              <div 
                className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveView('dashboard'); setActiveResumeId(null); }}
              >
                <i className="fa-solid fa-chart-pie"></i>
                <span>Dashboard</span>
              </div>

              <div 
                className={`nav-link ${activeView === 'builder' ? 'active' : ''}`}
                onClick={() => { setActiveView('builder'); setActiveResumeId(null); }}
              >
                <i className="fa-solid fa-file-pen"></i>
                <span>Resume Builder</span>
              </div>

              <div 
                className={`nav-link ${activeView === 'analyzer' ? 'active' : ''}`}
                onClick={() => { setActiveView('analyzer'); setActiveResumeId(null); }}
              >
                <i className="fa-solid fa-gauge-high"></i>
                <span>ATS Analyzer</span>
              </div>

              <div 
                className={`nav-link ${activeView === 'matcher' ? 'active' : ''}`}
                onClick={() => { setActiveView('matcher'); setActiveResumeId(null); }}
              >
                <i className="fa-solid fa-code-compare"></i>
                <span>Job JD Matcher</span>
              </div>

              {user.role === 'ADMIN' && (
                <div 
                  className={`nav-link ${activeView === 'admin' ? 'active' : ''}`}
                  onClick={() => { setActiveView('admin'); setActiveResumeId(null); }}
                >
                  <i className="fa-solid fa-users-cog"></i>
                  <span>Admin Panel</span>
                </div>
              )}
            </nav>

            <div className="sidebar-footer">
              <div className="theme-toggle-container">
                <span>Theme Mode</span>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={isDark} 
                    onChange={() => setIsDark(!isDark)} 
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="user-profile-menu">
                <div className="user-avatar">
                  <i className="fa-solid fa-circle-user"></i>
                </div>
                <div className="user-info">
                  <span className="user-name">{user.fullName}</span>
                  <span className="user-role">{user.role} Account</span>
                </div>
                <button className="btn-logout" title="Log out" onClick={logout}>
                  <i className="fa-solid fa-power-off"></i>
                </button>
              </div>
            </div>
          </aside>

          {/* Main workspace container */}
          <main className="main-content">
            {activeView === 'dashboard' && (
              <Dashboard 
                user={user} 
                token={token} 
                showToast={showToast} 
                setActiveView={setActiveView} 
                setActiveResumeId={setActiveResumeId}
              />
            )}
            {activeView === 'builder' && (
              <ResumeBuilder 
                user={user} 
                token={token} 
                showToast={showToast} 
                activeResumeId={activeResumeId}
                setActiveResumeId={setActiveResumeId}
              />
            )}
            {activeView === 'analyzer' && (
              <AtsAnalyzer 
                user={user} 
                token={token} 
                showToast={showToast} 
              />
            )}
            {activeView === 'matcher' && (
              <JobMatcher 
                user={user} 
                token={token} 
                showToast={showToast} 
              />
            )}
            {activeView === 'admin' && user.role === 'ADMIN' && (
              <AdminPanel 
                user={user} 
                token={token} 
                showToast={showToast} 
              />
            )}
          </main>
        </div>
      )}
    </>
  );
}

export default App;
