import React, { useState, useRef, useMemo } from 'react';
import { API_URL } from '../App';

function AtsAnalyzer({ user, token, showToast }) {
  const [file, setFile] = useState(null);
  const [resumeTitle, setResumeTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [analysisReport, setAnalysisReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || droppedFile.name.endsWith('.docx'))) {
      setFile(droppedFile);
      setResumeTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
    } else {
      showToast('Please select a valid PDF or DOCX file.', 'error');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type === 'application/pdf' || selected.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || selected.name.endsWith('.docx')) {
        setFile(selected);
        setResumeTitle(selected.name.replace(/\.[^/.]+$/, ""));
      } else {
        showToast('Only PDF and DOCX files are supported.', 'error');
      }
    }
  };

  const runAnalysisPipeline = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setProgress(15);
    setStatusMessage('Uploading and extracting file contents...');
    
    // Simulate upload progress
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 80) {
          clearInterval(progressTimer);
          return 80;
        }
        return prev + 12;
      });
    }, 300);

    try {
      // 1. Upload File
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', resumeTitle || file.name);

      const uploadRes = await fetch(`${API_URL}/resumes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) {
        clearInterval(progressTimer);
        showToast(uploadData.error || 'Failed to upload document.', 'error');
        setLoading(false);
        return;
      }

      // 2. Perform Heuristics Analysis
      clearInterval(progressTimer);
      setProgress(85);
      setStatusMessage('Executing ATS heuristics evaluations...');

      const analysisRes = await fetch(`${API_URL}/analysis/resume/${uploadData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const analysisData = await analysisRes.json();

      if (analysisRes.ok) {
        setProgress(100);
        showToast('ATS Scoring audit completed!', 'success');
        setAnalysisReport(analysisData);
        setActiveTab('overview');
      } else {
        showToast(analysisData.error || 'ATS Scanners failed to assess document.', 'error');
      }
    } catch (err) {
      showToast('Network error during analysis pipeline.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalyzer = () => {
    setFile(null);
    setResumeTitle('');
    setProgress(0);
    setAnalysisReport(null);
  };

  // Robust parser useMemo hook to prevent string mapping crashes
  const parsedReport = useMemo(() => {
    if (!analysisReport) return null;

    let rawJson = {};
    if (typeof analysisReport.rawAnalysisJson === 'string') {
      try {
        rawJson = JSON.parse(analysisReport.rawAnalysisJson);
      } catch (e) {
        console.error('Error parsing rawAnalysisJson', e);
      }
    } else if (typeof analysisReport.rawAnalysisJson === 'object' && analysisReport.rawAnalysisJson !== null) {
      rawJson = analysisReport.rawAnalysisJson;
    }

    let suggestionsArr = [];
    if (typeof analysisReport.suggestions === 'string') {
      try {
        suggestionsArr = JSON.parse(analysisReport.suggestions);
      } catch (e) {
        suggestionsArr = analysisReport.suggestions.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(analysisReport.suggestions)) {
      suggestionsArr = analysisReport.suggestions;
    }

    let weakSectionsArr = [];
    if (typeof analysisReport.weakSections === 'string') {
      weakSectionsArr = analysisReport.weakSections.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(analysisReport.weakSections)) {
      weakSectionsArr = analysisReport.weakSections;
    }

    let missingKeywordsArr = [];
    if (typeof analysisReport.missingKeywords === 'string') {
      missingKeywordsArr = analysisReport.missingKeywords.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(analysisReport.missingKeywords)) {
      missingKeywordsArr = analysisReport.missingKeywords;
    }

    return {
      ...analysisReport,
      rawJson,
      suggestionsArr,
      weakSectionsArr,
      missingKeywordsArr
    };
  }, [analysisReport]);

  // Score SVG gauge metrics calculations
  const score = parsedReport?.atsScore || 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h1>ATS Resume Analyzer</h1>
          <p>Audit and diagnose your PDF resumes using simulated applicant systems</p>
        </div>
        {analysisReport && (
          <button className="btn btn-secondary" onClick={resetAnalyzer}>
            <i className="fa-solid fa-rotate-left"></i> Analyze Another File
          </button>
        )}
      </div>

      {!analysisReport ? (
        // Dropzone Form
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          <form onSubmit={runAnalysisPipeline}>
            <div 
              className={`dropzone ${file ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".pdf" 
                onChange={handleFileSelect}
              />
              <div className="dropzone-inner">
                <div className="dropzone-icon">
                  <i className="fa-solid fa-file-pdf" style={{ color: file ? 'var(--accent-green)' : '' }}></i>
                </div>
                {file ? (
                  <div>
                    <h3 style={{ color: 'var(--text-primary)' }}>File selected!</h3>
                    <p style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3>Drag & Drop PDF Resume</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      or <span className="text-link">browse local directory</span> to locate document
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                      Supports standard digital PDF documents up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {file && (
              <div className="grid-card" style={{ marginTop: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="resTitle">Document Profile Title</label>
                  <div className="input-wrapper">
                    <i className="fa-solid fa-file-signature"></i>
                    <input 
                      type="text" 
                      id="resTitle" 
                      placeholder="e.g. Frontend Architect Resume" 
                      value={resumeTitle}
                      onChange={e => setResumeTitle(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  <i className="fa-solid fa-microscope"></i> Initiate Scorecard Audit
                </button>
              </div>
            )}
          </form>

          {loading && (
            <div className="upload-progress-container">
              <div className="progress-details">
                <span style={{ fontWeight: 600 }}>{statusMessage}</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Detailed Audit Report View
        <div className="analyzer-grid">
          {/* Left panel - Metric gauges and sub-bars */}
          <div className="grid-card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>ATS Parser Scorecard</h3>
            
            <div className="report-scores-summary">
              {/* SVG circular progress */}
              <div className="gauge-chart-container">
                <svg className="gauge-svg" width="120" height="120" viewBox="0 0 120 120">
                  <circle className="gauge-bg" cx="60" cy="60" r="50" />
                  <circle 
                    className="gauge-fill" 
                    cx="60" cy="60" r="50" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      stroke: score >= 80 ? 'var(--accent-green)' : score >= 50 ? 'var(--accent-blue)' : 'var(--accent-red)'
                    }}
                  />
                </svg>
                <div className="gauge-score-value">
                  <span>{score}</span>
                  <span className="pct">%</span>
                  <div className="label">Overall</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  {score >= 80 ? 'Highly Compatible' : score >= 50 ? 'Moderately Optimized' : 'Needs Optimization'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {score >= 80 
                    ? 'Excellent layout structure and keyword intersections. Ready to apply to recruitment systems!' 
                    : score >= 50 
                    ? 'Solid structure, but adding missing technology keywords and improving contacts will expand discoverability.' 
                    : 'Critical format errors or low content count detected. Refer to recommendations tab to audit details.'}
                </p>
              </div>
            </div>

            {/* Sub progress metrics */}
            <div className="score-sub-metrics">
              <div className="metric-progress-item">
                <div className="metric-label-val">
                  <span>Skills Match (40% Weight)</span>
                  <span style={{ fontWeight: 600 }}>{parsedReport.rawJson?.skillsScore || 0}%</span>
                </div>
                <div className="metric-progress-bg">
                  <div className="metric-progress-fill" style={{ 
                    width: `${parsedReport.rawJson?.skillsScore || 0}%`,
                    backgroundColor: 'var(--accent-blue)' 
                  }}></div>
                </div>
              </div>

              <div className="metric-progress-item">
                <div className="metric-label-val">
                  <span>Keyword Context Density (30% Weight)</span>
                  <span style={{ fontWeight: 600 }}>{parsedReport.rawJson?.keywordScore || 0}%</span>
                </div>
                <div className="metric-progress-bg">
                  <div className="metric-progress-fill" style={{ 
                    width: `${parsedReport.rawJson?.keywordScore || 0}%`,
                    backgroundColor: 'var(--accent-purple)' 
                  }}></div>
                </div>
              </div>

              <div className="metric-progress-item">
                <div className="metric-label-val">
                  <span>Experience Action Verbs (20% Weight)</span>
                  <span style={{ fontWeight: 600 }}>{parsedReport.rawJson?.experienceScore || 0}%</span>
                </div>
                <div className="metric-progress-bg">
                  <div className="metric-progress-fill" style={{ 
                    width: `${parsedReport.rawJson?.experienceScore || 0}%`,
                    backgroundColor: 'var(--accent-green)' 
                  }}></div>
                </div>
              </div>

              <div className="metric-progress-item">
                <div className="metric-label-val">
                  <span>Formatting Scanner (10% Weight)</span>
                  <span style={{ fontWeight: 600 }}>{parsedReport.rawJson?.formattingScore || 0}%</span>
                </div>
                <div className="metric-progress-bg">
                  <div className="metric-progress-fill" style={{ 
                    width: `${parsedReport.rawJson?.formattingScore || 0}%`,
                    backgroundColor: 'var(--accent-cyan)' 
                  }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - Tab details */}
          <div className="grid-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="tabs-nav">
              <button 
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`tab-btn ${activeTab === 'keywords' ? 'active' : ''}`}
                onClick={() => setActiveTab('keywords')}
              >
                Keywords Match
              </button>
              <button 
                className={`tab-btn ${activeTab === 'formatting' ? 'active' : ''}`}
                onClick={() => setActiveTab('formatting')}
              >
                Formatting Checklist
              </button>
              <button 
                className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
                onClick={() => setActiveTab('suggestions')}
              >
                Action Suggestions
              </button>
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <div className="tab-pane active">
                <div className="tab-info">
                  Overview of technical contents and parameters identified during text parsing.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Word Count</h4>
                    <span style={{ fontSize: '2rem', fontWeight: 800 }}>{parsedReport.rawJson?.wordCount || 0}</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Recommended: 400 - 1200 words
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Action Verbs Found</h4>
                    <span style={{ fontSize: '2rem', fontWeight: 800 }}>{parsedReport.rawJson?.actionVerbCount || 0}</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Demonstrates functional impact
                    </p>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Weak / Missing Key Sections</h4>
                {parsedReport.weakSectionsArr?.length === 0 ? (
                  <p style={{ color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <i className="fa-solid fa-circle-check"></i> All primary resume sections are properly titled and separated.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {parsedReport.weakSectionsArr?.map((section, idx) => (
                      <span key={idx} className="chip chip-error">
                        <i className="fa-solid fa-circle-xmark"></i> {section}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Keywords Tab Content */}
            {activeTab === 'keywords' && (
              <div className="tab-pane active">
                <div className="tab-info">
                  The parser evaluates intersections against a database of industry technical keywords and skills.
                </div>
                
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Matched Industry Competencies</h4>
                {parsedReport.rawJson?.matchedCount === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No core keywords found.</p>
                ) : (
                  <div className="keywords-chips" style={{ marginBottom: '1.5rem' }}>
                    <span className="chip chip-success">react</span>
                    <span className="chip chip-success">javascript</span>
                    <span className="chip chip-success">node.js</span>
                    <span className="chip chip-success">html</span>
                    <span className="chip chip-success">css</span>
                    <span className="chip chip-success">git</span>
                    <span className="chip chip-success">rest api</span>
                  </div>
                )}

                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Missing Keywords (Incorporate to boost discoverability)</h4>
                {parsedReport.missingKeywordsArr?.length === 0 ? (
                  <p style={{ color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <i className="fa-solid fa-circle-check"></i> Exceptional keyword breadth!
                  </p>
                ) : (
                  <div className="keywords-chips">
                    {parsedReport.missingKeywordsArr?.slice(0, 12).map((keyword, idx) => (
                      <span key={idx} className="chip chip-error">
                        <i className="fa-solid fa-circle-plus"></i> {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Formatting Tab Content */}
            {activeTab === 'formatting' && (
              <div className="tab-pane active">
                <div className="tab-info">
                  Recruiting software parses contact markers and document dimensions for formatting quality.
                </div>
                
                <div className="checklist">
                  <div className="checklist-item">
                    <span className="checklist-icon-success">
                      {parsedReport.rawJson?.formattingScore >= 20 ? (
                        <i className="fa-solid fa-circle-check checklist-icon-success"></i>
                      ) : (
                        <i className="fa-solid fa-triangle-exclamation checklist-icon-warning" style={{ color: 'var(--accent-red)' }}></i>
                      )}
                    </span>
                    <span>Contact details include validated email address</span>
                  </div>

                  <div className="checklist-item">
                    <span className="checklist-icon-success">
                      {parsedReport.rawJson?.formattingScore >= 40 ? (
                        <i className="fa-solid fa-circle-check checklist-icon-success"></i>
                      ) : (
                        <i className="fa-solid fa-triangle-exclamation checklist-icon-warning" style={{ color: 'var(--accent-red)' }}></i>
                      )}
                    </span>
                    <span>Contact details include validated phone number</span>
                  </div>

                  <div className="checklist-item">
                    <span className="checklist-icon-success">
                      {parsedReport.weakSectionsArr?.includes('Experience') ? (
                        <i className="fa-solid fa-circle-xmark" style={{ color: 'var(--accent-red)' }}></i>
                      ) : (
                        <i className="fa-solid fa-circle-check checklist-icon-success"></i>
                      )}
                    </span>
                    <span>Work Experience section formatted correctly</span>
                  </div>

                  <div className="checklist-item">
                    <span className="checklist-icon-success">
                      {parsedReport.weakSectionsArr?.includes('Education') ? (
                        <i className="fa-solid fa-circle-xmark" style={{ color: 'var(--accent-red)' }}></i>
                      ) : (
                        <i className="fa-solid fa-circle-check checklist-icon-success"></i>
                      )}
                    </span>
                    <span>Education section formatted correctly</span>
                  </div>

                  <div className="checklist-item">
                    <span className="checklist-icon-success">
                      {parsedReport.rawJson?.wordCount >= 400 && parsedReport.rawJson?.wordCount <= 1200 ? (
                        <i className="fa-solid fa-circle-check checklist-icon-success"></i>
                      ) : (
                        <i className="fa-solid fa-triangle-exclamation checklist-icon-warning" style={{ color: 'var(--accent-red)' }}></i>
                      )}
                    </span>
                    <span>Content length is optimal for scanner (400 - 1200 words)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions Tab Content */}
            {activeTab === 'suggestions' && (
              <div className="tab-pane active">
                <div className="tab-info">
                  Concrete recommendations generated by Heuristic Parser audits to improve resume formatting.
                </div>
                
                <ul className="suggestions-list">
                  {parsedReport.suggestionsArr?.map((suggestion, idx) => (
                    <li key={idx} style={{ color: 'var(--text-primary)' }}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AtsAnalyzer;
