/**
 * ATS Resume Analyzer & Builder - Interactive Builder Engine
 * Manages Dynamic Forms, Real-Time Preview Sync, Templates styling, and PDF Printing
 */

// Local Builder form state
let builderExperience = [];
let builderEducation = [];
let builderProjects = [];
window.builderEditId = null; // ID set when edit button is clicked from dashboard

window.initBuilder = async function() {
    setupBuilderListeners();
    
    // Clear dynamic lists
    builderExperience = [];
    builderEducation = [];
    builderProjects = [];
    
    if (window.builderEditId) {
        await loadResumeToBuilder(window.builderEditId);
    } else {
        resetBuilderForms();
        // Add one empty entry to make it look ready
        addExperienceItem();
        addEducationItem();
        addProjectItem();
    }
    
    syncAllInputsToPreview();
};

function setupBuilderListeners() {
    // Basic inputs sync
    const basicFields = [
        'field-name', 'field-title', 'field-email', 'field-phone', 
        'field-linkedin', 'field-website', 'field-summary', 'field-skills', 'field-certifications'
    ];
    
    basicFields.forEach(id => {
        const el = document.getElementById(id);
        el.removeEventListener('input', syncAllInputsToPreview);
        el.addEventListener('input', syncAllInputsToPreview);
    });

    // Template style switcher listener
    const templateSelect = document.getElementById('builder-template-select');
    templateSelect.removeEventListener('change', updateTemplateStyle);
    templateSelect.addEventListener('change', updateTemplateStyle);

    // Save and Print actions
    const btnSave = document.getElementById('btn-save-builder');
    btnSave.removeEventListener('click', saveBuilderProgress);
    btnSave.addEventListener('click', saveBuilderProgress);

    const btnPrint = document.getElementById('btn-print-builder');
    btnPrint.removeEventListener('click', triggerPrint);
    btnPrint.addEventListener('click', triggerPrint);

    // Repeater button bindings
    document.getElementById('add-experience-btn').onclick = (e) => { e.preventDefault(); addExperienceItem(); };
    document.getElementById('add-education-btn').onclick = (e) => { e.preventDefault(); addEducationItem(); };
    document.getElementById('add-projects-btn').onclick = (e) => { e.preventDefault(); addProjectItem(); };
}

// 1. Handle Experience Repeater
function addExperienceItem(data = null) {
    const container = document.getElementById('experience-list');
    const index = builderExperience.length;
    
    const div = document.createElement('div');
    div.className = 'repeater-item';
    div.id = `exp-item-${index}`;
    
    div.innerHTML = `
        <button class="btn-remove-repeater" onclick="removeExperienceItem(${index})"><i class="fa-regular fa-trash-can"></i></button>
        <div class="form-grid">
            <div class="form-group">
                <label>Company/Employer</label>
                <input type="text" class="exp-company" placeholder="Acme Corp" value="${data ? data.company : ''}">
            </div>
            <div class="form-group">
                <label>Job Title/Position</label>
                <input type="text" class="exp-position" placeholder="Senior Engineer" value="${data ? data.position : ''}">
            </div>
            <div class="form-group">
                <label>Start Date</label>
                <input type="text" class="exp-start" placeholder="Jan 2024" value="${data ? data.startDate : ''}">
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="text" class="exp-end" placeholder="Present" value="${data ? data.endDate : ''}">
            </div>
            <div class="form-group col-span-2">
                <label>Description/Achievements</label>
                <textarea class="exp-desc" rows="3" placeholder="Led development of REST API services raising conversion rate by 20%...">${data ? data.description : ''}</textarea>
            </div>
        </div>
    `;
    
    container.appendChild(div);
    builderExperience.push({ id: index });
    
    // Bind real-time input change
    div.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', syncAllInputsToPreview);
    });
}

window.removeExperienceItem = function(index) {
    const item = document.getElementById(`exp-item-${index}`);
    if (item) {
        item.remove();
        builderExperience = builderExperience.filter(x => x.id !== index);
        syncAllInputsToPreview();
    }
};

// 2. Handle Education Repeater
function addEducationItem(data = null) {
    const container = document.getElementById('education-list');
    const index = builderEducation.length;
    
    const div = document.createElement('div');
    div.className = 'repeater-item';
    div.id = `edu-item-${index}`;
    
    div.innerHTML = `
        <button class="btn-remove-repeater" onclick="removeEducationItem(${index})"><i class="fa-regular fa-trash-can"></i></button>
        <div class="form-grid">
            <div class="form-group">
                <label>School/University</label>
                <input type="text" class="edu-school" placeholder="Stanford University" value="${data ? data.school : ''}">
            </div>
            <div class="form-group">
                <label>Degree</label>
                <input type="text" class="edu-degree" placeholder="B.S. Computer Science" value="${data ? data.degree : ''}">
            </div>
            <div class="form-group">
                <label>Start Date</label>
                <input type="text" class="edu-start" placeholder="Sep 2020" value="${data ? data.startDate : ''}">
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="text" class="edu-end" placeholder="Jun 2024" value="${data ? data.endDate : ''}">
            </div>
        </div>
    `;
    
    container.appendChild(div);
    builderEducation.push({ id: index });
    
    div.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', syncAllInputsToPreview);
    });
}

window.removeEducationItem = function(index) {
    const item = document.getElementById(`edu-item-${index}`);
    if (item) {
        item.remove();
        builderEducation = builderEducation.filter(x => x.id !== index);
        syncAllInputsToPreview();
    }
};

// 3. Handle Projects Repeater
function addProjectItem(data = null) {
    const container = document.getElementById('projects-list');
    const index = builderProjects.length;
    
    const div = document.createElement('div');
    div.className = 'repeater-item';
    div.id = `project-item-${index}`;
    
    div.innerHTML = `
        <button class="btn-remove-repeater" onclick="removeProjectItem(${index})"><i class="fa-regular fa-trash-can"></i></button>
        <div class="form-grid">
            <div class="form-group">
                <label>Project Title</label>
                <input type="text" class="proj-title" placeholder="E-Commerce Core Service" value="${data ? data.title : ''}">
            </div>
            <div class="form-group">
                <label>Technologies Used</label>
                <input type="text" class="proj-tech" placeholder="Java, MySQL, React" value="${data ? data.technologies : ''}">
            </div>
            <div class="form-group col-span-2">
                <label>Description</label>
                <textarea class="proj-desc" rows="2" placeholder="Designed high-performance microservices parsing 10k messages daily...">${data ? data.description : ''}</textarea>
            </div>
        </div>
    `;
    
    container.appendChild(div);
    builderProjects.push({ id: index });
    
    div.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', syncAllInputsToPreview);
    });
}

window.removeProjectItem = function(index) {
    const item = document.getElementById(`project-item-${index}`);
    if (item) {
        item.remove();
        builderProjects = builderProjects.filter(x => x.id !== index);
        syncAllInputsToPreview();
    }
};

// 4. Sync Everything Live to Preview Sheet
function syncAllInputsToPreview() {
    // 4.1 Personal Info
    const name = document.getElementById('field-name').value || 'Your Full Name';
    const title = document.getElementById('field-title').value || 'Professional Title';
    const email = document.getElementById('field-email').value;
    const phone = document.getElementById('field-phone').value;
    const linkedin = document.getElementById('field-linkedin').value;
    const website = document.getElementById('field-website').value;
    const summary = document.getElementById('field-summary').value || 'A brief overview of your professional profile...';

    document.getElementById('preview-name').textContent = name;
    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-summary').textContent = summary;

    // Contact Grid Details
    const emailEl = document.getElementById('preview-email');
    if (email) {
        emailEl.innerHTML = `<i class="fa-regular fa-envelope"></i> ${email}`;
        emailEl.classList.remove('hidden');
    } else {
        emailEl.classList.add('hidden');
    }

    const phoneEl = document.getElementById('preview-phone');
    if (phone) {
        phoneEl.innerHTML = `<i class="fa-solid fa-phone"></i> ${phone}`;
        phoneEl.classList.remove('hidden');
    } else {
        phoneEl.classList.add('hidden');
    }

    const linkedinEl = document.getElementById('preview-linkedin');
    if (linkedin) {
        linkedinEl.innerHTML = `<i class="fa-brands fa-linkedin"></i> ${linkedin}`;
        linkedinEl.classList.remove('hidden');
    } else {
        linkedinEl.classList.add('hidden');
    }

    const websiteEl = document.getElementById('preview-website');
    if (website) {
        websiteEl.innerHTML = `<i class="fa-solid fa-globe"></i> ${website}`;
        websiteEl.classList.remove('hidden');
    } else {
        websiteEl.classList.add('hidden');
    }

    // 4.2 Skills chips preview
    const skillsText = document.getElementById('field-skills').value;
    const skillsContainer = document.getElementById('preview-skills');
    skillsContainer.innerHTML = '';
    
    if (skillsText.trim()) {
        const skillsArr = skillsText.split(',').map(s => s.trim()).filter(Boolean);
        skillsArr.forEach(skill => {
            const span = document.createElement('span');
            span.className = 'skill-tag-preview';
            span.textContent = skill;
            skillsContainer.appendChild(span);
        });
        document.getElementById('preview-section-skills').classList.remove('hidden');
    } else {
        document.getElementById('preview-section-skills').classList.add('hidden');
    }

    // 4.3 Certifications
    const certsText = document.getElementById('field-certifications').value;
    const certsEl = document.getElementById('preview-certifications');
    if (certsText.trim()) {
        certsEl.textContent = certsText;
        document.getElementById('preview-section-certifications').classList.remove('hidden');
    } else {
        document.getElementById('preview-section-certifications').classList.add('hidden');
    }

    // 4.4 Dynamic Work History
    const expContainer = document.getElementById('preview-experience');
    expContainer.innerHTML = '';
    
    let expValid = false;
    document.querySelectorAll('#experience-list .repeater-item').forEach(item => {
        const company = item.querySelector('.exp-company').value;
        const position = item.querySelector('.exp-position').value;
        const start = item.querySelector('.exp-start').value;
        const end = item.querySelector('.exp-end').value;
        const desc = item.querySelector('.exp-desc').value;

        if (company || position) {
            expValid = true;
            const block = document.createElement('div');
            block.className = 'preview-item-block';
            block.innerHTML = `
                <div class="preview-item-header">
                    <span>${position || 'Position'}</span>
                    <span>${company || 'Company'}</span>
                </div>
                <div class="preview-item-sub">
                    <span>${start || 'Start Date'} - ${end || 'End Date'}</span>
                </div>
                <p class="preview-item-desc">${desc}</p>
            `;
            expContainer.appendChild(block);
        }
    });
    
    if (expValid) {
        document.getElementById('preview-section-experience').classList.remove('hidden');
    } else {
        document.getElementById('preview-section-experience').classList.add('hidden');
    }

    // 4.5 Education details
    const eduContainer = document.getElementById('preview-education');
    eduContainer.innerHTML = '';
    
    let eduValid = false;
    document.querySelectorAll('#education-list .repeater-item').forEach(item => {
        const school = item.querySelector('.edu-school').value;
        const degree = item.querySelector('.edu-degree').value;
        const start = item.querySelector('.edu-start').value;
        const end = item.querySelector('.edu-end').value;

        if (school || degree) {
            eduValid = true;
            const block = document.createElement('div');
            block.className = 'preview-item-block';
            block.innerHTML = `
                <div class="preview-item-header">
                    <span>${degree || 'Degree'}</span>
                    <span>${school || 'School'}</span>
                </div>
                <div class="preview-item-sub">
                    <span>${start || 'Start Date'} - ${end || 'End Date'}</span>
                </div>
            `;
            eduContainer.appendChild(block);
        }
    });

    if (eduValid) {
        document.getElementById('preview-section-education').classList.remove('hidden');
    } else {
        document.getElementById('preview-section-education').classList.add('hidden');
    }

    // 4.6 Projects list
    const projContainer = document.getElementById('preview-projects');
    projContainer.innerHTML = '';
    
    let projValid = false;
    document.querySelectorAll('#projects-list .repeater-item').forEach(item => {
        const title = item.querySelector('.proj-title').value;
        const tech = item.querySelector('.proj-tech').value;
        const desc = item.querySelector('.proj-desc').value;

        if (title) {
            projValid = true;
            const block = document.createElement('div');
            block.className = 'preview-item-block';
            block.innerHTML = `
                <div class="preview-item-header">
                    <span>${title}</span>
                    <span style="font-size: 0.75rem; font-weight: 500; color: #4b5563;">[${tech || 'TechStack'}]</span>
                </div>
                <p class="preview-item-desc">${desc}</p>
            `;
            projContainer.appendChild(block);
        }
    });

    if (projValid) {
        document.getElementById('preview-section-projects').classList.remove('hidden');
    } else {
        document.getElementById('preview-section-projects').classList.add('hidden');
    }
}

// 5. Update Template Theme Class on Preview Sheet
function updateTemplateStyle() {
    const sheet = document.getElementById('resume-preview-sheet');
    const select = document.getElementById('builder-template-select');
    const template = select.value;

    // Reset styles
    sheet.classList.remove('modern-style', 'professional-style', 'tech-style');

    if (template === 'modern') {
        sheet.classList.add('modern-style');
    } else if (template === 'professional') {
        sheet.classList.add('professional-style');
    } else if (template === 'tech') {
        sheet.classList.add('tech-style');
    }
}

// 6. Reset Forms inputs to clean slate
function resetBuilderForms() {
    window.builderEditId = null;
    document.getElementById('field-name').value = '';
    document.getElementById('field-title').value = '';
    document.getElementById('field-email').value = '';
    document.getElementById('field-phone').value = '';
    document.getElementById('field-linkedin').value = '';
    document.getElementById('field-website').value = '';
    document.getElementById('field-summary').value = '';
    document.getElementById('field-skills').value = '';
    document.getElementById('field-certifications').value = '';

    document.getElementById('experience-list').innerHTML = '';
    document.getElementById('education-list').innerHTML = '';
    document.getElementById('projects-list').innerHTML = '';
}

// 7. Load existing resume details for Edit Mode
async function loadResumeToBuilder(id) {
    toggleLoader(true, 'Fetching resume details...');
    try {
        const response = await fetch(`${API_BASE}/resumes/${id}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            
            // Pop fields
            document.getElementById('builder-template-select').value = data.templateId || 'modern';
            updateTemplateStyle();

            // Personal
            if (data.personalDetails) {
                const pers = JSON.parse(data.personalDetails);
                document.getElementById('field-name').value = pers.name || '';
                document.getElementById('field-title').value = pers.title || '';
                document.getElementById('field-email').value = pers.email || '';
                document.getElementById('field-phone').value = pers.phone || '';
                document.getElementById('field-linkedin').value = pers.linkedin || '';
                document.getElementById('field-website').value = pers.website || '';
                document.getElementById('field-summary').value = pers.summary || '';
            }

            // Skills
            if (data.skills) {
                const skillsArr = JSON.parse(data.skills);
                document.getElementById('field-skills').value = Array.isArray(skillsArr) ? skillsArr.join(', ') : skillsArr;
            }

            // Certs
            if (data.certifications) {
                const certsArr = JSON.parse(data.certifications);
                document.getElementById('field-certifications').value = Array.isArray(certsArr) ? certsArr.join(', ') : certsArr;
            }

            // Repeaters mapping
            document.getElementById('experience-list').innerHTML = '';
            if (data.experience) {
                const list = JSON.parse(data.experience);
                list.forEach(item => addExperienceItem(item));
            }

            document.getElementById('education-list').innerHTML = '';
            if (data.education) {
                const list = JSON.parse(data.education);
                list.forEach(item => addEducationItem(item));
            }

            document.getElementById('projects-list').innerHTML = '';
            if (data.projects) {
                const list = JSON.parse(data.projects);
                list.forEach(item => addProjectItem(item));
            }
        }
    } catch (e) {
        showToast('Error loading resume to editor.', 'error');
    } finally {
        toggleLoader(false);
    }
}

// 8. Compile and Save builder data to backend
async function saveBuilderProgress() {
    const title = prompt('Enter a label or title for this resume profile:', 'My Technical Profile');
    if (!title) return;

    toggleLoader(true, 'Saving resume to MySQL database...');

    // Extract dynamic form fields arrays
    const personal = {
        name: document.getElementById('field-name').value,
        title: document.getElementById('field-title').value,
        email: document.getElementById('field-email').value,
        phone: document.getElementById('field-phone').value,
        linkedin: document.getElementById('field-linkedin').value,
        website: document.getElementById('field-website').value,
        summary: document.getElementById('field-summary').value
    };

    const skills = document.getElementById('field-skills').value.split(',').map(s => s.trim()).filter(Boolean);
    const certs = document.getElementById('field-certifications').value.split(',').map(s => s.trim()).filter(Boolean);

    const experience = [];
    document.querySelectorAll('#experience-list .repeater-item').forEach(item => {
        experience.push({
            company: item.querySelector('.exp-company').value,
            position: item.querySelector('.exp-position').value,
            startDate: item.querySelector('.exp-start').value,
            endDate: item.querySelector('.exp-end').value,
            description: item.querySelector('.exp-desc').value
        });
    });

    const education = [];
    document.querySelectorAll('#education-list .repeater-item').forEach(item => {
        education.push({
            school: item.querySelector('.edu-school').value,
            degree: item.querySelector('.edu-degree').value,
            startDate: item.querySelector('.edu-start').value,
            endDate: item.querySelector('.edu-end').value
        });
    });

    const projects = [];
    document.querySelectorAll('#projects-list .repeater-item').forEach(item => {
        projects.push({
            title: item.querySelector('.proj-title').value,
            technologies: item.querySelector('.proj-tech').value,
            description: item.querySelector('.proj-desc').value
        });
    });

    const payload = {
        title: title,
        templateId: document.getElementById('builder-template-select').value,
        personalDetails: JSON.stringify(personal),
        skills: JSON.stringify(skills),
        certifications: JSON.stringify(certs),
        experience: JSON.stringify(experience),
        education: JSON.stringify(education),
        projects: JSON.stringify(projects)
    };

    try {
        let response;
        if (window.builderEditId) {
            response = await fetch(`${API_BASE}/resumes/${window.builderEditId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetch(`${API_BASE}/resumes`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            const saved = await response.json();
            
            // Proactively trigger a background ATS analyzer run to populate their score immediately!
            await fetch(`${API_BASE}/analysis/resume/${saved.id}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            showToast('Resume saved successfully!', 'success');
            resetBuilderForms();
            navigateToView('dashboard-view');
        } else {
            showToast('Failed to save resume.', 'error');
        }
    } catch (e) {
        showToast('Server connection failed.', 'error');
    } finally {
        toggleLoader(false);
    }
}

// 9. Printing & Downloading PDF
function triggerPrint() {
    // Standard Print triggers media query settings making a clean PDF printout
    window.print();
}
