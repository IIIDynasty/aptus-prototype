/* ============================================
   APTUS — Application Logic
   ============================================ */

// ============================================
// STATE
// ============================================
let currentRole = null;
let currentRecruiterView = 'dashboard';
let currentCandidateView = 'apply';
let jobSkills = [];
let selectedCommunities = [];
let currentJobIndex = 0;
let candidateStatuses = {};
let cvUploaded = false;
let coverLetterUploaded = false;
let candidateSkills = [];
let customQuestions = [];

// Northern Nigerian states for location autocomplete
const NORTHERN_STATES = [
  'Bauchi', 'Benue', 'Borno', 'Gombe', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Plateau', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

// ============================================
// SEED DATA
// ============================================
const JOBS = [
  {
    title: 'Senior Software Engineer',
    dept: 'Engineering',
    location: 'Lagos, Nigeria (Hybrid)',
    level: 'Senior Level (5+ years)',
    skills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Docker', 'REST APIs'],
    applicants: 18,
    shortlisted: 5
  },
  {
    title: 'Product Manager',
    dept: 'Product',
    location: 'Remote (Nigeria)',
    level: 'Mid Level (2–5 years)',
    skills: ['Product Strategy', 'Agile', 'Figma', 'SQL', 'Stakeholder Management'],
    applicants: 14,
    shortlisted: 4
  },
  {
    title: 'Data Analyst',
    dept: 'Data & Analytics',
    location: 'Abuja, Nigeria (On-site)',
    level: 'Entry Level (0–2 years)',
    skills: ['Excel', 'SQL', 'Power BI', 'Python', 'Data Visualisation'],
    applicants: 15,
    shortlisted: 3
  }
];

const CANDIDATES = [
  // Job 0: Senior Software Engineer
  [
    { name: 'Chukwuemeka Okafor', role: 'Senior Developer at Flutterwave', years: 7, skills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Docker', 'REST APIs', 'Redis'], quals: 'BSc Computer Science, AWS Certified', summary: 'Built payment APIs processing ₦4B+ monthly, led team of 5 engineers, reduced system latency by 62%.' },
    { name: 'Adaeze Nwosu', role: 'Software Engineer at Paystack', years: 6, skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'REST APIs', 'GraphQL'], quals: 'BSc Computer Engineering', summary: 'Delivered 12+ REST API endpoints serving 200k+ daily users, improved test coverage from 48% to 88%.' },
    { name: 'Babatunde Adeyemi', role: 'Full Stack Developer at Andela', years: 5, skills: ['Python', 'PostgreSQL', 'AWS', 'REST APIs', 'Node.js'], quals: 'BSc Information Systems, GCP Associate', summary: 'Migrated legacy monolith to microservices, reducing deployment time by 45% and improving uptime to 99.7%.' },
    { name: 'Chiamaka Eze', role: 'Backend Engineer at Kuda Bank', years: 4, skills: ['Django', 'PostgreSQL', 'Docker', 'REST APIs'], quals: 'BSc Software Engineering', summary: 'Built core transaction features for 1M+ user digital bank, wrote robust unit tests achieving 91% coverage.' },
    { name: 'Oluwafemi Adesola', role: 'Software Developer at Interswitch', years: 5, skills: ['Python', 'AWS', 'REST APIs', 'PostgreSQL'], quals: 'HND Computer Science', summary: 'Developed fintech integrations used by 300+ merchant partners across West Africa.' },
    { name: 'Ngozi Okonkwo', role: 'Junior Developer at TechCabal', years: 2, skills: ['Python', 'REST APIs'], quals: 'BSc Computer Science', summary: 'Supported backend features for editorial CMS and internal tools.' },
    { name: 'Emeka Chukwu', role: 'IT Support at Lagos State Ministry', years: 1, skills: ['Python'], quals: 'OND Computer Science', summary: 'Provided internal IT support and basic scripting for data entry automation.' },
  ],
  // Job 1: Product Manager
  [
    { name: 'Tolu Fashola', role: 'Senior PM at Piggyvest', years: 5, skills: ['Product Strategy', 'Agile', 'Figma', 'SQL', 'Stakeholder Management', 'OKRs'], quals: 'BSc Economics, PMP Certified', summary: 'Grew Piggyvest savings feature from 50k to 800k users over 18 months, driving ₦1.2B additional deposits.' },
    { name: 'Seun Adewale', role: 'Product Lead at CowryWise', years: 4, skills: ['Product Strategy', 'Agile', 'Figma', 'SQL', 'Stakeholder Management'], quals: 'BSc Business Administration', summary: 'Led cross-functional team of 8 to launch 3 investment products, achieving 40k signups in first quarter.' },
    { name: 'Kemi Balogun', role: 'Associate PM at Jumia', years: 3, skills: ['Agile', 'Figma', 'SQL', 'Stakeholder Management'], quals: 'BSc Marketing, Google PM Certificate', summary: 'Managed product backlog and sprint ceremonies for logistics team serving 12 African markets.' },
    { name: 'David Osei', role: 'Business Analyst at GTBank', years: 2, skills: ['Agile', 'SQL', 'Figma'], quals: 'BSc Economics', summary: 'Wrote product requirements and coordinated testing cycles for new mobile banking features.' },
  ],
  // Job 2: Data Analyst
  [
    { name: 'Ifeoma Anene', role: 'Data Analyst at Access Bank', years: 2, skills: ['Excel', 'SQL', 'Power BI', 'Python', 'Data Visualisation'], quals: 'BSc Statistics', summary: 'Built 15+ Power BI dashboards tracking ₦500M+ portfolio health, reducing manual reporting time by 70%.' },
    { name: 'Bolu Akinsanya', role: 'Junior Analyst at MTN Nigeria', years: 1, skills: ['Excel', 'SQL', 'Power BI', 'Data Visualisation'], quals: 'BSc Mathematics', summary: 'Analysed subscriber churn patterns across 5 regional segments, supporting a 12% retention improvement campaign.' },
    { name: 'Chisom Uchenna', role: 'Data Entry Officer at Lagos State', years: 1, skills: ['Excel', 'SQL'], quals: 'HND Statistics', summary: 'Maintained government data records and prepared monthly summary reports for management.' },
  ]
];

// Free communities — clickable, sends admin notification email
const FREE_COMMUNITIES = [
  { name: 'Tech Professionals NG', icon: '💻', platform: 'WhatsApp', size: '12,400 members', color: '#25D366' },
  { name: 'Nigerian Developers', icon: '⚡', platform: 'Telegram', size: '8,700 members', color: '#229ED9' },
  { name: 'Engineering Hub Nigeria', icon: '⚙️', platform: 'Facebook', size: '34,200 members', color: '#1877F2' },
  { name: 'NYSC CDS – Tech Clusters', icon: '🎓', platform: 'WhatsApp', size: '6,500 members', color: '#25D366' },
  { name: 'UI/UX Nigeria', icon: '🎨', platform: 'Telegram', size: '9,100 members', color: '#229ED9' },
  { name: 'HealthTech Africa', icon: '🏥', platform: 'Facebook', size: '18,000 members', color: '#1877F2' },
];

// Paid communities — coming soon, non-clickable
const PAID_COMMUNITIES = [
  { name: 'Finance & Fintech Pros', icon: '💰', platform: 'WhatsApp', size: '21,300 members', color: '#25D366' },
  { name: 'Data Science Nigeria', icon: '📊', platform: 'Telegram', size: '7,600 members', color: '#229ED9' },
  { name: 'Alumni Network — UNILAG', icon: '🏛️', platform: 'Facebook', size: '44,000 members', color: '#1877F2' },
  { name: 'Nurses & Midwives NG', icon: '🩺', platform: 'WhatsApp', size: '14,700 members', color: '#25D366' },
  { name: 'Product Managers Africa', icon: '🗂️', platform: 'Telegram', size: '5,200 members', color: '#229ED9' },
  { name: 'Legal Professionals NG', icon: '⚖️', platform: 'WhatsApp', size: '8,300 members', color: '#25D366' },
];

// Combined for backwards-compatible uses
const COMMUNITIES = [...FREE_COMMUNITIES, ...PAID_COMMUNITIES];

const CV_EXAMPLES = [
  {
    category: 'Engineering / Technical',
    weak: 'Worked on API development and helped improve the codebase.',
    strong: 'Designed and implemented 7 RESTful API endpoints using Django REST Framework, reducing average response time from 340ms to 95ms and supporting 500k+ daily active users.',
  },
  {
    category: 'Sales & Business Development',
    weak: 'Responsible for sales and managing client relationships.',
    strong: 'Generated ₦18M in new B2B revenue over 6 months by onboarding 23 enterprise clients through a consultative sales approach, exceeding quarterly target by 34%.',
  },
  {
    category: 'Project Management',
    weak: 'Managed multiple projects and coordinated with different teams.',
    strong: 'Led simultaneous delivery of 4 digital transformation projects across 3 departments, completing all within budget and delivering 2 ahead of schedule, resulting in 20% operational cost reduction.',
  },
  {
    category: 'Data & Analytics',
    weak: 'Created reports and dashboards for the management team.',
    strong: 'Built a suite of 12 interactive Power BI dashboards tracking ₦2.4B+ in loan portfolio health, reducing manual reporting time by 68% and enabling weekly executive reviews.',
  },
];

const EXTERNAL_RESOURCES = [
  { icon: '📖', title: 'CV Writing Guide by Coursera', desc: 'Step-by-step guide to structuring a strong, ATS-friendly resume that highlights your achievements.', link: 'https://www.coursera.org/articles/how-to-make-a-resume' },
  { icon: '🎯', title: 'Google Career Certificates', desc: 'Free professional certifications in Data Analytics, Project Management, UX Design and more.', link: 'https://grow.google/certificates/' },
  { icon: '🔗', title: 'LinkedIn Profile Optimisation', desc: 'Official LinkedIn guide to building a profile that attracts recruiters organically.', link: 'https://www.linkedin.com/help/linkedin/answer/a554351' },
  { icon: '📊', title: 'Interview Preparation — Big Interview', desc: 'Practice competency-based interview questions with STAR method examples.', link: 'https://biginterview.com/' },
  { icon: '🏆', title: 'Jobberman Soft Skills Training', desc: 'Free employability and soft skills course from Nigeria\'s leading job board — certificate included.', link: 'https://www.jobberman.com/soft-skills-training' },
  { icon: '🎓', title: 'ALX Africa Professional Programmes', desc: 'Structured career accelerator programmes in Tech, Business, and Leadership for African professionals.', link: 'https://www.alxafrica.com/' },
];

// ============================================
// NAVIGATION & ROUTING
// ============================================
function goHome() {
  document.getElementById('landingPage').classList.remove('hidden');
  document.getElementById('recruiterFlow').classList.add('hidden');
  document.getElementById('candidateFlow').classList.add('hidden');
  const roleToggle = document.getElementById('roleToggle');
  if (roleToggle) roleToggle.style.display = 'none';
  currentRole = null;
}

function enterAs(role) {
  document.getElementById('landingPage').classList.add('hidden');
  const roleToggle = document.getElementById('roleToggle');
  if (roleToggle) roleToggle.style.display = 'flex';
  currentRole = role;

  if (role === 'recruiter') {
    document.getElementById('recruiterFlow').classList.remove('hidden');
    document.getElementById('candidateFlow').classList.add('hidden');
    const toggleRec = document.getElementById('toggleRecruiter');
    const toggleCand = document.getElementById('toggleCandidate');
    if (toggleRec) toggleRec.classList.add('active');
    if (toggleCand) toggleCand.classList.remove('active');
    renderDashboard();
    recruiterNav('dashboard');
  } else {
    document.getElementById('candidateFlow').classList.remove('hidden');
    document.getElementById('recruiterFlow').classList.add('hidden');
    const toggleRec2 = document.getElementById('toggleRecruiter2');
    const toggleCand2 = document.getElementById('toggleCandidate2');
    if (toggleCand2) toggleCand2.classList.add('active');
    if (toggleRec2) toggleRec2.classList.remove('active');
    candidateNav('apply');
  }
}

function switchRole(role) {
  if (role === currentRole) return;
  enterAs(role);
  showToast(`Switched to ${role.charAt(0).toUpperCase() + role.slice(1)} view`, 'gold', '🔄');
}

// ============================================
// RECRUITER NAVIGATION
// ============================================
async function recruiterNav(view) {
  // Clear rankings auto-refresh when leaving rankings page
  if (view !== 'rankings' && window.rankingsRefreshInterval) {
    clearInterval(window.rankingsRefreshInterval);
    window.rankingsRefreshInterval = null;
  }
  
  ['dashboard', 'create', 'rankings', 'communities'].forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
    const sb = document.getElementById(`sb-${v}`);
    if (sb) sb.classList.remove('active');
  });

  const el = document.getElementById(`view-${view}`);
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('animate-in');
  }

  const sb = document.getElementById(`sb-${view}`);
  if (sb) sb.classList.add('active');

  currentRecruiterView = view;

  if (view === 'rankings') {
    await populateJobFilterDropdown();
    const jobId = window.currentJobId || document.getElementById('rankingJobFilter')?.value;
    if (jobId) {
      await renderRankings(jobId);
    }
  }
  if (view === 'communities') renderAllCommunities();
  if (view === 'create') {
    resetCreateForm();
    renderCommunityGrid();
  }
}

// ============================================
// CANDIDATE NAVIGATION
// ============================================
async function candidateNav(view) {
  ['apply', 'resources'].forEach(v => {
    const el = document.getElementById(`cview-${v}`);
    if (el) el.classList.add('hidden');
    const sb = document.getElementById(`csb-${v}`);
    if (sb) sb.classList.remove('active');
  });

  const el = document.getElementById(`cview-${view}`);
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('animate-in');
  }

  const sb = document.getElementById(`csb-${view}`);
  if (sb) sb.classList.add('active');

  currentCandidateView = view;

  if (view === 'apply') {
    await loadJobForCandidate();
  }
  if (view === 'resources') renderResourceHub();
}

// Load job details for candidate application page
async function loadJobForCandidate() {
  try {
    // Get jobId from URL parameter or use current job
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId') || window.currentJobId;
    
    if (!jobId) {
      console.log('No jobId found, keeping default values');
      return;
    }
    
    // Fetch job details
    const job = await getJob(jobId);
    
    // Store for form submission
    window.currentCandidateJobId = jobId;
    
    // Update page header
    document.getElementById('cJobTitle').textContent = job.title;
    
    // Show Hausa toggle for demo jobs
    if (job.title.toLowerCase().includes('demo') || job.title.toLowerCase().includes('customer support')) {
      document.getElementById('candidateHausaToggle').style.display = 'flex';
      // Store original English job data for resetting
      window._demoOriginalJob = job;
    } else {
      document.getElementById('candidateHausaToggle').style.display = 'none';
    }
    
    // Update job metadata in header
    const headerP = document.querySelector('#cview-apply .page-header p');
    if (headerP) {
      headerP.innerHTML = `${job.location} · ${job.experienceLevel} · <span class="badge badge-gold" style="font-size:11px;">${job.department}</span>`;
    }
    
    // Show job description in sidebar if it exists
    const jobDescSidebar = document.getElementById('jobDescriptionSidebar');
    if (jobDescSidebar) {
      const formatted = formatJobDescriptionHTML(job);
      jobDescSidebar.innerHTML = formatted;
      jobDescSidebar.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Failed to load job for candidate:', error);
    // Keep default/hardcoded values if loading fails
  }
}

// Format job description as HTML for sidebar
function formatJobDescriptionHTML(job) {
  const skillsList = job.skills.map(s => `<li>${s}</li>`).join('');
  
  return `
    <div style="padding:20px;">
      <h3 style="font-size:18px;font-weight:700;color:var(--charcoal);margin-bottom:16px;">${job.title}</h3>
      
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:8px;">📍 LOCATION</div>
        <div style="font-size:14px;color:var(--charcoal);">${job.location}</div>
      </div>
      
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:8px;">💼 DEPARTMENT</div>
        <div style="font-size:14px;color:var(--charcoal);">${job.department}</div>
      </div>
      
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:8px;">📊 EXPERIENCE LEVEL</div>
        <div style="font-size:14px;color:var(--charcoal);">${job.experienceLevel}</div>
      </div>
      
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:8px;">📝 ABOUT THE ROLE</div>
        <div style="font-size:13px;color:var(--text-dark);line-height:1.6;white-space:pre-wrap;">${job.description}</div>
      </div>
      
      ${job.responsibilities && job.responsibilities.length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:8px;">📌 KEY RESPONSIBILITIES</div>
        <ul style="font-size:13px;color:var(--text-dark);line-height:1.8;padding-left:20px;">
          ${job.responsibilities.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:8px;">🎯 REQUIRED SKILLS</div>
        <ul style="font-size:13px;color:var(--text-dark);line-height:1.8;padding-left:20px;">
          ${skillsList}
        </ul>
      </div>
      
      ${job.qualifications && job.qualifications.length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:8px;">✅ MINIMUM REQUIREMENTS</div>
        <ul style="font-size:13px;color:var(--text-dark);line-height:1.8;padding-left:20px;">
          ${Array.isArray(job.qualifications) ? job.qualifications.map(q => `<li>${q}</li>`).join('') : `<li>${job.qualifications}</li>`}
        </ul>
      </div>
      ` : ''}

      ${job.perks && job.perks.length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:8px;">🎁 PERKS & BENEFITS</div>
        <ul style="font-size:13px;color:var(--text-dark);line-height:1.8;padding-left:20px;">
          ${job.perks.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${job.niceToHave && job.niceToHave.length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:8px;">✨ NICE TO HAVE</div>
        <ul style="font-size:13px;color:var(--text-dark);line-height:1.8;padding-left:20px;">
          ${job.niceToHave.map(n => `<li>${n}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
  `;
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboardJobs() {
  try {
    const jobs = await getAllJobs();
    renderDashboardWithJobs(jobs);
  } catch (error) {
    console.error('Failed to load jobs:', error);
    // Fallback to mock data if API fails
    renderDashboardWithJobs(JOBS);
  }
}

function renderDashboardWithJobs(jobs) {
  const container = document.getElementById('jobListContainer');
  let totalApplicants = 0;
  let totalShortlisted = 0;
  let totalScores = 0;
  let scoreCount = 0;

  container.innerHTML = jobs.map((job, i) => {
    const applicants = job.applicantCount || 0;
    const shortlisted = job.shortlistedCount || 0;
    
    totalApplicants += applicants;
    totalShortlisted += shortlisted;
    
    // Calculate average score for this job if available
    if (job.averageMatchScore) {
      totalScores += job.averageMatchScore;
      scoreCount++;
    }
    
    return `
      <div class="job-item" onclick="viewJobRankings('${job.id}')">
        <div class="job-item-info">
          <h4>${job.title}</h4>
          <div class="job-item-meta">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${job.location}
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
              ${job.department}
            </span>
            <span>${job.experienceLevel}</span>
          </div>
        </div>
        <div class="job-item-actions">
          <span class="badge badge-gray">${applicants} Applicants</span>
          <span class="badge badge-success">${shortlisted} Shortlisted</span>
          <span class="badge badge-gold">Active</span>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); copyJobLink('${job.id}')">📋 Copy Link</button>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); viewJobRankings('${job.id}')">View Rankings →</button>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteJob('${job.id}', '${job.title.replace(/'/g, "\\'")}')">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');

  // Update stats
  document.getElementById('stat-applicants').textContent = totalApplicants;
  document.getElementById('stat-shortlisted').textContent = totalShortlisted;
  document.getElementById('stat-active').textContent = jobs.length;
  
  // Update average match score if we have data
  if (scoreCount > 0) {
    const avgScore = Math.round(totalScores / scoreCount);
    const avgElement = document.querySelector('.stat-value.gold');
    if (avgElement && avgElement.parentElement.querySelector('.stat-label').textContent === 'Avg. Match Score') {
      avgElement.textContent = `${avgScore}%`;
    }
  }
}

function renderDashboard() {
  loadDashboardJobs();
}

function viewJobRankings(jobId) {
  window.currentJobId = jobId;
  recruiterNav('rankings');
}

// Copy job application link
async function copyJobLink(jobId) {
  try {
    // Generate the application link
    const baseUrl = window.location.origin;
    const applicationLink = `${baseUrl}?jobId=${jobId}`;
    
    await navigator.clipboard.writeText(applicationLink);
    showToast('Application link copied!', 'success', '📋');
  } catch (error) {
    console.error('Failed to copy link:', error);
    showToast('Failed to copy link', 'danger', '❌');
  }
}

// Delete job
async function deleteJob(jobId, jobTitle) {
  const confirmed = confirm(`Delete job "${jobTitle}"?\n\nThis will permanently delete the job and all associated candidate applications. This action cannot be undone.`);
  
  if (!confirmed) return;
  
  showProcessing('Deleting Job...', 'Removing job and associated candidates from the system.');
  
  try {
    // Call API to delete job (close it)
    const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete job');
    }
    
    hideProcessing();
    showToast('Job deleted successfully', 'success', '✅');
    
    // Refresh dashboard
    loadDashboardJobs();
  } catch (error) {
    hideProcessing();
    console.error('Failed to delete job:', error);
    showToast('Failed to delete job', 'danger', '❌');
  }
}

// ============================================
// JOB CREATION STEPS
// ============================================
function resetCreateForm() {
  document.getElementById('createStep1').classList.remove('hidden');
  document.getElementById('createStep2').classList.add('hidden');
  document.getElementById('createStep3').classList.add('hidden');
  setStepProgress(1);
  jobSkills = [];
  selectedCommunities = [];
  renderSkillTags();
  // Clear fields
  ['jobTitle','jobDept','jobLocation','jobDesc','jobQuals','skillInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const lvl = document.getElementById('jobLevel');
  if (lvl) lvl.value = '';
}

function setStepProgress(step) {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`create-step-${i}`);
    if (!el) continue;
    el.classList.remove('active', 'completed');
    if (i < step) el.classList.add('completed');
    else if (i === step) el.classList.add('active');
  }
}

function nextCreateStep(from) {
  if (from === 1) {
    const title = document.getElementById('jobTitle').value.trim();
    const location = document.getElementById('jobLocation').value.trim();
    const level = document.getElementById('jobLevel').value;
    const desc = document.getElementById('jobDesc').value.trim();
    const resp = document.getElementById('jobResp').value.trim();

    if (!title || !location || !level || !desc || !resp) {
      showToast('Please fill in all required fields', 'danger', '⚠️');
      return;
    }
    if (jobSkills.length === 0) {
      showToast('Add at least one required skill', 'danger', '⚠️');
      return;
    }
    document.getElementById('createStep1').classList.add('hidden');
    document.getElementById('createStep2').classList.remove('hidden');
    setStepProgress(2);
  } else if (from === 2) {
    // Real API call to create job
    showProcessing('Publishing your job posting…', 'Distributing to selected communities and platforms');
    
    const textToArray = (str) => (str || '').split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    const jobData = {
      title: document.getElementById('jobTitle').value.trim(),
      department: document.getElementById('jobDept').value.trim() || 'General',
      location: document.getElementById('jobLocation').value.trim(),
      experienceLevel: document.getElementById('jobLevel').value,
      description: document.getElementById('jobDesc').value.trim(),
      responsibilities: textToArray(document.getElementById('jobResp').value),
      skills: [...jobSkills],
      qualifications: textToArray(document.getElementById('jobQuals').value),
      perks: textToArray(document.getElementById('jobPerks').value),
      niceToHave: textToArray(document.getElementById('jobNiceToHave').value),
      selectedChannels: selectedCommunities.map(i => COMMUNITIES[i].name)
    };
    
    createJob(jobData)
      .then(result => {
        hideProcessing();
        
        // Display the generated links
        document.getElementById('publishedLink').textContent = result.applicationLink;
        
        // Store job ID and link for later use (community notifications etc.)
        window.currentCreatedJobId = result.job.id;
        window.currentPublishedJobLink = result.applicationLink;
        
        // Fire off emails for any selected FREE communities now that we have the real link
        selectedCommunities.forEach(async (index) => {
          const communityName = COMMUNITIES[index].name;
          if (FREE_COMMUNITIES.some(c => c.name === communityName)) {
            try {
              await fetch('/api/emails/notify-community', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ communityName, jobLink: result.applicationLink })
              });
              showToast(`📧 Distributed to ${communityName}`, 'success', '✅');
            } catch (e) {
              console.error('Community notification error:', e);
            }
          }
        });
        
        document.getElementById('createStep2').classList.add('hidden');
        document.getElementById('createStep3').classList.remove('hidden');
        setStepProgress(3);
        showToast('Job published successfully!', 'success', '✅');
        
        // Refresh dashboard
        loadDashboardJobs();
      })
      .catch(error => {
        hideProcessing();
        showToast(error.message || 'Failed to create job', 'danger', '❌');
      });
  }
}

function prevCreateStep(from) {
  if (from === 2) {
    document.getElementById('createStep2').classList.add('hidden');
    document.getElementById('createStep1').classList.remove('hidden');
    setStepProgress(1);
  }
}

// ============================================
// SKILLS INPUT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const skillInput = document.getElementById('skillInput');
  if (skillInput) {
    skillInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
    });
  }
  
  // Check if URL has jobId parameter (candidate application link)
  // getJobIdFromURL() checks both ?jobId= query param AND /jobs/JOB-XXXX/ path format
  const jobId = getJobIdFromURL();
  
  if (jobId) {
    // Candidate clicked application link - show candidate view
    enterAs('candidate');
  } else {
    // Normal flow - show recruiter dashboard
    renderDashboard();
    renderCommunityGrid();
  }
});

function addSkill() {
  const input = document.getElementById('skillInput');
  const val = input.value.trim();
  if (!val) return;
  if (jobSkills.includes(val)) { showToast('Skill already added', 'danger', '⚠️'); return; }
  jobSkills.push(val);
  input.value = '';
  renderSkillTags();
}

function removeSkill(skill) {
  jobSkills = jobSkills.filter(s => s !== skill);
  renderSkillTags();
}

function renderSkillTags() {
  const container = document.getElementById('skillTags');
  if (!container) return;
  container.innerHTML = jobSkills.map(skill => `
    <span class="skill-tag">
      ${skill}
      <button class="skill-tag-remove" onclick="removeSkill('${skill}')" title="Remove">×</button>
    </span>
  `).join('');
}

// ============================================
// ============================================
// COMMUNITY GRID
// ============================================
function renderCommunityGrid() {
  const container = document.getElementById('communityGrid');
  if (!container) return;
  selectedCommunities = [];

  const currentJobLink = window.currentPublishedJobLink || window.location.href;

  container.innerHTML = `
    <!-- Free Communities -->
    <div style="grid-column: 1 / -1; margin-bottom: 6px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
        <span style="font-size:13px; font-weight:700; color:var(--charcoal);">🟢 Free Communities</span>
        <span class="badge badge-success" style="font-size:10px;">Distribute for free</span>
      </div>
    </div>
    ${FREE_COMMUNITIES.map((c, i) => `
      <div class="community-card" id="comm-free-${i}" onclick="toggleFreeCommunity(${i}, '${c.name.replace(/'/g, "&#39;")}', this)" title="Click to select and notify this community">
        <div class="community-check">
          <svg viewBox="0 0 24 24" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="community-icon" style="background:${c.color}22;">${c.icon}</div>
        <div class="community-name">${c.name}</div>
        <div class="community-size">${c.platform} · ${c.size}</div>
      </div>
    `).join('')}

    <!-- Paid Communities -->
    <div style="grid-column: 1 / -1; margin-top:20px; margin-bottom:6px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
        <span style="font-size:13px; font-weight:700; color:var(--charcoal);">⚡ Premium Communities</span>
        <span class="badge badge-gold" style="font-size:10px;">Coming Soon</span>
      </div>
    </div>
    ${PAID_COMMUNITIES.map((c, i) => `
      <div class="community-card" style="opacity:0.55; cursor:not-allowed; position:relative; overflow:hidden;">
        <div style="position:absolute;top:8px;right:8px;background:var(--primary-blue);color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">Coming Soon</div>
        <div class="community-icon" style="background:${c.color}22;">${c.icon}</div>
        <div class="community-name">${c.name}</div>
        <div class="community-size">${c.platform} · ${c.size}</div>
      </div>
    `).join('')}
  `;
}

function toggleFreeCommunity(index, communityName, el) {
  const card = document.getElementById(`comm-free-${index}`);
  const isSelected = card.classList.contains('selected');

  if (isSelected) {
    card.classList.remove('selected');
    selectedCommunities = selectedCommunities.filter(x => x !== index);
  } else {
    card.classList.add('selected');
    if (!selectedCommunities.includes(index)) {
      selectedCommunities.push(index);
    }
  }
}

function toggleCommunity(i) {
  const el = document.getElementById(`comm-${i}`);
  if (selectedCommunities.includes(i)) {
    selectedCommunities = selectedCommunities.filter(x => x !== i);
    el.classList.remove('selected');
  } else {
    selectedCommunities.push(i);
    el.classList.add('selected');
  }
}

function renderAllCommunities() {
  const container = document.getElementById('allCommunitiesGrid');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; margin-bottom:6px;">
      <span style="font-size:13px; font-weight:700; color:var(--charcoal);">🟢 Free Communities</span>
    </div>
    ${FREE_COMMUNITIES.map(c => `
      <div class="community-card selected" style="cursor:default;">
        <div class="community-check" style="opacity:1;">
          <svg viewBox="0 0 24 24" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="community-icon" style="background:${c.color}22;">${c.icon}</div>
        <div class="community-name">${c.name}</div>
        <div class="community-size">${c.platform} · ${c.size}</div>
      </div>
    `).join('')}
    <div style="grid-column: 1 / -1; margin-top:20px; margin-bottom:6px;">
      <span style="font-size:13px; font-weight:700; color:var(--charcoal);">⚡ Premium Communities</span>
      <span class="badge badge-gold" style="margin-left:8px; font-size:10px;">Coming Soon</span>
    </div>
    ${PAID_COMMUNITIES.map(c => `
      <div class="community-card" style="opacity:0.55; cursor:not-allowed; position:relative; overflow:hidden;">
        <div style="position:absolute;top:8px;right:8px;background:var(--primary-blue);color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">Coming Soon</div>
        <div class="community-icon" style="background:${c.color}22;">${c.icon}</div>
        <div class="community-name">${c.name}</div>
        <div class="community-size">${c.platform} · ${c.size}</div>
      </div>
    `).join('')}
  `;
}

// ============================================
// CANDIDATE RANKINGS (Updated with real API)
// ============================================
let rankingsRefreshInterval = null;

async function renderRankings(jobId, enableAutoRefresh = true) {
  try {
    // Clear any existing refresh interval
    if (rankingsRefreshInterval) {
      clearInterval(rankingsRefreshInterval);
      rankingsRefreshInterval = null;
    }
    
    // If jobId is a number (old mock system), convert to actual job
    if (typeof jobId === 'number') {
      const jobs = await getAllJobs();
      if (jobs && jobs[jobId]) {
        jobId = jobs[jobId].id;
      } else {
        jobId = window.currentJobId || null;
      }
    }
    
    if (!jobId) {
      console.error('No job ID provided for rankings');
      return;
    }
    
    // Store current job ID for refresh
    window.currentJobId = jobId;
    
    // Fetch real data from API
    const [job, candidates, analytics] = await Promise.all([
      getJobPosting(jobId),
      getCandidatesByJob(jobId),
      getPlatformAnalytics(jobId).catch(() => []) // Optional analytics
    ]);
    
    if (!job) return;
    
    document.getElementById('rankingJobTitle').textContent = job.title;
    
    // Sort candidates by match score (descending)
    const sorted = candidates.sort((a, b) => {
      const scoreA = (a.scores && a.scores.total) || 0;
      const scoreB = (b.scores && b.scores.total) || 0;
      return scoreB - scoreA;
    });
    
    const tbody = document.getElementById('rankingTableBody');
    tbody.innerHTML = sorted.map((c, idx) => {
      const score = (c.scores && c.scores.total) || 0;
      const barClass = score >= 80 ? 'score-high' : score >= 55 ? 'score-mid' : 'score-low';
      const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-n';
      const status = c.status || 'pending';
      
      const statusBadge = status === 'shortlisted'
        ? '<span class="badge badge-success">✓ Shortlisted</span>'
        : status === 'rejected'
          ? '<span class="badge badge-danger">✕ Rejected</span>'
          : '<span class="badge badge-gray">Pending</span>';
      
      const skillMatched = c.skills ? c.skills.filter(s => 
        job.skills.some(js => js.toLowerCase() === s.toLowerCase())
      ) : [];
      const skillTotal = job.skills.length;
      
      const yearsExp = c.yearsOfExperience || 0;
      
      return `
        <tr>
          <td style="width:40px; text-align:center;">
            <input type="checkbox" class="candidate-checkbox" data-id="${c.id}" data-jobid="${jobId}"
              style="width:16px;height:16px;cursor:pointer;accent-color:var(--primary-blue);"
            />
          </td>
          <td><div class="rank-badge ${rankClass}">${idx + 1}</div></td>
          <td>
            <div class="candidate-name">${c.fullName || 'Unknown'}</div>
            <div class="candidate-sub">${c.currentRole || 'Applicant'}</div>
          </td>
          <td class="text-sm">${yearsExp} year${yearsExp !== 1 ? 's' : ''}</td>
          <td>
            <div class="score-bar-wrap">
              <div class="score-bar-bg">
                <div class="score-bar-fill ${barClass}" style="width:${score}%;"></div>
              </div>
              <span class="score-val ${barClass}">${score}%</span>
            </div>
          </td>
          <td>
            <span class="badge ${skillMatched.length >= skillTotal * 0.75 ? 'badge-success' : skillMatched.length >= skillTotal * 0.5 ? 'badge-gold' : 'badge-danger'}">
              ${skillMatched.length}/${skillTotal} skills
            </span>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm" onclick="openCandidateDetails('${c.id}', '${jobId}')">
                View
              </button>
              <button class="btn btn-success btn-sm" onclick="shortlistCandidate('${c.id}','${jobId}')" ${status==='shortlisted'?'disabled':''}>
                Shortlist
              </button>
              <button class="btn btn-danger btn-sm"
                data-id="${c.id}" data-jobid="${jobId}"
                data-name="${(c.fullName||'Candidate').replace(/"/g,'&quot;')}"
                data-role="${(c.currentRole||'Applicant').replace(/"/g,'&quot;')}"
                onclick="openRejectionModal(this.dataset.id,this.dataset.jobid,this.dataset.name,this.dataset.role)"
                ${status==='rejected'?'disabled':''}>
                Reject
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    const shortlistedCount = sorted.filter(c => c.status === 'shortlisted').length;
    document.getElementById('shortlistCount').textContent = `${shortlistedCount} Shortlisted`;
    document.getElementById('totalCount').textContent = `${sorted.length} Total`;
    
    // Render platform analytics if available
    if (analytics && analytics.length > 0) {
      renderPlatformAnalytics(analytics);
    } else {
      document.getElementById('platformAnalyticsCard').style.display = 'none';
    }
    
    // Set up auto-refresh every 30 seconds if enabled
    if (enableAutoRefresh && currentRecruiterView === 'rankings') {
      rankingsRefreshInterval = setInterval(() => {
        // Only refresh if still on rankings page
        if (currentRecruiterView === 'rankings') {
          console.log('Auto-refreshing rankings...');
          renderRankings(jobId, false); // Don't set up another interval
        } else {
          clearInterval(rankingsRefreshInterval);
          rankingsRefreshInterval = null;
        }
      }, 30000); // 30 seconds
    }
    
  } catch (error) {
    console.error('Failed to load rankings:', error);
    showToast('Failed to load candidate rankings', 'danger', '❌');
  }
}

// Platform Analytics Rendering (Task 18)
function renderPlatformAnalytics(analytics) {
  const container = document.getElementById('analyticsTableContainer');
  const card = document.getElementById('platformAnalyticsCard');
  
  if (!analytics || analytics.length === 0) {
    card.style.display = 'none';
    return;
  }
  
  card.style.display = 'block';
  
  container.innerHTML = `
    <table class="analytics-table">
      <thead>
        <tr>
          <th>Source</th>
          <th>Applications</th>
          <th>Avg Match Score</th>
          <th>Shortlisted</th>
          <th>Quality Rating</th>
        </tr>
      </thead>
      <tbody>
        ${analytics.map(stat => {
          const stars = '⭐'.repeat(stat.qualityRating) + '☆'.repeat(5 - stat.qualityRating);
          const scoreClass = stat.avgMatchScore >= 70 ? 'text-success' : stat.avgMatchScore >= 50 ? 'text-gold' : 'text-mid';
          
          return `
            <tr>
              <td>
                <div style="font-weight:600;color:var(--charcoal);text-transform:capitalize;">${stat.source}</div>
              </td>
              <td>
                <span class="badge badge-gray">${stat.applicationCount}</span>
              </td>
              <td>
                <span class="${scoreClass}" style="font-weight:600;">${stat.avgMatchScore}%</span>
              </td>
              <td>
                <span class="badge badge-success">${stat.shortlistedCount}</span>
              </td>
              <td>
                <div style="font-size:16px;letter-spacing:1px;">${stars}</div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// ============================================
// BULK EMAIL ACTIONS
// ============================================
async function handleBulkAction(action) {
  const checkboxes = document.querySelectorAll('.candidate-checkbox:checked');
  if (checkboxes.length === 0) {
    showToast('Please select at least one candidate', 'danger', '⚠️');
    return;
  }

  const jobId = checkboxes[0].dataset.jobid;
  const candidateIds = Array.from(checkboxes).map(cb => cb.dataset.id);
  const label = action === 'interview' ? 'Interview Invites' : 'Rejection Emails';

  const confirmed = confirm(`Send ${label} to ${candidateIds.length} candidate(s)?`);
  if (!confirmed) return;

  showToast(`Sending ${label}…`, 'gold', '📧');

  try {
    const res = await fetch('/api/emails/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateIds, jobId, action })
    });
    const data = await res.json();

    if (res.ok) {
      const msg = `✅ ${data.processed} email(s) sent${data.failed > 0 ? `, ${data.failed} failed` : ''}`;
      showToast(msg, 'success', '✅');
      // Uncheck all and refresh
      checkboxes.forEach(cb => cb.checked = false);
      await renderRankings(jobId, false);
    } else {
      showToast(data.error || 'Bulk action failed', 'danger', '✕');
    }
  } catch (err) {
    console.error('Bulk action error:', err);
    showToast('Network error sending emails', 'danger', '✕');
  }
}

// Shortlist and Reject Actions (Real API calls)
async function shortlistCandidate(candidateId, jobId) {
  try {
    showToast('Sending invite…', 'gold', '📧');
    const res = await fetch('/api/emails/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateIds: [candidateId], jobId, action: 'interview' })
    });
    if (!res.ok) throw new Error('API failed');
    
    showToast('Candidate shortlisted ✓', 'success', '✅');
    
    // Refresh rankings
    await renderRankings(jobId);
    
    // Update dashboard stats
    loadDashboardJobs();
  } catch (error) {
    console.error('Failed to shortlist candidate:', error);
    showToast('Failed to shortlist candidate', 'danger', '❌');
  }
}

async function openRejectionModal(candidateId, jobId, name, role) {
  try {
    const job = await getJobPosting(jobId);
    
    document.getElementById('notifCandName').textContent = name;
    document.getElementById('notifCandEmail').textContent = name.toLowerCase().replace(/\s+/g, '.') + '@email.com';
    document.getElementById('notifJobTitle').textContent = job.title;
    document.getElementById('notifJobTitle2').textContent = job.title;
    
    document.getElementById('notifModal')._pendingReject = { candidateId, jobId };
    document.getElementById('notifModal').classList.remove('hidden');
  } catch (error) {
    console.error('Failed to open rejection modal:', error);
    showToast('Failed to load job details', 'danger', '❌');
  }
}

async function openCandidateDetails(candidateId, jobId) {
  try {
    // Show a loading state or just fetch (it's usually fast)
    const response = await fetch(`${API_BASE}/candidates/${candidateId}?jobId=${jobId}`);
    if (!response.ok) throw new Error('Failed to fetch candidate details');
    const c = await response.json();
    
    document.getElementById('detailsCandName').textContent = c.fullName || 'Unknown Candidate';
    document.getElementById('detailsCandRole').textContent = c.currentRole || '-';
    document.getElementById('detailsCandEmail').textContent = c.email || '-';
    document.getElementById('detailsCandPhone').textContent = c.phone || '-';
    document.getElementById('detailsCandYears').textContent = c.yearsOfExperience ? `${c.yearsOfExperience} years` : '-';
    document.getElementById('detailsCandLinkedIn').textContent = c.linkedIn || '-';
    document.getElementById('detailsCandScore').textContent = (c.scores && c.scores.total) ? `${c.scores.total}%` : 'Pending';
    
    // Skills
    const skillsContainer = document.getElementById('detailsCandSkills');
    if (c.skills && c.skills.length > 0) {
      skillsContainer.innerHTML = c.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
    } else {
      skillsContainer.innerHTML = '<span class="text-sm text-mid">No skills listed</span>';
    }
    
    // Qualifications & Summary
    document.getElementById('detailsCandQuals').textContent = c.qualifications || 'None provided';
    document.getElementById('detailsCandSummary').textContent = c.achievements || c.summary || 'None provided';
    
    // Attachments
    const btnCV = document.getElementById('btnDownloadCV');
    const btnCover = document.getElementById('btnDownloadCover');
    const noFiles = document.getElementById('noAttachmentsMsg');
    
    let hasFiles = false;
    
    if (c.cvUrl) {
      btnCV.href = c.cvUrl;
      btnCV.classList.remove('hidden');
      hasFiles = true;
    } else {
      btnCV.classList.add('hidden');
    }
    
    if (c.coverLetterUrl) {
      btnCover.href = c.coverLetterUrl;
      btnCover.classList.remove('hidden');
      hasFiles = true;
    } else {
      btnCover.classList.add('hidden');
    }
    
    if (hasFiles) {
      noFiles.classList.add('hidden');
    } else {
      noFiles.classList.remove('hidden');
    }
    
    // Open the modal
    document.getElementById('candidateDetailsModal').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error opening candidate details:', error);
    showToast('Failed to load candidate details', 'danger', '❌');
  }
}

async function confirmSendNotif() {
  const modal = document.getElementById('notifModal');
  const { candidateId, jobId } = modal._pendingReject || {};
  
  if (!candidateId || !jobId) return;
  
  try {
    showToast('Sending rejection…', 'gold', '📧');
    const res = await fetch('/api/emails/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateIds: [candidateId], jobId, action: 'reject' })
    });
    if (!res.ok) throw new Error('API failed');

    showToast('Rejection notification sent', 'danger', '✉️');
    closeModal('notifModal');
    
    // Refresh rankings
    await renderRankings(jobId);
    
    // Update dashboard stats
    loadDashboardJobs();
  } catch (error) {
    console.error('Failed to reject candidate:', error);
    showToast('Failed to send rejection', 'danger', '❌');
  }
}

async function filterRankingJob() {
  const jobId = document.getElementById('rankingJobFilter').value;
  window.currentJobId = jobId;
  await renderRankings(jobId);
}

// Manual refresh rankings (called by refresh button)
async function manualRefreshRankings() {
  const jobId = window.currentJobId || document.getElementById('rankingJobFilter')?.value;
  if (jobId) {
    showToast('Refreshing rankings...', 'gold', '🔄');
    await renderRankings(jobId, true);
    showToast('Rankings updated', 'success', '✅');
  }
}

// Helper function to populate job filter dropdown with real jobs
async function populateJobFilterDropdown() {
  try {
    const jobs = await getAllJobs();
    const select = document.getElementById('rankingJobFilter');
    if (!select || jobs.length === 0) return;
    
    select.innerHTML = jobs.map(job => 
      `<option value="${job.id}">${job.title}</option>`
    ).join('');
    
    // Auto-select current job if available
    if (window.currentJobId) {
      select.value = window.currentJobId;
    }
  } catch (error) {
    console.error('Failed to populate job filter:', error);
  }
}

// ============================================
// CANDIDATE APPLICATION FLOW
// ============================================
function showTipsModal() {
  document.getElementById('tipsModal').classList.remove('hidden');
}

function closeTipsModal() {
  document.getElementById('tipsModal').classList.add('hidden');
}

function simulateUpload(type = 'cv') {
  // Trigger actual file input
  if (type === 'cv') {
    const input = document.getElementById('cvFileInput');
    if (!input) {
      // Create hidden file input if doesn't exist
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'cvFileInput';
      fileInput.accept = '.pdf,.docx';
      fileInput.style.display = 'none';
      fileInput.onchange = (e) => handleFileSelected(e, 'cv');
      document.body.appendChild(fileInput);
      fileInput.click();
    } else {
      input.click();
    }
  } else if (type === 'cover') {
    const input = document.getElementById('coverLetterFileInput');
    if (!input) {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'coverLetterFileInput';
      fileInput.accept = '.pdf,.docx';
      fileInput.style.display = 'none';
      fileInput.onchange = (e) => handleFileSelected(e, 'cover');
      document.body.appendChild(fileInput);
      fileInput.click();
    } else {
      input.click();
    }
  }
}

function handleFileSelected(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file
  const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!validTypes.includes(file.type)) {
    showToast('Invalid file type. Only PDF and DOCX allowed', 'danger', '⚠️');
    return;
  }
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    showToast('File too large. Maximum size is 5MB', 'danger', '⚠️');
    return;
  }
  
  // Show uploaded state
  if (type === 'cv') {
    cvUploaded = true;
    document.getElementById('uploadedFileName').textContent = file.name;
    document.getElementById('fileUpload').classList.add('hidden');
    document.getElementById('fileUploaded').classList.remove('hidden');
    document.getElementById('fileUploaded').style.display = 'flex';
    showToast('CV selected successfully', 'success', '📄');
  } else if (type === 'cover') {
    coverLetterUploaded = true;
    document.getElementById('uploadedCoverName').textContent = file.name;
    document.getElementById('coverLetterUpload').classList.add('hidden');
    document.getElementById('coverLetterUploaded').classList.remove('hidden');
    document.getElementById('coverLetterUploaded').style.display = 'flex';
    showToast('Cover letter selected successfully', 'success', '✉️');
  }
}

function removeFile(type = 'cv') {
  if (type === 'cv') {
    cvUploaded = false;
    const input = document.getElementById('cvFileInput');
    if (input) input.value = '';
    document.getElementById('fileUpload').classList.remove('hidden');
    document.getElementById('fileUploaded').classList.add('hidden');
  } else if (type === 'cover') {
    coverLetterUploaded = false;
    const input = document.getElementById('coverLetterFileInput');
    if (input) input.value = '';
    document.getElementById('coverLetterUpload').classList.remove('hidden');
    document.getElementById('coverLetterUploaded').classList.add('hidden');
  }
}

function submitApplication() {
  const name = document.getElementById('candName').value.trim();
  const email = document.getElementById('candEmail').value.trim();
  const years = document.getElementById('candYears').value;
  const summary = document.getElementById('candSummary').value.trim();

  if (!name || !email || !years || candidateSkills.length === 0 || !summary) {
    showToast('Please complete all required fields', 'danger', '⚠️');
    return;
  }

  showProcessing('Submitting Your Application…', 'Uploading files and analyzing your profile');

  // Get job ID from URL or use default for demo
  const jobId = getJobIdFromURL() || window.currentCreatedJobId || 'JOB-2024-DEMO';

  const candidateData = {
    jobId: jobId,
    fullName: name,
    email: email,
    phone: document.getElementById('candPhone')?.value.trim() || null,
    linkedIn: document.getElementById('candLinkedIn')?.value.trim() || null,
    yearsOfExperience: parseInt(years),
    currentRole: document.getElementById('candCurrentRole')?.value.trim() || null,
    skills: candidateSkills,
    qualifications: document.getElementById('candQuals')?.value.trim() || null,
    achievements: summary
  };

  submitCandidateApplication(candidateData)
    .then(async (candidate) => {
      // Upload files if present
      const cvInput = document.getElementById('cvFileInput');
      const coverInput = document.getElementById('coverLetterFileInput');
      
      if (cvInput && cvInput.files && cvInput.files[0]) {
        try {
          // Fire and forget upload (don't block UI)
          uploadCV(jobId, candidate.id, cvInput.files[0]);
        } catch (error) {
          console.error('CV upload failed:', error);
        }
      }
      
      if (coverInput && coverInput.files && coverInput.files[0]) {
        try {
          // Fire and forget upload (don't block UI)
          uploadCoverLetter(jobId, candidate.id, coverInput.files[0]);
        } catch (error) {
          console.error('Cover letter upload failed:', error);
        }
      }
      
      // INSTANT SUCCESS FEEDBACK - No more waiting for AI scoring
      hideProcessing();
      document.getElementById('applicationFormSection').classList.add('hidden');
      document.getElementById('applicationSuccessSection').classList.remove('hidden');
      showToast('Application submitted successfully!', 'success', '🎉');
      
      // Tell recruiter dashboard to refresh in background
      loadDashboardJobs();
    })
    .catch(error => {
      hideProcessing();
      showToast(error.message || 'Failed to submit application', 'danger', '❌');
    });
}

// ============================================
// PREVIEW MATCH SCORE (Before Submission)
// ============================================
async function previewMatchScore() {
  // Validate required fields
  const name = document.getElementById('candName').value.trim();
  const email = document.getElementById('candEmail').value.trim();
  const years = document.getElementById('candYears').value;
  const summary = document.getElementById('candSummary').value.trim();

  if (!name || !email || !years || candidateSkills.length === 0 || !summary) {
    showToast('Please complete all required fields first', 'danger', '⚠️');
    return;
  }

  // Show modal with loading state
  document.getElementById('previewScoreModal').classList.remove('hidden');
  document.getElementById('previewScoreNumber').textContent = '--';
  document.getElementById('previewScoreVerdict').textContent = 'Calculating...';
  document.getElementById('previewScoreSummary').textContent = 'Please wait while we analyze your application...';
  document.getElementById('previewScoreBreakdown').innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-mid);">Analyzing...</div>';

  try {
    // Get job details
    const jobId = getJobIdFromURL() || window.currentCandidateJobId || window.currentCreatedJobId;
    
    if (!jobId) {
      throw new Error('No job found. Please refresh the page.');
    }
    
    const job = await getJob(jobId);
    
    // Calculate preview score (client-side estimation)
    const previewScore = calculatePreviewScore(job);
    
    // Update modal with score
    setTimeout(() => {
      displayPreviewScore(previewScore);
    }, 1500); // Slight delay for UX
    
  } catch (error) {
    console.error('Preview score failed:', error);
    document.getElementById('previewScoreNumber').textContent = '?';
    document.getElementById('previewScoreVerdict').textContent = 'Preview Unavailable';
    document.getElementById('previewScoreSummary').textContent = 'Unable to calculate preview. You can still submit your application.';
    document.getElementById('previewScoreBreakdown').innerHTML = `<div style="text-align:center;padding:20px;color:var(--danger);">${error.message}</div>`;
  }
}

function calculatePreviewScore(job) {
  // Get form data
  const years = parseInt(document.getElementById('candYears').value);
  const summary = document.getElementById('candSummary').value.trim();
  
  // 1. Skills Match (40%) - Count exact matches
  const jobSkills = job.skills || [];
  const matchedSkills = (candidateSkills || []).filter(cs =>
    jobSkills.some(js => js.toLowerCase() === cs.toLowerCase())
  );
  const skillsScore = jobSkills.length > 0
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : 100;
  
  // 2. Experience Match (30%)
  const experienceLevels = {
    'Entry': 1,
    'Mid': 3,
    'Senior': 5,
    'Lead': 8,
    'Executive': 12
  };
  
  // Extract level from job's experienceLevel (e.g., "Senior Level (5+ years)" -> "Senior")
  const levelMatch = job.experienceLevel.match(/^(Entry|Mid|Senior|Lead|Executive)/);
  const requiredLevel = levelMatch ? levelMatch[1] : 'Mid';
  const requiredYears = experienceLevels[requiredLevel] || 3;
  
  let experienceScore = 40;
  if (years >= requiredYears + 2) {
    experienceScore = 100;
  } else if (years >= requiredYears) {
    experienceScore = 85;
  } else if (years >= requiredYears - 1) {
    experienceScore = 60;
  }
  
  // 3. Qualifications (20%) - Basic check
  const qualificationsScore = 70; // Assume average since we can't check thoroughly
  
  // 4. Quality (10%) - Check for metrics/numbers in summary
  const hasMetrics = /\d+/.test(summary);
  const qualityScore = hasMetrics ? 85 : 55;
  
  // Weighted total
  const total = Math.round(
    (skillsScore * 0.4) +
    (experienceScore * 0.3) +
    (qualificationsScore * 0.2) +
    (qualityScore * 0.1)
  );
  
  return {
    total,
    skills: skillsScore,
    experience: experienceScore,
    qualifications: qualificationsScore,
    quality: qualityScore,
    matchedSkills,
    totalSkills: jobSkills.length
  };
}

function displayPreviewScore(score) {
  const pct = score.total;
  
  // Update score number
  document.getElementById('previewScoreNumber').textContent = `${pct}%`;
  
  // Update verdict
  let verdict = '';
  let summary = '';
  
  if (pct >= 80) {
    verdict = '🌟 Strong Match';
    summary = 'Your profile aligns very well with this role. You have a high chance of being shortlisted!';
  } else if (pct >= 60) {
    verdict = '👍 Good Match';
    summary = 'Your profile shows potential for this role. Consider highlighting more relevant achievements or skills.';
  } else {
    verdict = '💡 Room for Improvement';
    summary = 'Consider adding more relevant skills or quantifiable achievements to strengthen your application.';
  }
  
  document.getElementById('previewScoreVerdict').textContent = verdict;
  document.getElementById('previewScoreSummary').textContent = summary;
  
  // Update breakdown
  const breakdown = `
    <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;color:var(--text-mid);">Skills Match (${score.matchedSkills.length}/${score.totalSkills} matched)</span>
      <span style="font-size:14px;font-weight:700;color:var(--charcoal);">${score.skills}%</span>
    </div>
    <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;color:var(--text-mid);">Experience Level</span>
      <span style="font-size:14px;font-weight:700;color:var(--charcoal);">${score.experience}%</span>
    </div>
    <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;color:var(--text-mid);">Qualifications</span>
      <span style="font-size:14px;font-weight:700;color:var(--charcoal);">${score.qualifications}%</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;color:var(--text-mid);">Application Quality</span>
      <span style="font-size:14px;font-weight:700;color:var(--charcoal);">${score.quality}%</span>
    </div>
  `;
  
  document.getElementById('previewScoreBreakdown').innerHTML = breakdown;
}

function closePreviewScoreModal() {
  document.getElementById('previewScoreModal').classList.add('hidden');
}

function renderMatchResult(score, name) {
  const pct = score.total;
  const circumference = 376.99;
  const offset = circumference - (pct / 100) * circumference;

  // Animate circle
  setTimeout(() => {
    document.getElementById('matchScoreCircle').style.strokeDashoffset = offset;
    animateCount('matchPercentText', pct, '%');
  }, 100);

  // Color
  const color = pct >= 80 ? 'var(--success)' : pct >= 55 ? 'var(--gold)' : 'var(--danger)';
  document.getElementById('matchScoreCircle').setAttribute('stroke', color);

  // Verdict
  const verdict = pct >= 80
    ? '<span class="badge badge-success" style="font-size:13px;padding:6px 14px;">🌟 Strong Match</span>'
    : pct >= 55
      ? '<span class="badge badge-gold" style="font-size:13px;padding:6px 14px;">👍 Good Match</span>'
      : '<span class="badge badge-danger" style="font-size:13px;padding:6px 14px;">⚡ Partial Match</span>';
  document.getElementById('matchVerdict').innerHTML = verdict;

  const summaryMsg = pct >= 80
    ? `Great news, ${name.split(' ')[0]}! Your profile is a strong fit for this role. Expect to hear back soon.`
    : pct >= 55
      ? `Your profile shows good alignment, ${name.split(' ')[0]}. Review the breakdown below to see where you can strengthen your application.`
      : `There are some gaps in your profile for this role. We encourage you to visit the Resource Hub to strengthen future applications.`;
  document.getElementById('matchSummaryText').textContent = summaryMsg;

  // Breakdown - handle both new (skills, experience, qualifications, quality) and old (skillScore, expScore, etc) formats
  const breakdown = [
    { icon: '🔑', label: 'Skills Match', val: score.skills || score.skillScore || 50, color: (score.skills || score.skillScore || 50) >= 75 ? 'var(--success)' : (score.skills || score.skillScore || 50) >= 50 ? 'var(--gold)' : 'var(--danger)' },
    { icon: '📅', label: 'Experience Level', val: score.experience || score.expScore || 50, color: (score.experience || score.expScore || 50) >= 75 ? 'var(--success)' : (score.experience || score.expScore || 50) >= 50 ? 'var(--gold)' : 'var(--danger)' },
    { icon: '🎓', label: 'Qualifications', val: score.qualifications || score.qualScore || 50, color: (score.qualifications || score.qualScore || 50) >= 75 ? 'var(--success)' : (score.qualifications || score.qualScore || 50) >= 50 ? 'var(--gold)' : 'var(--danger)' },
    { icon: '📝', label: 'Application Quality', val: score.quality || score.summaryScore || 50, color: (score.quality || score.summaryScore || 50) >= 75 ? 'var(--success)' : (score.quality || score.summaryScore || 50) >= 50 ? 'var(--gold)' : 'var(--danger)' },
  ];

  document.getElementById('matchBreakdown').innerHTML = breakdown.map(b => `
    <div class="breakdown-item">
      <div class="breakdown-icon">${b.icon}</div>
      <div class="breakdown-label">${b.label}</div>
      <div class="breakdown-bar-bg">
        <div class="breakdown-bar-fill" style="width:0%;background:${b.color};" data-target="${b.val}"></div>
      </div>
      <span class="text-sm font-semibold" style="min-width:36px;text-align:right;color:${b.color};">${b.val}%</span>
    </div>
  `).join('');

  // Animate breakdown bars
  setTimeout(() => {
    document.querySelectorAll('.breakdown-bar-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  }, 200);
}

function animateCount(id, target, suffix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const duration = 1500;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    el.textContent = Math.round(progress * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ============================================
// RESOURCE HUB
// ============================================
function renderResourceHub() {
  // CV Examples
  const cvContainer = document.getElementById('cvExamplesContainer');
  if (cvContainer) {
    cvContainer.innerHTML = CV_EXAMPLES.map(ex => `
      <div style="margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--border);">
        <div class="badge badge-gold" style="margin-bottom:12px;">${ex.category}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:8px;">
          <div style="background:var(--danger-dim);border-radius:var(--radius);padding:14px;border-left:3px solid var(--danger);">
            <div class="text-xs font-semibold text-danger" style="margin-bottom:6px;letter-spacing:0.5px;">❌ WEAK</div>
            <div class="text-sm text-dark" style="font-style:italic;">"${ex.weak}"</div>
          </div>
          <div style="background:var(--success-dim);border-radius:var(--radius);padding:14px;border-left:3px solid var(--success);">
            <div class="text-xs font-semibold text-success" style="margin-bottom:6px;letter-spacing:0.5px;">✅ STRONG</div>
            <div class="text-sm text-dark" style="font-style:italic;">"${ex.strong}"</div>
          </div>
        </div>
      </div>
    `).join('');
    // Remove last border
    const lastChild = cvContainer.lastElementChild;
    if (lastChild) lastChild.style.borderBottom = 'none';
  }

  // External resources
  const extContainer = document.getElementById('externalResourcesGrid');
  if (extContainer) {
    extContainer.innerHTML = EXTERNAL_RESOURCES.map(r => `
      <div class="resource-card" onclick="window.open('${r.link}', '_blank')">
        <div class="resource-icon">${r.icon}</div>
        <div class="resource-title">${r.title}</div>
        <div class="resource-desc">${r.desc}</div>
        <span class="resource-link">Visit Resource →</span>
      </div>
    `).join('');
  }
}

// ============================================
// MODALS & OVERLAYS
// ============================================
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showProcessing(title, sub) {
  document.getElementById('processingTitle').textContent = title;
  document.getElementById('processingSub').textContent = sub;
  document.getElementById('processingOverlay').classList.remove('hidden');
}

function hideProcessing() {
  document.getElementById('processingOverlay').classList.add('hidden');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
  if (e.target.classList.contains('tips-overlay')) closeTipsModal();
});

// ============================================
// LINK COPY & PRETTY PRINTER (Task 20)
// ============================================
function copyLink() {
  const link = document.getElementById('publishedLink').textContent;
  navigator.clipboard.writeText(link).then(() => {
    showToast('Link copied to clipboard', 'success', '📋');
  }).catch(() => {
    showToast('Link: ' + link, 'gold', '📋');
  });
}

// Pretty Printer for Job Postings
function formatJobPosting(job) {
  const skills = job.skills.map(s => `• ${s}`).join('\n');
  
  const formatted = `
═══════════════════════════════════════════
${job.title.toUpperCase()}
═══════════════════════════════════════════

📍 Location: ${job.location}
💼 Department: ${job.department}
📊 Experience Level: ${job.experienceLevel}

ABOUT THE ROLE
${wrapText(job.description, 80)}

REQUIRED SKILLS
${skills}

KEY QUALIFICATIONS
${wrapText(job.qualifications || 'Please see job description', 80)}

───────────────────────────────────────────
How to Apply:
Visit the application link provided by the recruiter
───────────────────────────────────────────
`.trim();
  
  return formatted;
}

// Helper to wrap long text at specified width
function wrapText(text, width) {
  if (!text) return '';
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + word).length > width) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  
  if (currentLine) lines.push(currentLine.trim());
  return lines.join('\n');
}

// Copy formatted job description
async function copyJobDescription() {
  try {
    const jobId = window.currentCreatedJobId || window.currentJobId;
    if (!jobId) {
      showToast('No job selected', 'danger', '❌');
      return;
    }
    
    const job = await getJob(jobId);
    const formatted = formatJobPosting(job);
    
    await navigator.clipboard.writeText(formatted);
    showToast('Job description copied!', 'success', '📋');
  } catch (error) {
    console.error('Failed to copy job description:', error);
    showToast('Failed to copy job description', 'danger', '❌');
  }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'gold', icon = '✓') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span>${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}


// ============================================
// LOCATION AUTOCOMPLETE FOR NORTHERN STATES
// ============================================
function filterLocationSuggestions() {
  const input = document.getElementById('jobLocation');
  const dropdown = document.getElementById('locationDropdown');
  const query = input.value.toLowerCase().trim();

  if (!query) {
    dropdown.classList.add('hidden');
    return;
  }

  const matches = NORTHERN_STATES.filter(state => state.toLowerCase().includes(query));

  if (matches.length === 0) {
    dropdown.innerHTML = '<div style="padding:12px;color:var(--text-mid);font-size:13px;">No matching states found</div>';
    dropdown.classList.remove('hidden');
    return;
  }

  dropdown.innerHTML = matches.map(state => `
    <div class="location-item" onclick="selectLocation('${state}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:8px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      ${state}
    </div>
  `).join('');

  dropdown.classList.remove('hidden');
}

function showLocationDropdown() {
  const input = document.getElementById('jobLocation');
  const dropdown = document.getElementById('locationDropdown');
  
  if (input.value.trim()) {
    filterLocationSuggestions();
  } else {
    // Show all states
    dropdown.innerHTML = NORTHERN_STATES.map(state => `
      <div class="location-item" onclick="selectLocation('${state}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:8px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${state}
      </div>
    `).join('');
    dropdown.classList.remove('hidden');
  }
}

function selectLocation(state) {
  document.getElementById('jobLocation').value = state;
  document.getElementById('locationDropdown').classList.add('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('locationWrapper');
  const dropdown = document.getElementById('locationDropdown');
  if (wrapper && dropdown && !wrapper.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

// ============================================
// CANDIDATE SKILLS MANAGEMENT
// ============================================
function addCandidateSkill() {
  const input = document.getElementById('candSkillInput');
  const val = input.value.trim();
  if (!val) return;
  if (candidateSkills.includes(val)) {
    showToast('Skill already added', 'danger', '⚠️');
    return;
  }
  candidateSkills.push(val);
  input.value = '';
  renderCandidateSkillTags();
}

function removeCandidateSkill(skill) {
  candidateSkills = candidateSkills.filter(s => s !== skill);
  renderCandidateSkillTags();
}

function renderCandidateSkillTags() {
  const container = document.getElementById('candSkillTags');
  if (!container) return;
  container.innerHTML = candidateSkills.map(skill => `
    <span class="skill-tag">
      ${skill}
      <button class="skill-tag-remove" onclick="removeCandidateSkill('${skill.replace(/'/g, "\\'")}')">×</button>
    </span>
  `).join('');
}

// ============================================
// INFO POPUPS
// ============================================
function openSkillsInfoPopup() {
  document.getElementById('skillsInfoPopup').classList.remove('hidden');
}

function openAchievementsInfoPopup() {
  document.getElementById('achievementsInfoPopup').classList.remove('hidden');
}

function openCVInfoPopup() {
  document.getElementById('cvInfoPopup').classList.remove('hidden');
}

function closePopup(popupId) {
  document.getElementById(popupId).classList.add('hidden');
}

// Close popups when clicking on overlay
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('info-popup-overlay')) {
    e.target.classList.add('hidden');
  }
});

// ============================================
// CUSTOM QUESTIONS FOR JOB POSTING
// ============================================
function addCustomQuestion(type) {
  const questionId = `q-${Date.now()}`;
  const question = {
    id: questionId,
    type: type, // 'open' or 'poll'
    text: '',
    options: type === 'poll' ? ['', ''] : null
  };
  customQuestions.push(question);
  renderCustomQuestions();
}

function removeCustomQuestion(questionId) {
  customQuestions = customQuestions.filter(q => q.id !== questionId);
  renderCustomQuestions();
}

function renderCustomQuestions() {
  const container = document.getElementById('customQuestionsContainer');
  if (!container) return;

  if (customQuestions.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = customQuestions.map(q => {
    if (q.type === 'open') {
      return `
        <div class="custom-question-box" style="margin-bottom:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span class="badge badge-gold" style="font-size:10px;">OPEN QUESTION</span>
            <button class="btn-icon-remove" onclick="removeCustomQuestion('${q.id}')" title="Remove">×</button>
          </div>
          <input class="form-input" type="text" placeholder="E.g., Why are you interested in this role?" style="font-size:13px;" />
        </div>
      `;
    } else {
      return `
        <div class="custom-question-box" style="margin-bottom:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span class="badge badge-gold" style="font-size:10px;">POLL (Multiple Choice)</span>
            <button class="btn-icon-remove" onclick="removeCustomQuestion('${q.id}')" title="Remove">×</button>
          </div>
          <input class="form-input" type="text" placeholder="Poll question, e.g., Are you open to relocation?" style="font-size:13px;margin-bottom:8px;" />
          <div style="display:flex;gap:8px;flex-direction:column;">
            <input class="form-input" type="text" placeholder="Option 1" style="font-size:12px;" />
            <input class="form-input" type="text" placeholder="Option 2" style="font-size:12px;" />
            <button class="btn btn-outline btn-sm" style="font-size:11px;">+ Add Option</button>
          </div>
        </div>
      `;
    }
  }).join('');
}

// ============================================
// PREVIEW CANDIDATE PAGE FROM RECRUITER
// ============================================
function previewCandidatePage() {
  const jobId = window.currentCreatedJobId || window.currentJobId;
  if (!jobId) {
    showToast('No job selected', 'danger', '❌');
    return;
  }
  
  // Generate the application URL with jobId
  const baseUrl = window.location.origin + window.location.pathname;
  const applicationUrl = `${baseUrl}?jobId=${jobId}`;
  
  // Open in new tab
  window.open(applicationUrl, '_blank');
  showToast('Opening candidate application page', 'gold', '👁️');
}

// ============================================
// HAUSA DEMO TRANSLATION LOGIC
// ============================================
function toggleHausaLanguage(isHausa) {
  if (isHausa) {
    // Translate Job Description (Demo)
    const jobDescSidebar = document.getElementById('jobDescriptionSidebar');
    if (jobDescSidebar && window._demoOriginalJob) {
      const demoJob = { ...window._demoOriginalJob };
      demoJob.title = "Wakili na Tallafin Abokan Ciniki"; // Customer Support Rep
      demoJob.description = "Muna neman Wakili na Tallafin Abokan Ciniki wanda zai taimaka wa abokan cinikinmu. Zaku rika amsa tambayoyi, warware matsaloli, kuma tabbatar da kowa yana farin ciki da sabis dinmu.";
      demoJob.responsibilities = [
        "Amsa kiran waya da sakonnin abokan ciniki da wuri",
        "Taimakawa wajen warware matsalolin asusu",
        "Bayar da rahoto akan matsalolin da aka saba fuskanta"
      ];
      demoJob.skills = ["Sadarwa", "Harkokin Kasuwanci", "Kwamfuta"];
      demoJob.qualifications = ["An fi son masu digiri ko difloma", "Kwarewa wajen magana da Hausa da Turanci"];
      demoJob.perks = ["Albashi mai tsoka", "Damar yin aiki daga gida"];
      demoJob.niceToHave = ["Kwarewa a harkar tallace-tallace"];
      jobDescSidebar.innerHTML = formatJobDescriptionHTML(demoJob);
    }

    // Translate Form Labels
    document.getElementById('lblPersonalInfo').innerHTML = 'Bayanin Mutum';
    document.getElementById('lblFullName').innerHTML = 'Cikakken Suna <span class="required">*</span>';
    document.getElementById('lblEmail').innerHTML = 'Adreshin Imel <span class="required">*</span>';
    document.getElementById('lblPhone').innerHTML = 'Lambar Waya <span style="font-size:11px;font-weight:400;color:var(--text-mid);">(Zabi)</span>';
    document.getElementById('lblLinkedIn').innerHTML = 'Shafin LinkedIn';
    
    document.getElementById('lblExperience').innerHTML = 'Kwarewar Aiki';
    document.getElementById('lblYearsExp').innerHTML = 'Shekarun Goguwa <span class="required">*</span>';
    document.getElementById('lblCurrentRole').innerHTML = 'Aikin da Kake Yi Yanzu';
    document.getElementById('lblKeySkills').innerHTML = 'Kwarewa (Skills) <span class="required">*</span>';
    document.getElementById('lblAchievements').innerHTML = 'Cikakken Bayanin Aiki / Nasarori <span class="required">*</span>';
    document.getElementById('lblAchievementTip').innerHTML = '💡 Shawara: Rubuta abubuwan da ka cimma a baya.';
    document.getElementById('lblRelevantQuals').innerHTML = 'Takardun Shaida';

    document.getElementById('lblCVCover').innerHTML = 'Takardar CV da Wasiƙar Neman Aiki';
    document.getElementById('lblUploadCV').innerHTML = 'Sanya Takardar CV';
    document.getElementById('lblClickUploadCV').innerHTML = '<strong>Danna don sanya</strong> CV dinka';
    document.getElementById('lblUploadCover').innerHTML = 'Sanya Wasiƙar Neman Aiki (Zabi)';
    document.getElementById('lblClickUploadCover').innerHTML = '<strong>Danna don sanya</strong> Wasiƙar Neman Aiki';

    document.getElementById('btnPreviewScore').innerHTML = '🔍 Duba Makin AI';
    document.getElementById('btnSubmitApp').innerHTML = 'Aika Takardar Neman Aiki';

    // Translate Tips
    document.getElementById('lblTipsTitle').innerHTML = '✨ Hanyoyin Yin Fice';
    document.getElementById('lblTip1').innerHTML = '<strong>Yi amfani da alkaluma</strong><br/>Bayyana nasarorinka tare da lamba.';
    document.getElementById('lblTip2').innerHTML = '<strong>Daidaita bayaninka</strong><br/>Rubuta kalmomin da suka dace da aikin da kake nema.';
    document.getElementById('lblTip3').innerHTML = '<strong>Rubuta kwarewarka duka</strong><br/>Kada ka bar wata kwarewa a baya ko da tana da sauki.';
    document.getElementById('lblTip4').innerHTML = '<strong>Bayyana takardunka dalla-dalla</strong><br/>Wannan zai taimaka wajen samun maki mai yawa.';

    // Checkbox styling update (Green for Hausa)
    document.getElementById('hausaCandToggleBg').style.backgroundColor = '#00a650'; // Green for Nigeria
    document.getElementById('hausaCandToggleDot').style.transform = 'translateX(16px)';
    
  } else {
    // Revert Job Description
    const jobDescSidebar = document.getElementById('jobDescriptionSidebar');
    if (jobDescSidebar && window._demoOriginalJob) {
      jobDescSidebar.innerHTML = formatJobDescriptionHTML(window._demoOriginalJob);
    }

    // Revert Form Labels
    document.getElementById('lblPersonalInfo').innerHTML = 'Personal Information';
    document.getElementById('lblFullName').innerHTML = 'Full Name <span class="required">*</span>';
    document.getElementById('lblEmail').innerHTML = 'Email Address <span class="required">*</span>';
    document.getElementById('lblPhone').innerHTML = 'Phone Number <span style="font-size:11px;font-weight:400;color:var(--text-mid);">(Optional)</span>';
    document.getElementById('lblLinkedIn').innerHTML = 'LinkedIn Profile';
    
    document.getElementById('lblExperience').innerHTML = 'Let\'s Hear What Makes You Stand Out';
    document.getElementById('lblYearsExp').innerHTML = 'Years of Experience <span class="required">*</span>';
    document.getElementById('lblCurrentRole').innerHTML = 'Current / Most Recent Role';
    document.getElementById('lblKeySkills').innerHTML = 'Key Skills <span class="required">*</span>';
    document.getElementById('lblAchievements').innerHTML = 'Measurable Achievements <span class="required">*</span>';
    document.getElementById('lblAchievementTip').innerHTML = '💡 Tip: Recruiters and AI systems respond better to specific, measurable claims.';
    document.getElementById('lblRelevantQuals').innerHTML = 'Relevant Qualifications';

    document.getElementById('lblCVCover').innerHTML = 'CV & Cover Letter';
    document.getElementById('lblUploadCV').innerHTML = 'Upload CV / Resume';
    document.getElementById('lblClickUploadCV').innerHTML = '<strong>Click to upload</strong> or drag and drop your CV';
    document.getElementById('lblUploadCover').innerHTML = 'Upload Cover Letter <span style="font-size:11px;font-weight:400;color:var(--text-mid);">(Optional)</span>';
    document.getElementById('lblClickUploadCover').innerHTML = '<strong>Click to upload</strong> your cover letter';

    document.getElementById('btnPreviewScore').innerHTML = '🔍 Preview AI Match Score';
    document.getElementById('btnSubmitApp').innerHTML = 'Submit Application';

    // Revert Tips
    document.getElementById('lblTipsTitle').innerHTML = '✨ Stand Out Tips';
    document.getElementById('lblTip1').innerHTML = '<strong>Use numbers & metrics</strong><br />Quantify your achievements. "Reduced load time by 40%" beats "improved performance".';
    document.getElementById('lblTip2').innerHTML = '<strong>Tailor your summary</strong><br />Mirror keywords from the job description naturally in your achievements section.';
    document.getElementById('lblTip3').innerHTML = '<strong>List all relevant skills</strong><br />Include tools, languages, and platforms even if you think they\'re obvious.';
    document.getElementById('lblTip4').innerHTML = '<strong>Clear qualifications</strong><br />State degrees, certifications, and relevant training explicitly as they affect your match score.';

    // Revert styling
    document.getElementById('hausaCandToggleBg').style.backgroundColor = '#ccc';
    document.getElementById('hausaCandToggleDot').style.transform = 'translateX(0)';
  }
}
