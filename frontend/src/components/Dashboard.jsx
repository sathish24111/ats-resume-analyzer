import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function Dashboard({ user, token, showToast, setActiveView, setActiveResumeId }) {
  const [resumes, setResumes] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchResumesAndScores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/resumes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setResumes(data);
        await fetchScores(data);
      } else {
        showToast(data.error || 'Failed to fetch resumes.', 'error');
      }
    } catch (err) {
      showToast('Network error loading profiles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchScores = async (resumeList) => {
    const scoreMap = {};
    await Promise.all(resumeList.map(async (resume) => {
      try {
        const res = await fetch(`${API_URL}/analysis/resume/${resume.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            scoreMap[resume.id] = data;
          }
        }
      } catch (e) {
        console.error("Error fetching analysis score", e);
      }
    }));
    setScores(scoreMap);
  };

  useEffect(() => {
    fetchResumesAndScores();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this resume profile?')) return;
    try {
      const res = await fetch(`${API_URL}/resumes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Profile deleted successfully.', 'success');
        setResumes(prev => prev.filter(r => r.id !== id));
      } else {
        showToast(data.error || 'Failed to delete resume.', 'error');
      }
    } catch (err) {
      showToast('Network error deleting resume.', 'error');
    }
  };

  const handleQuickScan = async (id) => {
    try {
      showToast('Initiating parser scanning...', 'info');
      const res = await fetch(`${API_URL}/analysis/resume/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`ATS Scan Complete! Score: ${data.atsScore}%`, 'success');
        setScores(prev => ({ ...prev, [id]: data }));
      } else {
        showToast(data.error || 'Scan failed.', 'error');
      }
    } catch (err) {
      showToast('Network error during scan.', 'error');
    }
  };

  // Math Statistics
  const totalProfiles = resumes.length;
  const scannedResumes = Object.values(scores);
  const avgAtsScore = scannedResumes.length > 0
    ? Math.round(scannedResumes.reduce((sum, s) => sum + s.atsScore, 0) / scannedResumes.length)
    : 0;
  const jobMatchesRun = scannedResumes.filter(s => s.rawAnalysisJson?.jdMode).length;
  const pdfAudits = resumes.filter(r => r.isUploaded).length;

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h1>Welcome back, {user.fullName}</h1>
          <p>Optimize your resume profiles and track matching scorecard heuristics</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setActiveView('analyzer')}>
            <i className="fa-solid fa-cloud-arrow-up"></i> Upload PDF
          </button>
          <button className="btn btn-primary" onClick={() => { setActiveResumeId(null); setActiveView('builder'); }}>
            <i className="fa-solid fa-plus"></i> Create Resume
          </button>
        </div>
      </div>

      {/* Statistics Metric Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-blue">
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div className="stat-details">
            <h3>Total Profiles</h3>
            <span className="stat-number">{totalProfiles}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-purple">
            <i className="fa-solid fa-gauge-high"></i>
          </div>
          <div className="stat-details">
            <h3>Avg ATS Rating</h3>
            <span className="stat-number">{avgAtsScore}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-cyan">
            <i className="fa-solid fa-code-compare"></i>
          </div>
          <div className="stat-details">
            <h3>Job Matches Run</h3>
            <span className="stat-number">{jobMatchesRun}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-green">
            <i className="fa-solid fa-file-pdf"></i>
          </div>
          <div className="stat-details">
            <h3>PDF Uploads</h3>
            <span className="stat-number">{pdfAudits}</span>
          </div>
        </div>
      </div>

      {/* Main split dashboard panels */}
      <div className="dashboard-grid">
        {/* Left pane - Resumes List */}
        <div className="grid-card">
          <div className="card-header">
            <h2>Resume Profiles & Scorecards</h2>
            <p className="card-subtitle">Manage documents and initiate fast scanning parser engine checks</p>
          </div>

          {loading ? (
            <div className="text-center" style={{ padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p>Fetching resume scorecards...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center" style={{ padding: '4rem 2rem', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
              <i className="fa-solid fa-folder-open" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
              <h3>No Resume Profiles Found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Create a professional template using the interactive Builder, or upload an existing PDF resume.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => setActiveView('builder')}>
                  <i className="fa-solid fa-plus"></i> Launch Builder
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveView('analyzer')}>
                  <i className="fa-solid fa-cloud-arrow-up"></i> Upload PDF Resume
                </button>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="ats-table">
                <thead>
                  <tr>
                    <th>Resume Title</th>
                    <th>Origin Type</th>
                    <th>ATS score</th>
                    <th>Created On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resumes.map(resume => {
                    const analysis = scores[resume.id];
                    const score = analysis?.atsScore;
                    
                    return (
                      <tr key={resume.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{resume.title}</span>
                          {resume.personalDetails?.title && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {resume.personalDetails.title}
                            </span>
                          )}
                        </td>
                        <td>
                          {resume.isUploaded ? (
                            <span className="badge badge-purple">
                              <i className="fa-solid fa-file-pdf" style={{ marginRight: '0.25rem' }}></i> PDF Uploaded
                            </span>
                          ) : (
                            <span className="badge badge-blue">
                              <i className="fa-solid fa-file-lines" style={{ marginRight: '0.25rem' }}></i> Web Builder
                            </span>
                          )}
                        </td>
                        <td>
                          {score !== undefined ? (
                            <span className={`badge badge-score ${
                              score >= 80 ? 'badge-green' :
                              score >= 50 ? 'badge-blue' :
                              'badge-error'
                            }`}>
                              {score}%
                            </span>
                          ) : (
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }} onClick={() => handleQuickScan(resume.id)}>
                              <i className="fa-solid fa-arrows-rotate"></i> Scan Now
                            </button>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(resume.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            {!resume.isUploaded ? (
                              <button 
                                className="btn-icon" 
                                title="Edit Builder Data"
                                onClick={() => { setActiveResumeId(resume.id); setActiveView('builder'); }}
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                            ) : (
                              <button 
                                className="btn-icon" 
                                title="Cannot edit uploaded PDF"
                                disabled
                                style={{ opacity: 0.3, cursor: 'not-allowed' }}
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                            )}
                            <button 
                              className="btn-icon" 
                              title="Re-Scan ATS Scores"
                              onClick={() => handleQuickScan(resume.id)}
                            >
                              <i className="fa-solid fa-arrows-rotate"></i>
                            </button>
                            <button 
                              className="btn-icon" 
                              title="Compare with Job Description"
                              onClick={() => { setActiveResumeId(resume.id); setActiveView('matcher'); }}
                            >
                              <i className="fa-solid fa-code-compare"></i>
                            </button>
                            <button 
                              className="btn-icon delete" 
                              title="Delete Profile"
                              onClick={() => handleDelete(resume.id)}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right pane - Custom ATS Insights */}
        <div className="grid-card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h2>ATS Guidelines Check</h2>
            <p className="card-subtitle">Verify layout and standard parsing parameters</p>
          </div>

          <div className="insights-list">
            <div className="insight-item">
              <span className="insight-bullet">
                <i className="fa-solid fa-circle-check" style={{ color: 'var(--accent-green)' }}></i>
              </span>
              <div className="insight-body">
                <h4>Single-Column Layout</h4>
                <p>Ensure template flows top-to-bottom. Multi-column tables often confuse older ATS systems and result in parsing errors.</p>
              </div>
            </div>

            <div className="insight-item">
              <span className="insight-bullet">
                <i className="fa-solid fa-circle-check" style={{ color: 'var(--accent-green)' }}></i>
              </span>
              <div className="insight-body">
                <h4>Action Verbs Density</h4>
                <p>Start your experience bullet points with strong verbs such as <i>automated</i>, <i>spearheaded</i>, or <i>engineered</i>.</p>
              </div>
            </div>

            <div className="insight-item">
              <span className="insight-bullet">
                <i className="fa-solid fa-circle-check" style={{ color: 'var(--accent-green)' }}></i>
              </span>
              <div className="insight-body">
                <h4>Keyword Matching</h4>
                <p>ATS scanners look for intersections of hard skills. Tailor your skills to match keywords explicitly highlighted in job listings.</p>
              </div>
            </div>

            <div className="insight-item">
              <span className="insight-bullet">
                <i className="fa-solid fa-circle-check" style={{ color: 'var(--accent-green)' }}></i>
              </span>
              <div className="insight-body">
                <h4>Standard Fonts</h4>
                <p>Use clean web-safe fonts such as Inter, Outfit, or Georgia. Avoid decorative custom fonts which may fail text encoders.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
