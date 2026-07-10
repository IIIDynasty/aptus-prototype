/* ============================================
   APTUS — Validation Functions
   ============================================ */

/**
 * Northern Nigerian States (18 states)
 */
const NORTHERN_NIGERIAN_STATES = [
  'Bauchi', 'Benue', 'Borno', 'Gombe', 'Jigawa', 'Kaduna',
  'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Nasarawa',
  'Niger', 'Plateau', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

/**
 * Experience Levels (with full descriptions as sent by form)
 */
const EXPERIENCE_LEVELS = [
  'Entry Level (0–2 years)',
  'Mid Level (2–5 years)', 
  'Senior Level (5+ years)',
  'Lead / Manager',
  'Executive'
];

/**
 * Validate job posting data
 * @param {object} jobData - Job posting data
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateJobData(jobData) {
  const errors = [];

  // Title
  if (!jobData.title || jobData.title.trim().length === 0) {
    errors.push('Job title is required');
  } else if (jobData.title.length < 5) {
    errors.push('Job title must be at least 5 characters');
  } else if (jobData.title.length > 100) {
    errors.push('Job title must be less than 100 characters');
  }

  // Department (optional, defaults to 'General')
  if (jobData.department && jobData.department.length > 100) {
    errors.push('Department must be less than 100 characters');
  }

  // Location
  if (!jobData.location || jobData.location.trim().length === 0) {
    errors.push('Location is required');
  }
  // Note: We don't validate against NORTHERN_NIGERIAN_STATES anymore to allow flexibility

  // Experience Level
  if (!jobData.experienceLevel || jobData.experienceLevel.trim().length === 0) {
    errors.push('Experience level is required');
  } else if (!EXPERIENCE_LEVELS.includes(jobData.experienceLevel)) {
    errors.push(`Experience level must be one of: ${EXPERIENCE_LEVELS.join(', ')}`);
  }

  // Description
  if (!jobData.description || jobData.description.trim().length === 0) {
    errors.push('Job description is required');
  } else if (jobData.description.length < 50) {
    errors.push('Job description must be at least 50 characters');
  } else if (jobData.description.length > 5000) {
    errors.push('Job description must be less than 5000 characters');
  }

  // Skills
  if (!jobData.skills || !Array.isArray(jobData.skills)) {
    errors.push('Skills must be an array');
  } else if (jobData.skills.length === 0) {
    errors.push('At least one skill is required');
  } else if (jobData.skills.length > 20) {
    errors.push('Maximum 20 skills allowed');
  } else {
    // Validate each skill
    jobData.skills.forEach((skill, index) => {
      if (!skill || skill.trim().length === 0) {
        errors.push(`Skill at position ${index + 1} is empty`);
      } else if (skill.length > 50) {
        errors.push(`Skill "${skill}" is too long (max 50 characters)`);
      }
    });
  }

  // Optional Array Fields (Responsibilities, Qualifications, Perks, NiceToHave)
  const arrayFields = ['responsibilities', 'qualifications', 'perks', 'niceToHave'];
  arrayFields.forEach(field => {
    if (jobData[field] && !Array.isArray(jobData[field])) {
      errors.push(`${field} must be an array of strings`);
    } else if (jobData[field]) {
      jobData[field].forEach((item, index) => {
        if (typeof item !== 'string') {
          errors.push(`${field} item at index ${index} must be a string`);
        } else if (item.length > 500) {
          errors.push(`${field} item must be less than 500 characters`);
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate candidate application data
 * @param {object} candidateData - Candidate application data
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateCandidateData(candidateData) {
  const errors = [];

  // Full Name
  if (!candidateData.fullName || candidateData.fullName.trim().length === 0) {
    errors.push('Full name is required');
  } else if (candidateData.fullName.length < 3) {
    errors.push('Full name must be at least 3 characters');
  } else if (candidateData.fullName.length > 100) {
    errors.push('Full name must be less than 100 characters');
  }

  // Email
  if (!candidateData.email || candidateData.email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!isValidEmail(candidateData.email)) {
    errors.push('Invalid email format');
  }

  // Phone (optional)
  if (candidateData.phone && !isValidPhone(candidateData.phone)) {
    errors.push('Invalid phone number format');
  }

  // LinkedIn (optional)
  if (candidateData.linkedIn && !isValidLinkedIn(candidateData.linkedIn)) {
    errors.push('Invalid LinkedIn URL format');
  }

  // Years of Experience
  if (candidateData.yearsOfExperience === null || candidateData.yearsOfExperience === undefined) {
    errors.push('Years of experience is required');
  } else if (typeof candidateData.yearsOfExperience !== 'number') {
    errors.push('Years of experience must be a number');
  } else if (candidateData.yearsOfExperience < 0) {
    errors.push('Years of experience cannot be negative');
  } else if (candidateData.yearsOfExperience > 50) {
    errors.push('Years of experience must be less than 50');
  }

  // Skills
  if (!candidateData.skills || !Array.isArray(candidateData.skills)) {
    errors.push('Skills must be an array');
  } else if (candidateData.skills.length === 0) {
    errors.push('At least one skill is required');
  } else if (candidateData.skills.length > 30) {
    errors.push('Maximum 30 skills allowed');
  }

  // Achievements
  if (!candidateData.achievements || candidateData.achievements.trim().length === 0) {
    errors.push('Measurable achievements are required');
  } else if (candidateData.achievements.length < 20) {
    errors.push('Please provide more details about your achievements (at least 20 characters)');
  } else if (candidateData.achievements.length > 2000) {
    errors.push('Achievements must be less than 2000 characters');
  }

  // Job ID
  if (!candidateData.jobId || candidateData.jobId.trim().length === 0) {
    errors.push('Job ID is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (Nigerian numbers)
 */
function isValidPhone(phone) {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if it matches Nigerian phone patterns
  // +234XXXXXXXXXX or 0XXXXXXXXXXX or XXXXXXXXXXX
  const phoneRegex = /^(\+234|0)?[789]\d{9}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validate LinkedIn URL
 */
function isValidLinkedIn(url) {
  const linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[\w\-]+\/?$/i;
  return linkedInRegex.test(url);
}

/**
 * Generate unique job ID
 * Format: JOB-{YEAR}-{4-digit-random}
 */
function generateJobId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  return `JOB-${year}-${random}`;
}

/**
 * Generate unique candidate ID
 * Format: CAN-{timestamp}-{3-digit-random}
 */
function generateCandidateId() {
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const random = Math.floor(100 + Math.random() * 900); // 3-digit random
  return `CAN-${timestamp}-${random}`;
}

/**
 * Extract source parameter from URL
 * @param {string} url - Full URL
 * @returns {string} Source value or 'direct'
 */
function extractSourceFromURL(url) {
  try {
    const urlObj = new URL(url);
    const source = urlObj.searchParams.get('source');
    return source || 'direct';
  } catch (error) {
    return 'direct';
  }
}

/**
 * Generate job links
 * @param {string} jobId - Job ID
 * @param {string} baseUrl - Base URL (e.g., 'aptus.io' or 'localhost:3000')
 * @returns {object} { applicationLink, adminLink }
 */
function generateJobLinks(jobId, baseUrl = 'localhost:3000') {
  const protocol = baseUrl.includes('localhost') ? 'http://' : 'https://';
  const base = `${protocol}${baseUrl}`;
  
  return {
    // Candidate link uses ?jobId= query param — this is what app.js DOMContentLoaded detects
    applicationLink: `${base}/?jobId=${jobId}`,
    // Admin link for recruiter
    adminLink: `${base}/?adminJobId=${jobId}`
  };
}

module.exports = {
  // Constants
  NORTHERN_NIGERIAN_STATES,
  EXPERIENCE_LEVELS,
  
  // Validation
  validateJobData,
  validateCandidateData,
  isValidEmail,
  isValidPhone,
  isValidLinkedIn,
  
  // ID Generation
  generateJobId,
  generateCandidateId,
  
  // URL Utilities
  extractSourceFromURL,
  generateJobLinks
};
