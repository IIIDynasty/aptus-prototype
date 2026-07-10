/* ============================================
   APTUS — Candidate Manager Service
   ============================================ */

const { getContainer } = require('../azure-config');
const { getBlobContainerClient } = require('../azure-config');
const { generateBlobSasUrl } = require('../azure-security');
const { CandidateApplication } = require('../models/JobPosting');
const { 
  validateCandidateData, 
  generateCandidateId,
  extractSourceFromURL 
} = require('../utils/validators');
const { incrementApplicantCount } = require('./JobManager');
const { processCVFile } = require('./CVParser');
const { calculateMatchScore } = require('./ScoringEngine');

/**
 * Submit a candidate application
 * @param {object} candidateData - Candidate application data
 * @param {string} sourceUrl - URL with source parameter (optional)
 * @returns {Promise<object>} Created candidate application
 */
async function submitApplication(candidateData, sourceUrl = null) {
  // Validate candidate data
  const validation = validateCandidateData(candidateData);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Generate candidate ID
  const candidateId = generateCandidateId();

  // Extract source from URL
  const source = sourceUrl ? extractSourceFromURL(sourceUrl) : 'direct';

  // Create candidate application object
  const candidate = new CandidateApplication({
    ...candidateData,
    id: candidateId,
    source: source,
    appliedAt: new Date().toISOString(),
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'Application submitted'
      }
    ],
    scores: {
      skills: null,
      experience: null,
      qualifications: null,
      quality: null,
      total: null
    }
  });

  // Save to Cosmos DB
  try {
    const container = getContainer('candidates');
    const { resource: createdCandidate } = await container.items.create(candidate.toJSON());

    // Increment applicant count for the job
    await incrementApplicantCount(candidateData.jobId);

    console.log(`✅ Candidate application submitted: ${candidateId} for job ${candidateData.jobId}`);

    return CandidateApplication.fromDocument(createdCandidate);

  } catch (error) {
    console.error('❌ Failed to submit application:', error.message);
    throw new Error(`Failed to submit application: ${error.message}`);
  }
}

/**
 * Get candidate by ID
 * @param {string} candidateId - Candidate ID
 * @param {string} jobId - Job ID (partition key)
 * @returns {Promise<object>} Candidate application
 */
async function getCandidate(candidateId, jobId) {
  try {
    const container = getContainer('candidates');
    const { resource: candidate } = await container.item(candidateId, jobId).read();
    
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    return CandidateApplication.fromDocument(candidate);

  } catch (error) {
    console.error(`❌ Failed to get candidate ${candidateId}:`, error.message);
    throw new Error(`Candidate not found: ${candidateId}`);
  }
}

/**
 * Get all candidates for a job
 * @param {string} jobId - Job ID
 * @param {object} filters - Optional filters (status, etc.)
 * @returns {Promise<Array>} List of candidates
 */
async function getCandidatesByJob(jobId, filters = {}) {
  try {
    const container = getContainer('candidates');
    
    // Build query
    let queryText = 'SELECT * FROM c WHERE c.jobId = @jobId';
    const parameters = [{ name: '@jobId', value: jobId }];

    // Add status filter if provided
    if (filters.status) {
      queryText += ' AND c.status = @status';
      parameters.push({ name: '@status', value: filters.status });
    }

    // Sort by match score (highest first)
    queryText += ' ORDER BY c.scores.total DESC';

    const { resources: candidates } = await container.items
      .query({
        query: queryText,
        parameters: parameters
      })
      .fetchAll();

    return candidates.map(c => CandidateApplication.fromDocument(c));

  } catch (error) {
    console.error(`❌ Failed to get candidates for job ${jobId}:`, error.message);
    throw new Error(`Failed to get candidates: ${error.message}`);
  }
}

/**
 * Update candidate application
 * @param {string} candidateId - Candidate ID
 * @param {string} jobId - Job ID (partition key)
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated candidate
 */
async function updateCandidate(candidateId, jobId, updates) {
  try {
    const container = getContainer('candidates');
    
    // Get existing candidate
    const { resource: existingCandidate } = await container.item(candidateId, jobId).read();
    if (!existingCandidate) {
      throw new Error('Candidate not found');
    }

    // Merge updates
    const updatedCandidate = {
      ...existingCandidate,
      ...updates,
      id: candidateId, // Ensure ID doesn't change
      jobId: jobId // Ensure partition key doesn't change
    };

    // Save updated candidate
    const { resource: result } = await container.item(candidateId, jobId).replace(updatedCandidate);

    console.log(`✅ Candidate updated: ${candidateId}`);
    return CandidateApplication.fromDocument(result);

  } catch (error) {
    console.error(`❌ Failed to update candidate ${candidateId}:`, error.message);
    throw new Error(`Failed to update candidate: ${error.message}`);
  }
}

/**
 * Update candidate status
 * @param {string} candidateId - Candidate ID
 * @param {string} jobId - Job ID
 * @param {string} newStatus - New status ('pending', 'shortlisted', 'rejected')
 * @param {string} note - Optional note
 */
async function updateCandidateStatus(candidateId, jobId, newStatus, note = '') {
  try {
    const candidate = await getCandidate(candidateId, jobId);
    const oldStatus = candidate.status;
    
    // Add status change to history
    const statusHistory = candidate.statusHistory || [];
    statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note
    });

    // Update candidate
    await updateCandidate(candidateId, jobId, {
      status: newStatus,
      statusHistory: statusHistory
    });

    // Update job's shortlisted count
    const JobManager = require('./JobManager');
    if (oldStatus !== 'shortlisted' && newStatus === 'shortlisted') {
      await JobManager.incrementShortlistedCount(jobId);
    } else if (oldStatus === 'shortlisted' && newStatus !== 'shortlisted') {
      await JobManager.decrementShortlistedCount(jobId);
    }

    console.log(`✅ Candidate status updated: ${candidateId} → ${newStatus}`);

  } catch (error) {
    console.error(`❌ Failed to update candidate status ${candidateId}:`, error.message);
    throw new Error(`Failed to update status: ${error.message}`);
  }
}

/**
 * Upload CV file to Blob Storage
 * @param {string} jobId - Job ID
 * @param {string} candidateId - Candidate ID
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileExtension - File extension (pdf, docx)
 * @returns {Promise<string>} Blob URL with SAS token
 */
async function uploadCV(jobId, candidateId, fileBuffer, fileExtension) {
  try {
    const containerClient = getBlobContainerClient('cvs');
    const blobName = `${jobId}/${candidateId}.${fileExtension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: fileExtension === 'pdf' ? 'application/pdf' : 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    });

    // Generate SAS URL (7-day expiry)
    const sasUrl = generateBlobSasUrl('cvs', blobName, 7);

    console.log(`✅ CV uploaded: ${blobName}`);
    return sasUrl;

  } catch (error) {
    console.error(`❌ Failed to upload CV for ${candidateId}:`, error.message);
    throw new Error(`Failed to upload CV: ${error.message}`);
  }
}

/**
 * Upload cover letter file to Blob Storage
 * @param {string} jobId - Job ID
 * @param {string} candidateId - Candidate ID
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileExtension - File extension (pdf, docx)
 * @returns {Promise<string>} Blob URL with SAS token
 */
async function uploadCoverLetter(jobId, candidateId, fileBuffer, fileExtension) {
  try {
    const containerClient = getBlobContainerClient('cover-letters');
    const blobName = `${jobId}/${candidateId}.${fileExtension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: fileExtension === 'pdf' ? 'application/pdf' : 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    });

    // Generate SAS URL (7-day expiry)
    const sasUrl = generateBlobSasUrl('cover-letters', blobName, 7);

    console.log(`✅ Cover letter uploaded: ${blobName}`);
    return sasUrl;

  } catch (error) {
    console.error(`❌ Failed to upload cover letter for ${candidateId}:`, error.message);
    throw new Error(`Failed to upload cover letter: ${error.message}`);
  }
}

/**
 * Update candidate with file URLs after upload
 * @param {string} candidateId - Candidate ID
 * @param {string} jobId - Job ID
 * @param {object} fileUrls - { cvUrl, cvExtension, coverLetterUrl, coverLetterExtension }
 */
async function updateCandidateFiles(candidateId, jobId, fileUrls) {
  try {
    await updateCandidate(candidateId, jobId, fileUrls);
    console.log(`✅ Candidate files updated: ${candidateId}`);
  } catch (error) {
    console.error(`❌ Failed to update candidate files ${candidateId}:`, error.message);
    throw error;
  }
}

/**
 * Calculate statistics for a job
 * @param {string} jobId - Job ID
 * @returns {Promise<object>} Job statistics
 */
async function getJobStatistics(jobId) {
  try {
    const candidates = await getCandidatesByJob(jobId);
    
    const totalApplicants = candidates.length;
    const shortlisted = candidates.filter(c => c.status === 'shortlisted').length;
    const rejected = candidates.filter(c => c.status === 'rejected').length;
    const pending = candidates.filter(c => c.status === 'pending').length;
    
    // Calculate average match score (only for scored candidates)
    const scoredCandidates = candidates.filter(c => c.scores && c.scores.total !== null);
    const avgMatchScore = scoredCandidates.length > 0
      ? Math.round(scoredCandidates.reduce((sum, c) => sum + c.scores.total, 0) / scoredCandidates.length)
      : 0;

    return {
      totalApplicants,
      shortlisted,
      rejected,
      pending,
      avgMatchScore
    };

  } catch (error) {
    console.error(`❌ Failed to get statistics for job ${jobId}:`, error.message);
    throw new Error(`Failed to get statistics: ${error.message}`);
  }
}

/**
 * Score candidate after application submission
 * Called automatically after candidate is created
 * 
 * @param {string} candidateId - Candidate ID
 * @param {string} jobId - Job ID
 */
async function scoreCandidate(candidateId, jobId) {
  try {
    // Get candidate and job data
    const candidate = await getCandidate(candidateId, jobId);
    const JobManager = require('./JobManager');
    const job = await JobManager.getJobPosting(jobId);
    
    // calculateMatchScore never throws — it has an intelligent local fallback
    // that uses exact-match skills + rule-based experience when OpenAI is unavailable
    const scores = await calculateMatchScore(candidate, job);
    
    // Update candidate with scores
    await updateCandidate(candidateId, jobId, { scores });
    
    console.log(`✅ Candidate scored: ${candidateId} → ${scores.total}/100`);
    
    return scores;
    
  } catch (error) {
    // This only fires if Cosmos DB itself fails (candidate/job not found)
    console.error(`❌ Failed to score candidate ${candidateId}:`, error.message);
    // Don't write 50/50 defaults — leave scores as null so front-end uses
    // its own client-side estimate instead of showing a misleading fixed score
  }
}

/**
 * Process uploaded CV and update candidate
 * Extracts skills, merges with form data, re-calculates score
 * 
 * @param {string} candidateId - Candidate ID
 * @param {string} jobId - Job ID
 * @param {string} blobName - Blob path in storage
 * @param {string} extension - File extension
 */
async function processCandidateCV(candidateId, jobId, blobName, extension) {
  try {
    const containerClient = getBlobContainerClient('cvs');
    const blobClient = containerClient.getBlobClient(blobName);
    
    // Get candidate's form skills
    const candidate = await getCandidate(candidateId, jobId);
    
    // Process CV
    const cvData = await processCVFile(blobClient, candidate.skills, extension);
    
    // Update candidate with CV data
    await updateCandidate(candidateId, jobId, {
      skills: cvData.skills, // Merged skills
      cvEducation: cvData.education,
      cvCertifications: cvData.certifications,
      cvExtractedText: cvData.extractedText
    });
    
    // Re-calculate score with updated data
    await scoreCandidate(candidateId, jobId);
    
    console.log(`✅ CV processed for candidate ${candidateId}`);
    
  } catch (error) {
    console.error(`❌ CV processing failed for ${candidateId}:`, error.message);
    // Don't throw - scoring already happened, this is enhancement
  }
}

/**
 * Calculate platform analytics statistics
 * @param {string} jobId - Job ID to analyze sources for
 * @returns {Promise<Array>} Platform statistics grouped by source
 */
async function getPlatformAnalytics(jobId) {
  try {
    const candidates = await getCandidatesByJob(jobId);
    
    // Group by source
    const sourceMap = {};
    
    candidates.forEach(candidate => {
      const source = candidate.source || 'direct';
      
      if (!sourceMap[source]) {
        sourceMap[source] = {
          source: source,
          applicationCount: 0,
          totalScore: 0,
          scoreCount: 0,
          shortlistedCount: 0
        };
      }
      
      sourceMap[source].applicationCount++;
      
      if (candidate.scores && candidate.scores.total !== null) {
        sourceMap[source].totalScore += candidate.scores.total;
        sourceMap[source].scoreCount++;
      }
      
      if (candidate.status === 'shortlisted') {
        sourceMap[source].shortlistedCount++;
      }
    });
    
    // Calculate averages and quality ratings
    const analytics = Object.values(sourceMap).map(stat => {
      const avgMatchScore = stat.scoreCount > 0 
        ? Math.round(stat.totalScore / stat.scoreCount)
        : 0;
      
      // Generate quality rating (stars)
      let qualityRating = 1;
      if (avgMatchScore >= 80) qualityRating = 5;
      else if (avgMatchScore >= 70) qualityRating = 4;
      else if (avgMatchScore >= 60) qualityRating = 3;
      else if (avgMatchScore >= 50) qualityRating = 2;
      
      return {
        source: stat.source,
        applicationCount: stat.applicationCount,
        avgMatchScore: avgMatchScore,
        shortlistedCount: stat.shortlistedCount,
        qualityRating: qualityRating
      };
    });
    
    // Sort by quality rating (highest first), then by application count
    analytics.sort((a, b) => {
      if (b.qualityRating !== a.qualityRating) {
        return b.qualityRating - a.qualityRating;
      }
      return b.applicationCount - a.applicationCount;
    });
    
    return analytics;
    
  } catch (error) {
    console.error(`❌ Failed to get platform analytics for job ${jobId}:`, error.message);
    throw new Error(`Failed to get analytics: ${error.message}`);
  }
}

module.exports = {
  submitApplication,
  getCandidate,
  getCandidatesByJob,
  updateCandidate,
  updateCandidateStatus,
  uploadCV,
  uploadCoverLetter,
  updateCandidateFiles,
  getJobStatistics,
  getPlatformAnalytics,
  scoreCandidate,
  processCandidateCV
};
