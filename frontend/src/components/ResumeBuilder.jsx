import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function ResumeBuilder({ user, token, showToast, activeResumeId, setActiveResumeId }) {
  // Main form fields
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('modern');
  
  const [personalDetails, setPersonalDetails] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    linkedin: '',
    website: '',
    summary: ''
  });

  const [skillsText, setSkillsText] = useState('');
  const [certificationsText, setCertificationsText] = useState('');
  
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [projects, setProjects] = useState([]);

  // Accordion active toggling
  const [expandedSection, setExpandedSection] = useState('personal');

  // Loading indicator
  const [saving, setSaving] = useState(false);

  // Fetch resume details if in edit mode
  useEffect(() => {
    if (activeResumeId) {
      fetchResumeDetails();
    } else {
      // Set some clean template defaults for new resume
      setTitle('My Resume Profile');
      setPersonalDetails({
        name: user.fullName,
        title: 'Full Stack Engineer',
        email: user.email,
        phone: '+1 (555) 019-2834',
        linkedin: 'linkedin.com/in/username',
        website: 'myportfolio.dev',
        summary: 'Highly motivated software engineer with experience building scalable REST APIs and responsive frontend single-page web applications. Adept at agile collaboration and implementing design system systems.'
      });
      setSkillsText('JavaScript, React, Node.js, Express, MongoDB, Java, Spring Boot, SQL, Git, Docker, REST API');
      setCertificationsText('AWS Certified Cloud Practitioner, Oracle Certified Java Associate');
      setExperience([
        {
          company: 'Tech Solutions Inc.',
          position: 'Software Developer',
          startDate: '2024-06',
          endDate: 'Present',
          description: 'Spearheaded migration of legacy services to React and Node microservices, increasing throughput by 30%.\nCollaborated in agile team sprints to deliver high-fidelity client dashboards and MySQL optimizations.'
        }
      ]);
      setEducation([
        {
          school: 'State Technical University',
          degree: 'B.S. in Computer Science',
          startDate: '2020-09',
          endDate: '2024-05'
        }
      ]);
      setProjects([
        {
          title: 'E-Commerce Platform',
          technologies: 'React, Node.js, MongoDB',
          description: 'Engineered a secure online storefront featuring JWT user sessions, product lookup caching, and cart checkout pipelines.'
        }
      ]);
    }
  }, [activeResumeId, token]);

  const fetchResumeDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/resumes/${activeResumeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTitle(data.title);
        setTemplateId(data.templateId || 'modern');
        setPersonalDetails(data.personalDetails || {});
        setSkillsText(data.skills?.join(', ') || '');
        setCertificationsText(data.certifications?.join(', ') || '');
        setExperience(data.experience || []);
        setEducation(data.education || []);
        setProjects(data.projects || []);
      } else {
        showToast(data.error || 'Failed to load resume details.', 'error');
      }
    } catch (err) {
      showToast('Network error loading builder details.', 'error');
    }
  };

  const handlePersonalChange = (field, val) => {
    setPersonalDetails(prev => ({ ...prev, [field]: val }));
  };

  // Repeater list handlers
  const addRepeaterItem = (type) => {
    if (type === 'experience') {
      setExperience(prev => [...prev, { company: '', position: '', startDate: '', endDate: '', description: '' }]);
    } else if (type === 'education') {
      setEducation(prev => [...prev, { school: '', degree: '', startDate: '', endDate: '' }]);
    } else if (type === 'projects') {
      setProjects(prev => [...prev, { title: '', technologies: '', description: '' }]);
    }
  };

  const removeRepeaterItem = (type, index) => {
    if (type === 'experience') {
      setExperience(prev => prev.filter((_, idx) => idx !== index));
    } else if (type === 'education') {
      setEducation(prev => prev.filter((_, idx) => idx !== index));
    } else if (type === 'projects') {
      setProjects(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleRepeaterChange = (type, index, field, value) => {
    if (type === 'experience') {
      setExperience(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
    } else if (type === 'education') {
      setEducation(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
    } else if (type === 'projects') {
      setProjects(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
    }
  };

  const toggleSection = (sectionName) => {
    setExpandedSection(expandedSection === sectionName ? '' : sectionName);
  };

  const saveResume = async () => {
    if (!title.trim()) {
      showToast('Please specify a resume title.', 'error');
      return;
    }
    setSaving(true);
    
    // Structure payload
    const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);
    const certifications = certificationsText.split(',').map(c => c.trim()).filter(Boolean);
    
    const payload = {
      title,
      templateId,
      personalDetails,
      skills,
      certifications,
      experience,
      education,
      projects
    };

    const method = activeResumeId ? 'PUT' : 'POST';
    const url = activeResumeId ? `${API_URL}/resumes/${activeResumeId}` : `${API_URL}/resumes`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Resume profile saved successfully!', 'success');
        if (!activeResumeId) {
          setActiveResumeId(data.id);
        }
      } else {
        showToast(data.error || 'Failed to save resume.', 'error');
      }
    } catch (err) {
      showToast('Network error saving resume.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h1>Interactive Resume Builder</h1>
          <p>Fill out the forms to dynamically assemble professional resume layouts</p>
        </div>
        <div className="header-actions">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Layout Style:</label>
            <select 
              value={templateId} 
              onChange={e => setTemplateId(e.target.value)}
              style={{ width: '140px', padding: '0.5rem 1rem' }}
            >
              <option value="modern">Modern Tech</option>
              <option value="professional">Corporate Classic</option>
              <option value="tech">Creative Cyan</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={saveResume} disabled={saving}>
            <i className="fa-solid fa-cloud-arrow-up"></i> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn btn-primary" onClick={triggerPrint}>
            <i className="fa-solid fa-download"></i> Download PDF
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="form-group" style={{ marginBottom: 0, flexGrow: 1 }}>
          <div className="input-wrapper">
            <i className="fa-solid fa-file-signature"></i>
            <input 
              type="text" 
              placeholder="Resume Profile Title (e.g. Senior Software Engineer)" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={{ paddingLeft: '3rem' }}
            />
          </div>
        </div>
      </div>

      <div className="builder-split-pane">
        {/* Left Side - Forms Accordions */}
        <div className="builder-form-pane">
          
          {/* 1. Personal Details */}
          <div className="accordion-item">
            <div className="accordion-header" onClick={() => toggleSection('personal')}>
              <h3>
                <i className="fa-solid fa-address-card"></i> Personal Contacts & Summary
              </h3>
              <i className={`fa-solid fa-chevron-down accordion-indicator ${expandedSection === 'personal' ? 'fa-rotate-180' : ''}`}></i>
            </div>
            
            {expandedSection === 'personal' && (
              <div className="accordion-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={personalDetails.name || ''} 
                      onChange={e => handlePersonalChange('name', e.target.value)} 
                      placeholder="Jane Doe" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Job Title</label>
                    <input 
                      type="text" 
                      value={personalDetails.title || ''} 
                      onChange={e => handlePersonalChange('title', e.target.value)} 
                      placeholder="Senior React Architect" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      value={personalDetails.email || ''} 
                      onChange={e => handlePersonalChange('email', e.target.value)} 
                      placeholder="jane@domain.com" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      value={personalDetails.phone || ''} 
                      onChange={e => handlePersonalChange('phone', e.target.value)} 
                      placeholder="+1 (555) 123-4567" 
                    />
                  </div>
                  <div className="form-group">
                    <label>LinkedIn URL</label>
                    <input 
                      type="text" 
                      value={personalDetails.linkedin || ''} 
                      onChange={e => handlePersonalChange('linkedin', e.target.value)} 
                      placeholder="linkedin.com/in/jane-doe" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Portfolio / Website</label>
                    <input 
                      type="text" 
                      value={personalDetails.website || ''} 
                      onChange={e => handlePersonalChange('website', e.target.value)} 
                      placeholder="janedoe.me" 
                    />
                  </div>
                  <div className="form-group col-span-2">
                    <label>Professional Profile Summary</label>
                    <textarea 
                      rows="4" 
                      value={personalDetails.summary || ''} 
                      onChange={e => handlePersonalChange('summary', e.target.value)} 
                      placeholder="Provide a concise 3-4 sentence professional summary of your key strengths and experience..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Skills Tag list */}
          <div className="accordion-item">
            <div className="accordion-header" onClick={() => toggleSection('skills')}>
              <h3>
                <i className="fa-solid fa-list-check"></i> Technical Skills
              </h3>
              <i className={`fa-solid fa-chevron-down accordion-indicator ${expandedSection === 'skills' ? 'fa-rotate-180' : ''}`}></i>
            </div>
            
            {expandedSection === 'skills' && (
              <div className="accordion-content">
                <div className="form-group">
                  <label>Skills (Comma-separated list)</label>
                  <textarea 
                    rows="3" 
                    value={skillsText} 
                    onChange={e => setSkillsText(e.target.value)} 
                    placeholder="Java, React, Node.js, Spring Boot, AWS, Docker, Kubernetes" 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Type your skills separated by commas. These will be parsed into badges and matched against ATS job keywords.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. Work Experience Repeater */}
          <div className="accordion-item">
            <div className="accordion-header" onClick={() => toggleSection('experience')}>
              <h3>
                <i className="fa-solid fa-briefcase"></i> Work Experience
              </h3>
              <i className={`fa-solid fa-chevron-down accordion-indicator ${expandedSection === 'experience' ? 'fa-rotate-180' : ''}`}></i>
            </div>
            
            {expandedSection === 'experience' && (
              <div className="accordion-content">
                <div className="repeater-list">
                  {experience.map((exp, index) => (
                    <div key={index} className="repeater-item">
                      <button className="btn-remove-repeater" onClick={() => removeRepeaterItem('experience', index)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Company / Organization</label>
                          <input 
                            type="text" 
                            value={exp.company || ''} 
                            onChange={e => handleRepeaterChange('experience', index, 'company', e.target.value)} 
                            placeholder="Innovate Tech" 
                          />
                        </div>
                        <div className="form-group">
                          <label>Position / Role</label>
                          <input 
                            type="text" 
                            value={exp.position || ''} 
                            onChange={e => handleRepeaterChange('experience', index, 'position', e.target.value)} 
                            placeholder="Senior Developer" 
                          />
                        </div>
                        <div className="form-group">
                          <label>Start Date</label>
                          <input 
                            type="text" 
                            value={exp.startDate || ''} 
                            onChange={e => handleRepeaterChange('experience', index, 'startDate', e.target.value)} 
                            placeholder="YYYY-MM (e.g. 2021-06)" 
                          />
                        </div>
                        <div className="form-group">
                          <label>End Date</label>
                          <input 
                            type="text" 
                            value={exp.endDate || ''} 
                            onChange={e => handleRepeaterChange('experience', index, 'endDate', e.target.value)} 
                            placeholder="YYYY-MM or Present" 
                          />
                        </div>
                        <div className="form-group col-span-2">
                          <label>Role Description & Accomplishments</label>
                          <textarea 
                            rows="4" 
                            value={exp.description || ''} 
                            onChange={e => handleRepeaterChange('experience', index, 'description', e.target.value)} 
                            placeholder="Describe your achievements using action verbs (e.g. Developed secure endpoints, Optimized SQL pipelines)..." 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-dash btn-full" onClick={() => addRepeaterItem('experience')}>
                  <i className="fa-solid fa-plus"></i> Add Work Record
                </button>
              </div>
            )}
          </div>

          {/* 4. Education Records */}
          <div className="accordion-item">
            <div className="accordion-header" onClick={() => toggleSection('education')}>
              <h3>
                <i className="fa-solid fa-graduation-cap"></i> Education Records
              </h3>
              <i className={`fa-solid fa-chevron-down accordion-indicator ${expandedSection === 'education' ? 'fa-rotate-180' : ''}`}></i>
            </div>
            
            {expandedSection === 'education' && (
              <div className="accordion-content">
                <div className="repeater-list">
                  {education.map((edu, index) => (
                    <div key={index} className="repeater-item">
                      <button className="btn-remove-repeater" onClick={() => removeRepeaterItem('education', index)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>School / University</label>
                          <input 
                            type="text" 
                            value={edu.school || ''} 
                            onChange={e => handleRepeaterChange('education', index, 'school', e.target.value)} 
                            placeholder="State University" 
                          />
                        </div>
                        <div className="form-group">
                          <label>Degree / Field of Study</label>
                          <input 
                            type="text" 
                            value={edu.degree || ''} 
                            onChange={e => handleRepeaterChange('education', index, 'degree', e.target.value)} 
                            placeholder="M.S. in Software Engineering" 
                          />
                        </div>
                        <div className="form-group">
                          <label>Start Date</label>
                          <input 
                            type="text" 
                            value={edu.startDate || ''} 
                            onChange={e => handleRepeaterChange('education', index, 'startDate', e.target.value)} 
                            placeholder="YYYY-MM" 
                          />
                        </div>
                        <div className="form-group">
                          <label>End Date</label>
                          <input 
                            type="text" 
                            value={edu.endDate || ''} 
                            onChange={e => handleRepeaterChange('education', index, 'endDate', e.target.value)} 
                            placeholder="YYYY-MM" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-dash btn-full" onClick={() => addRepeaterItem('education')}>
                  <i className="fa-solid fa-plus"></i> Add Academic Record
                </button>
              </div>
            )}
          </div>

          {/* 5. Projects Repeater */}
          <div className="accordion-item">
            <div className="accordion-header" onClick={() => toggleSection('projects')}>
              <h3>
                <i className="fa-solid fa-cubes"></i> Projects & Products
              </h3>
              <i className={`fa-solid fa-chevron-down accordion-indicator ${expandedSection === 'projects' ? 'fa-rotate-180' : ''}`}></i>
            </div>
            
            {expandedSection === 'projects' && (
              <div className="accordion-content">
                <div className="repeater-list">
                  {projects.map((proj, index) => (
                    <div key={index} className="repeater-item">
                      <button className="btn-remove-repeater" onClick={() => removeRepeaterItem('projects', index)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Project Title</label>
                          <input 
                            type="text" 
                            value={proj.title || ''} 
                            onChange={e => handleRepeaterChange('projects', index, 'title', e.target.value)} 
                            placeholder="ATS Resume Portal" 
                          />
                        </div>
                        <div className="form-group">
                          <label>Technologies Used</label>
                          <input 
                            type="text" 
                            value={proj.technologies || ''} 
                            onChange={e => handleRepeaterChange('projects', index, 'technologies', e.target.value)} 
                            placeholder="React, Node.js, Express, MongoDB" 
                          />
                        </div>
                        <div className="form-group col-span-2">
                          <label>Project Details & Accomplishments</label>
                          <textarea 
                            rows="3" 
                            value={proj.description || ''} 
                            onChange={e => handleRepeaterChange('projects', index, 'description', e.target.value)} 
                            placeholder="Detail what was built, challenges faced, and results achieved..." 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-dash btn-full" onClick={() => addRepeaterItem('projects')}>
                  <i className="fa-solid fa-plus"></i> Add Project
                </button>
              </div>
            )}
          </div>

          {/* 6. Certifications Tag list */}
          <div className="accordion-item">
            <div className="accordion-header" onClick={() => toggleSection('certifications')}>
              <h3>
                <i className="fa-solid fa-award"></i> Professional Certifications
              </h3>
              <i className={`fa-solid fa-chevron-down accordion-indicator ${expandedSection === 'certifications' ? 'fa-rotate-180' : ''}`}></i>
            </div>
            
            {expandedSection === 'certifications' && (
              <div className="accordion-content">
                <div className="form-group">
                  <label>Certifications (Comma-separated list)</label>
                  <textarea 
                    rows="2" 
                    value={certificationsText} 
                    onChange={e => setCertificationsText(e.target.value)} 
                    placeholder="AWS Certified Developer, Certified Scrum Master" 
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Side - Real-Time A4 Document Sheets Preview */}
        <div className="builder-preview-pane">
          <div className="preview-card-header">
            <i className="fa-solid fa-file-pdf"></i>
            <span>Live A4 Document Sheets Preview (updates dynamically)</span>
          </div>

          <div className="resume-sheet-container">
            <div className={`resume-sheet ${
              templateId === 'modern' ? 'modern-style' :
              templateId === 'professional' ? 'professional-style' :
              'tech-style'
            }`}>
              
              {/* Profile Header */}
              <div className="sheet-header" style={{ marginBottom: '1.25rem' }}>
                <h1 style={{ textTransform: 'capitalize', fontSize: '1.6rem', letterSpacing: '-0.5px' }}>
                  {personalDetails.name || 'Jane Doe'}
                </h1>
                <p className="title" style={{ fontSize: '0.9rem', color: '#4b5563', margin: '0.1rem 0 0.5rem 0' }}>
                  {personalDetails.title || 'Senior Software Engineer'}
                </p>
                
                <div className="contacts-grid">
                  {personalDetails.email && (
                    <span>
                      <i className="fa-solid fa-envelope" style={{ marginRight: '0.25rem' }}></i> {personalDetails.email}
                    </span>
                  )}
                  {personalDetails.phone && (
                    <span>
                      <i className="fa-solid fa-phone" style={{ marginRight: '0.25rem' }}></i> {personalDetails.phone}
                    </span>
                  )}
                  {personalDetails.linkedin && (
                    <span>
                      <i className="fa-solid fa-link" style={{ marginRight: '0.25rem' }}></i> {personalDetails.linkedin}
                    </span>
                  )}
                  {personalDetails.website && (
                    <span>
                      <i className="fa-solid fa-globe" style={{ marginRight: '0.25rem' }}></i> {personalDetails.website}
                    </span>
                  )}
                </div>
              </div>

              {/* Summary */}
              {personalDetails.summary && (
                <div className="preview-section">
                  <div className="section-title">Professional Summary</div>
                  <p style={{ color: '#374151', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    {personalDetails.summary}
                  </p>
                </div>
              )}

              {/* Experience */}
              {experience.length > 0 && (
                <div className="preview-section">
                  <div className="section-title">Work Experience</div>
                  {experience.map((exp, idx) => (
                    <div key={idx} className="preview-item-block" style={{ marginBottom: '0.6rem' }}>
                      <div className="preview-item-header">
                        <span style={{ fontWeight: 700, color: '#111827' }}>{exp.position || 'Position Name'}</span>
                        <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>{exp.startDate || 'YYYY-MM'} - {exp.endDate || 'YYYY-MM'}</span>
                      </div>
                      <div className="preview-item-sub">
                        <span style={{ fontStyle: 'italic', color: '#4b5563' }}>{exp.company || 'Company Name'}</span>
                      </div>
                      {exp.description && (
                        <p className="preview-item-desc" style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#374151', whiteSpace: 'pre-line' }}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <div className="preview-section">
                  <div className="section-title">Projects</div>
                  {projects.map((proj, idx) => (
                    <div key={idx} className="preview-item-block" style={{ marginBottom: '0.6rem' }}>
                      <div className="preview-item-header">
                        <span style={{ fontWeight: 700, color: '#111827' }}>{proj.title || 'Project Title'}</span>
                        <span style={{ fontSize: '0.7rem', color: '#4b5563', fontWeight: 500 }}>
                          Tech: {proj.technologies || 'None listed'}
                        </span>
                      </div>
                      {proj.description && (
                        <p className="preview-item-desc" style={{ fontSize: '0.75rem', marginTop: '0.15rem', color: '#374151' }}>
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {skillsText.trim() && (
                <div className="preview-section">
                  <div className="section-title">Technical Skills</div>
                  <div className="skills-preview-container">
                    {skillsText.split(',').map((skill, idx) => {
                      const trimmed = skill.trim();
                      if (!trimmed) return null;
                      return (
                        <span key={idx} className="skill-tag-preview">
                          {trimmed}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Education */}
              {education.length > 0 && (
                <div className="preview-section">
                  <div className="section-title">Education</div>
                  {education.map((edu, idx) => (
                    <div key={idx} className="preview-item-block" style={{ marginBottom: '0.4rem' }}>
                      <div className="preview-item-header">
                        <span style={{ fontWeight: 700, color: '#111827' }}>{edu.degree || 'Degree Title'}</span>
                        <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>{edu.startDate || 'YYYY-MM'} - {edu.endDate || 'YYYY-MM'}</span>
                      </div>
                      <div className="preview-item-sub">
                        <span style={{ fontStyle: 'italic', color: '#4b5563' }}>{edu.school || 'University Name'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {certificationsText.trim() && (
                <div className="preview-section" style={{ marginBottom: 0 }}>
                  <div className="section-title">Certifications</div>
                  <ul style={{ paddingLeft: '1.2rem', color: '#374151', fontSize: '0.75rem', lineHeight: '1.3' }}>
                    {certificationsText.split(',').map((cert, idx) => {
                      const trimmed = cert.trim();
                      if (!trimmed) return null;
                      return <li key={idx} style={{ marginBottom: '0.15rem' }}>{trimmed}</li>;
                    })}
                  </ul>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeBuilder;
