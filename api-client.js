/* ============================================
   APTUS — API Client
   ============================================ */

const API_BASE = window.location.origin + '/api';

// ============================================
// JOB API
// ============================================

/**
 * Create a new job posting
 */
async function createJob(jobData) {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create job');
  }
  
  return await response.json();
}

/**
 * Get job by ID
 */
async function getJob(jobId) {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get job');
  }
  
  return await response.json();
}

/**
 * Get all jobs
 */
async function getAllJobs() {
  const response = await fetch(`${API_BASE}/jobs`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get jobs');
  }
  
  return await response.json();
}

// ============================================
// CANDIDATE API
// ============================================

/**
 * Submit candidate application
 */
async function submitCandidateApplication(candidateData) {
  const response = await fetch(`${API_BASE}/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidateData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit application');
  }
  
  return await response.json();
}

/**
 * Get candidates for a job
 */
async function getCandidatesForJob(jobId, filters = {}) {
  let url = `${API_BASE}/jobs/${jobId}/candidates`;
  
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get candidates');
  }
  
  return await response.json();
}

// Aliases for backend-style function names
const getCandidatesByJob = getCandidatesForJob;
const getJobPosting = getJob;

/**
 * Update candidate status
 */
async function updateCandidateStatus(candidateId, jobId, status, note = '') {
  const response = await fetch(`${API_BASE}/candidates/${candidateId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, status, note })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update status');
  }
  
  return await response.json();
}

/**
 * Get job statistics
 */
async function getJobStatistics(jobId) {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/statistics`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get statistics');
  }
  
  return await response.json();
}

/**
 * Get platform analytics for a job
 */
async function getPlatformAnalytics(jobId) {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/analytics`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get analytics');
  }
  
  return await response.json();
}

// ============================================
// FILE UPLOAD API
// ============================================

/**
 * Upload CV file
 */
async function uploadCV(jobId, candidateId, file) {
  const formData = new FormData();
  formData.append('cv', file);
  formData.append('jobId', jobId);
  formData.append('candidateId', candidateId);
  
  const response = await fetch(`${API_BASE}/upload/cv`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload CV');
  }
  
  return await response.json();
}

/**
 * Upload cover letter file
 */
async function uploadCoverLetter(jobId, candidateId, file) {
  const formData = new FormData();
  formData.append('coverLetter', file);
  formData.append('jobId', jobId);
  formData.append('candidateId', candidateId);
  
  const response = await fetch(`${API_BASE}/upload/cover-letter`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload cover letter');
  }
  
  return await response.json();
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get current job ID from URL
 * Checks ?jobId= query param first (used by generateJobLinks),
 * then falls back to /jobs/JOB-XXXX-XXXX/ path format.
 */
function getJobIdFromURL() {
  // Primary: check ?jobId= query parameter (how Aptus generates application links)
  const urlParams = new URLSearchParams(window.location.search);
  const queryJobId = urlParams.get('jobId');
  if (queryJobId) return queryJobId;

  // Fallback: check path segment format /jobs/JOB-XXXX-XXXX/
  const path = window.location.pathname;
  const match = path.match(/\/jobs\/(JOB-\d{4}-\d{4})/);
  return match ? match[1] : null;
}

/**
 * Check if current URL is admin page
 */
function isAdminPage() {
  return window.location.pathname.includes('/admin');
}

/**
 * Check if current URL is apply page
 */
function isApplyPage() {
  return window.location.pathname.includes('/apply');
}
