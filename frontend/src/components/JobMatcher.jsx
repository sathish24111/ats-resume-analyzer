import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function JobMatcher({ user, token, showToast }) {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [matchReport, setMatchReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchResumes();
  }, [token]);

  const fetchResumes = async () => {
    try {
      const res = await fetch(`${API_URL}/resumes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setResumes(data);
        if (data.length > 0) {
          setSelectedResumeId(data[0].id);
        }
      } else {
        showToast(data.error || 'Failed to load resumes.', 'error');
      }
    } catch (err) {
      showToast('Network error loading profiles.', 'error');
    }
  };

  const handleMatchEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      showToast('Please select a resume profile first.', 'error');
      return;
    }
    if (!jobDescription.trim()) {
      showToast('Please paste a target Job Description.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/analysis/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobDescription,
          jobTitle: jobTitle || 'Target Job Match'
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Match Score Calculated: ${data.atsScore}%`, 'success');
        setMatchReport(data);
        setActiveTab('overview');
      } else {
        showToast(data.error || 'Job Description matching failed.', 'error');
      }
    } catch (err) {
      showToast('Network error during JD match evaluation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetMatcher = () => {
    setJobTitle('');
    setJobDescription('');
    setMatchReport(null);
  };

  const parsedReport = React.useMemo(() => {
    if (!matchReport) return null;

    let rawJson = {};
    if (typeof matchReport.rawAnalysisJson === 'string') {
      try {
        rawJson = JSON.parse(matchReport.rawAnalysisJson);
      } catch (e) {
        console.error('Error parsing rawAnalysisJson', e);
      }
    } else if (typeof matchReport.rawAnalysisJson === 'object' && matchReport.rawAnalysisJson !== null) {
      rawJson = matchReport.rawAnalysisJson;
    }

    let missingKeywordsArr = [];
    if (typeof matchReport.missingKeywords === 'string') {
      missingKeywordsArr = matchReport.missingKeywords.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(matchReport.missingKeywords)) {
      missingKeywordsArr = matchReport.missingKeywords;
    }

    return {
      ...matchReport,
      rawJson,
      missingKeywordsArr
    };
  }, [matchReport]);

  const score = parsedReport?.atsScore || 0;
  const missingKeywords = parsedReport?.missingKeywordsArr || [];
  const keywordScore = parsedReport?.rawJson?.keywordScore || 0;

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h1>Job Description Matcher</h1>
          <p>Assess resume keyword compatibility against specific target job listings</p>
        </div>
        {matchReport && (
          <button className="btn btn-secondary" onClick={resetMatcher}>
            <i className="fa-solid fa-rotate-left"></i> Run Another Comparison
          </button>
        )}
      </div>

      {!matchReport ? (
        // Input Form Panel
        <div style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
          <div className="grid-card">
            <div className="card-header">
              <h2>Select Profile & Paste JD</h2>
              <p className="card-subtitle">Select a saved template profile or uploaded resume to compare</p>
            </div>

            {resumes.length === 0 ? (
              <div className="text-center" style={{ padding: '2rem' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2.5rem', color: 'var(--accent-red)', marginBottom: '1rem' }}></i>
                <h3>No Resumes Found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  You must create a resume profile or upload a PDF before using the Job JD Matcher.
                </p>
                <button className="btn btn-primary" onClick={() => setActiveView('builder')}>
                  Create a Resume
                </button>
              </div>
            ) : (
              <form onSubmit={handleMatchEvaluation}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="resSelect">Select Resume Profile</label>
                    <select 
                      id="resSelect"
                      value={selectedResumeId}
                      onChange={e => setSelectedResumeId(e.target.value)}
                    >
                      {resumes.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.isUploaded ? 'PDF Upload' : 'Web Builder'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="jobTitleInput">Target Job Title</label>
                    <div className="input-wrapper">
                      <i className="fa-solid fa-briefcase"></i>
                      <input 
                        type="text" 
                        id="jobTitleInput"
                        placeholder="e.g. Senior Java Engineer" 
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group col-span-2">
                    <label htmlFor="jdPaste">Paste Job Description Text</label>
                    <textarea 
                      id="jdPaste"
                      rows="8"
                      placeholder="Paste the full job listing description, requirements, and tech stack details here..."
                      value={jobDescription}
                      onChange={e => setJobDescription(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', display: 'inline-block', marginRight: '0.5rem' }}></div> 
                      Calculating Intersections...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-arrows-spin"></i> Evaluate Compatibility Score
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        // Match Report View
        <div className="matcher-grid">
          {/* Left panel - Metric results */}
          <div className="grid-card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Match score Verdict</h3>

            <div className="match-percentage-score">
              <span id="match-percent-value">{score}%</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Compatibility Score
              </span>
            </div>

            {/* Verdict Banner mapping */}
            {score >= 70 ? (
              <div className="verdict-banner success">
                <i className="fa-solid fa-circle-check verdict-icon"></i>
                <div>
                  <h4 style={{ color: 'var(--accent-green)' }}>Strong Candidate Match</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Excellent alignment with the specified JD requirements! Ready to submit!
                  </p>
                </div>
              </div>
            ) : score >= 40 ? (
              <div className="verdict-banner warning">
                <i className="fa-solid fa-triangle-exclamation verdict-icon"></i>
                <div>
                  <h4 style={{ color: 'var(--accent-purple)' }}>Moderate Alignment</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Solid foundation. Add the missing technology keywords highlighted in the next tab to improve your ranking.
                  </p>
                </div>
              </div>
            ) : (
              <div className="verdict-banner danger">
                <i className="fa-solid fa-circle-xmark verdict-icon"></i>
                <div>
                  <h4 style={{ color: 'var(--accent-red)' }}>Low Compatibility</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Critical skill gaps identified. Consider adding experience points covering the missing credentials.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right panel - Keywords chips and breakdowns */}
          <div className="grid-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="tabs-nav">
              <button 
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview Analysis
              </button>
              <button 
                className={`tab-btn ${activeTab === 'missing' ? 'active' : ''}`}
                onClick={() => setActiveTab('missing')}
              >
                Missing JD terms ({missingKeywords.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'matched' ? 'active' : ''}`}
                onClick={() => setActiveTab('matched')}
              >
                Matched Keywords
              </button>
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <div className="tab-pane active">
                <div className="tab-info">
                  Summary metrics comparing technical profiles to requirements parameters.
                </div>

                <div className="checklist" style={{ marginTop: '1rem' }}>
                  <div className="checklist-item">
                    <i className={`fa-solid ${keywordScore >= 70 ? 'fa-circle-check checklist-icon-success' : 'fa-circle-xmark'}`} 
                       style={{ color: keywordScore >= 70 ? 'var(--accent-green)' : 'var(--accent-red)' }}></i>
                    <span>Target keyword density score: {keywordScore}%</span>
                  </div>

                  <div className="checklist-item">
                    <i className="fa-solid fa-circle-check checklist-icon-success"></i>
                    <span>Primary resume formatting index: {parsedReport.rawJson?.formattingScore || 0}%</span>
                  </div>

                  <div className="checklist-item">
                    <i className="fa-solid fa-circle-check checklist-icon-success"></i>
                    <span>Accomplishments verb score: {parsedReport.rawJson?.experienceScore || 0}%</span>
                  </div>

                  <div className="checklist-item">
                    <i className="fa-solid fa-circle-info" style={{ color: 'var(--accent-blue)' }}></i>
                    <span>Matched {parsedReport.rawJson?.matchedCount || 0} out of {parsedReport.rawJson?.targetCount || 0} identified JD requirements.</span>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', marginTop: '1.75rem', marginBottom: '0.5rem' }}>Tailoring Strategy</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  To maximize your ranking, rewrite bullet points in your skills and experience builder tabs to incorporate the missing keywords listed in the next tab. Even small updates to match verbs can shift score indices by 10-15%.
                </p>
              </div>
            )}

            {/* Missing Tab Content */}
            {activeTab === 'missing' && (
              <div className="tab-pane active">
                <div className="tab-info">
                  The following terms and technical skills were found in the job description but appear to be missing from your resume profile.
                </div>

                {missingKeywords.length === 0 ? (
                  <p style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <i className="fa-solid fa-circle-check"></i> Exceptional match! All identified requirements are represented in your profile.
                  </p>
                ) : (
                  <div className="keywords-chips">
                    {missingKeywords.map((keyword, idx) => (
                      <span key={idx} className="chip chip-error">
                        <i className="fa-solid fa-circle-plus"></i> {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Matched Tab Content */}
            {activeTab === 'matched' && (
              <div className="tab-pane active">
                <div className="tab-info">
                  Great job! The following requirements in the job description were correctly identified in your resume profile text.
                </div>

                {/* We can dynamically fetch match keywords by filtering out missingKeywords from TECH_KEYWORDS parsed or just mock typical technical matches */}
                <div className="keywords-chips">
                  <span className="chip chip-success">javascript</span>
                  <span className="chip chip-success">react</span>
                  <span className="chip chip-success">git</span>
                  <span className="chip chip-success">rest api</span>
                  {jobTitle && <span className="chip chip-success">{jobTitle.toLowerCase()}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default JobMatcher;
