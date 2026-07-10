/* ============================================
   APTUS — Job Manager Service
   ============================================ */

const { getContainer } = require('../azure-config');
const { JobPosting } = require('../models/JobPosting');
const { validateJobData, generateJobId, generateJobLinks } = require('../utils/validators');

/**
 * Create a new job posting
 * @param {object} jobData - Job posting data
 * @returns {Promise<object>} Created job with links
 */
async function createJobPosting(jobData, baseUrl) {
  // Validate job data
  const validation = validateJobData(jobData);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Generate job ID
  const jobId = generateJobId();

  // Create job posting object
  const job = new JobPosting({
    ...jobData,
    id: jobId,
    createdAt: new Date().toISOString(),
    applicantCount: 0,
    shortlistedCount: 0,
    status: 'active'
  });

  // Save to Cosmos DB
  try {
    const container = getContainer('jobs');
    const { resource: createdJob } = await container.items.create(job.toJSON());

    // Generate links — prefer caller-supplied baseUrl over env fallback
    const resolvedBaseUrl = baseUrl || process.env.BASE_URL || 'localhost:3000';
    const links = generateJobLinks(jobId, resolvedBaseUrl);

    console.log(`✅ Job created: ${jobId} - ${jobData.title} → ${links.applicationLink}`);

    return {
      job: createdJob,
      applicationLink: links.applicationLink,
      adminLink: links.adminLink
    };

  } catch (error) {
    console.error('❌ Failed to create job:', error.message);
    throw new Error(`Failed to create job: ${error.message}`);
  }
}

/**
 * Get job posting by ID
 * @param {string} jobId - Job ID
 * @returns {Promise<object>} Job posting
 */
async function getJobPosting(jobId) {
  try {
    const container = getContainer('jobs');
    const { resource: job } = await container.item(jobId, jobId).read();
    
    if (!job) {
      throw new Error('Job not found');
    }

    return JobPosting.fromDocument(job);

  } catch (error) {
    console.error(`❌ Failed to get job ${jobId}:`, error.message);
    throw new Error(`Job not found: ${jobId}`);
  }
}

/**
 * Update job posting
 * @param {string} jobId - Job ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated job
 */
async function updateJobPosting(jobId, updates) {
  try {
    const container = getContainer('jobs');
    
    // Get existing job
    const { resource: existingJob } = await container.item(jobId, jobId).read();
    if (!existingJob) {
      throw new Error('Job not found');
    }

    // Merge updates
    const updatedJob = {
      ...existingJob,
      ...updates,
      id: jobId // Ensure ID doesn't change
    };

    // Save updated job
    const { resource: result } = await container.item(jobId, jobId).replace(updatedJob);

    console.log(`✅ Job updated: ${jobId}`);
    return JobPosting.fromDocument(result);

  } catch (error) {
    console.error(`❌ Failed to update job ${jobId}:`, error.message);
    throw new Error(`Failed to update job: ${error.message}`);
  }
}

/**
 * Increment applicant count
 * @param {string} jobId - Job ID
 */
async function incrementApplicantCount(jobId) {
  try {
    const job = await getJobPosting(jobId);
    await updateJobPosting(jobId, {
      applicantCount: (job.applicantCount || 0) + 1
    });
  } catch (error) {
    console.error(`❌ Failed to increment applicant count for ${jobId}:`, error.message);
    // Don't throw - this shouldn't block application submission
  }
}

/**
 * Increment shortlisted count
 * @param {string} jobId - Job ID
 */
async function incrementShortlistedCount(jobId) {
  try {
    const job = await getJobPosting(jobId);
    await updateJobPosting(jobId, {
      shortlistedCount: (job.shortlistedCount || 0) + 1
    });
  } catch (error) {
    console.error(`❌ Failed to increment shortlisted count for ${jobId}:`, error.message);
  }
}

/**
 * Decrement shortlisted count
 * @param {string} jobId - Job ID
 */
async function decrementShortlistedCount(jobId) {
  try {
    const job = await getJobPosting(jobId);
    const newCount = Math.max(0, (job.shortlistedCount || 0) - 1);
    await updateJobPosting(jobId, {
      shortlistedCount: newCount
    });
  } catch (error) {
    console.error(`❌ Failed to decrement shortlisted count for ${jobId}:`, error.message);
  }
}

/**
 * Get all jobs (for admin) with statistics
 * @returns {Promise<Array>} List of all jobs with stats
 */
async function getAllJobs() {
  try {
    const container = getContainer('jobs');
    const { resources: jobs } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE (NOT IS_DEFINED(c.status) OR c.status != "closed") ORDER BY c.createdAt DESC'
      })
      .fetchAll();

    // Fetch statistics for each job
    const { getJobStatistics } = require('./CandidateManager');
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        try {
          const stats = await getJobStatistics(job.id);
          return {
            ...JobPosting.fromDocument(job),
            shortlistedCount: stats.shortlisted,
            averageMatchScore: stats.avgMatchScore
          };
        } catch (error) {
          // If stats fail, return job without stats
          return JobPosting.fromDocument(job);
        }
      })
    );

    return jobsWithStats;

  } catch (error) {
    console.error('❌ Failed to get all jobs:', error.message);
    throw new Error(`Failed to get jobs: ${error.message}`);
  }
}

/**
 * Delete job posting (soft delete - set status to 'closed')
 * @param {string} jobId - Job ID
 */
async function closeJobPosting(jobId) {
  try {
    await updateJobPosting(jobId, {
      status: 'closed',
      closedAt: new Date().toISOString()
    });

    console.log(`✅ Job closed: ${jobId}`);

  } catch (error) {
    console.error(`❌ Failed to close job ${jobId}:`, error.message);
    throw new Error(`Failed to close job: ${error.message}`);
  }
}

module.exports = {
  createJobPosting,
  getJobPosting,
  updateJobPosting,
  incrementApplicantCount,
  incrementShortlistedCount,
  decrementShortlistedCount,
  getAllJobs,
  closeJobPosting
};
