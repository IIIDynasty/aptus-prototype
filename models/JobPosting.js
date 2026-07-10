/* ============================================
   APTUS — Job Posting Data Model
   ============================================ */

/**
 * JobPosting Data Model
 * Represents a job posting in the Aptus platform
 */
class JobPosting {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.department = data.department || '';
    this.location = data.location || '';
    this.experienceLevel = data.experienceLevel || '';
    this.description = data.description || '';
    this.responsibilities = data.responsibilities || [];
    this.skills = data.skills || [];
    this.qualifications = data.qualifications || [];
    this.perks = data.perks || [];
    this.niceToHave = data.niceToHave || [];
    this.selectedChannels = data.selectedChannels || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.applicantCount = data.applicantCount || 0;
    this.shortlistedCount = data.shortlistedCount || 0;
    this.status = data.status || 'active';
    // Hausa AI Translation
    this.hausaEnabled = data.hausaEnabled || false;
    this.hausaTranslation = data.hausaTranslation || null;
  }

  /**
   * Convert to plain object for Cosmos DB storage
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      department: this.department,
      location: this.location,
      experienceLevel: this.experienceLevel,
      description: this.description,
      responsibilities: this.responsibilities,
      skills: this.skills,
      qualifications: this.qualifications,
      perks: this.perks,
      niceToHave: this.niceToHave,
      selectedChannels: this.selectedChannels,
      createdAt: this.createdAt,
      applicantCount: this.applicantCount,
      shortlistedCount: this.shortlistedCount,
      status: this.status,
      hausaEnabled: this.hausaEnabled,
      hausaTranslation: this.hausaTranslation
    };
  }

  /**
   * Create JobPosting from Cosmos DB document
   */
  static fromDocument(doc) {
    return new JobPosting(doc);
  }
}

/**
 * CandidateApplication Data Model
 */
class CandidateApplication {
  constructor(data) {
    this.id = data.id || null;
    this.jobId = data.jobId || '';
    
    // Personal Information
    this.fullName = data.fullName || '';
    this.email = data.email || '';
    this.phone = data.phone || null;
    this.linkedIn = data.linkedIn || null;
    
    // Experience
    this.yearsOfExperience = data.yearsOfExperience || 0;
    this.currentRole = data.currentRole || null;
    this.skills = data.skills || [];
    this.achievements = data.achievements || '';
    this.qualifications = data.qualifications || null;
    
    // Files
    this.cvUrl = data.cvUrl || null;
    this.cvExtension = data.cvExtension || null;
    this.coverLetterUrl = data.coverLetterUrl || null;
    this.coverLetterExtension = data.coverLetterExtension || null;
    
    // AI Scoring
    this.scores = data.scores || {
      skills: null,
      experience: null,
      qualifications: null,
      quality: null,
      total: null
    };
    
    // Status & Metadata
    this.status = data.status || 'pending';
    this.statusHistory = data.statusHistory || [];
    this.source = data.source || 'direct';
    this.appliedAt = data.appliedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      jobId: this.jobId,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      linkedIn: this.linkedIn,
      yearsOfExperience: this.yearsOfExperience,
      currentRole: this.currentRole,
      skills: this.skills,
      achievements: this.achievements,
      cvUrl: this.cvUrl,
      cvExtension: this.cvExtension,
      coverLetterUrl: this.coverLetterUrl,
      coverLetterExtension: this.coverLetterExtension,
      scores: this.scores,
      status: this.status,
      statusHistory: this.statusHistory,
      source: this.source,
      appliedAt: this.appliedAt,
      qualifications: this.qualifications
    };
  }

  static fromDocument(doc) {
    return new CandidateApplication(doc);
  }
}

module.exports = {
  JobPosting,
  CandidateApplication
};
