/* ============================================
   APTUS — Azure Security & Access Control
   ============================================ */

require('dotenv').config();

const { 
  BlobServiceClient, 
  generateBlobSASQueryParameters, 
  BlobSASPermissions,
  StorageSharedKeyCredential 
} = require('@azure/storage-blob');

// ============================================
// CONFIGURATION
// ============================================

const config = {
  blobStorage: {
    accountName: process.env.BLOB_STORAGE_ACCOUNT_NAME,
    accountKey: process.env.BLOB_STORAGE_ACCOUNT_KEY,
    connectionString: process.env.BLOB_STORAGE_CONNECTION_STRING
  }
};

// Initialize Blob Storage client
let blobServiceClient = null;
let sharedKeyCredential = null;

/**
 * Initialize Blob Storage client for SAS token generation
 */
function initializeBlobSecurity() {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(
      config.blobStorage.connectionString
    );

    sharedKeyCredential = new StorageSharedKeyCredential(
      config.blobStorage.accountName,
      config.blobStorage.accountKey
    );

    console.log('✅ Blob Storage security initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Blob Storage security:', error.message);
    return false;
  }
}

// ============================================
// SAS TOKEN GENERATION (Read-Only)
// ============================================

/**
 * Generate a read-only SAS token URL for a blob
 * 
 * @param {string} containerName - Container name ('cvs' or 'cover-letters')
 * @param {string} blobName - Blob path (e.g., 'JOB-2024-1234/candidate-5678.pdf')
 * @param {number} expiryDays - Number of days until expiration (default: 7)
 * @returns {string} Secure URL with SAS token
 * 
 * Security Features:
 * - Read-only permission (no write, delete, or list)
 * - Blob-level access (cannot list other files in container)
 * - Time-limited expiration (7 days default)
 * - HTTPS-only access
 */
function generateBlobSasUrl(containerName, blobName, expiryDays = 7) {
  if (!blobServiceClient || !sharedKeyCredential) {
    throw new Error('Blob Storage security not initialized. Call initializeBlobSecurity() first.');
  }

  // Validate inputs
  if (!containerName || !blobName) {
    throw new Error('Container name and blob name are required');
  }

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    // Set expiry time
    const startsOn = new Date();
    const expiresOn = new Date();
    expiresOn.setDate(expiresOn.getDate() + expiryDays);

    // Define SAS token permissions (read-only)
    const permissions = BlobSASPermissions.parse('r'); // r = read only

    // Generate SAS token
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: containerName,
        blobName: blobName,
        permissions: permissions,
        startsOn: startsOn,
        expiresOn: expiresOn,
        protocol: 'https' // HTTPS only for security
      },
      sharedKeyCredential
    ).toString();

    // Return full URL with SAS token
    const sasUrl = `${blobClient.url}?${sasToken}`;
    
    console.log(`✅ Generated SAS token for ${containerName}/${blobName} (expires: ${expiresOn.toISOString()})`);
    
    return sasUrl;

  } catch (error) {
    console.error(`❌ Failed to generate SAS token for ${containerName}/${blobName}:`, error.message);
    throw error;
  }
}

/**
 * Generate SAS URL for a CV file
 * 
 * @param {string} jobId - Job ID
 * @param {string} candidateId - Candidate ID
 * @param {string} fileExtension - File extension (e.g., 'pdf', 'docx')
 * @param {number} expiryDays - Days until expiration
 * @returns {string} Secure CV URL with SAS token
 */
function generateCvSasUrl(jobId, candidateId, fileExtension, expiryDays = 7) {
  const blobName = `${jobId}/${candidateId}.${fileExtension}`;
  return generateBlobSasUrl('cvs', blobName, expiryDays);
}

/**
 * Generate SAS URL for a cover letter file
 * 
 * @param {string} jobId - Job ID
 * @param {string} candidateId - Candidate ID
 * @param {string} fileExtension - File extension
 * @param {number} expiryDays - Days until expiration
 * @returns {string} Secure cover letter URL with SAS token
 */
function generateCoverLetterSasUrl(jobId, candidateId, fileExtension, expiryDays = 7) {
  const blobName = `${jobId}/${candidateId}.${fileExtension}`;
  return generateBlobSasUrl('cover-letters', blobName, expiryDays);
}

// ============================================
// COSMOS DB ACCESS CONTROL HELPERS
// ============================================

/**
 * Validate that a query is partition-scoped (for privacy)
 * Prevents cross-partition queries that could leak candidate data
 * 
 * @param {string} partitionKey - Expected partition key value
 * @param {object} querySpec - Cosmos DB query specification
 * @returns {boolean} True if query is safely scoped
 */
function isPartitionScopedQuery(partitionKey, querySpec) {
  // Check if query includes the partition key filter
  const queryString = querySpec.query || '';
  const parameters = querySpec.parameters || [];
  
  // For candidates container, ensure jobId is in the query
  if (partitionKey === 'jobId') {
    const hasJobIdFilter = queryString.includes('c.jobId = @jobId') || 
                          queryString.includes('WHERE c.jobId');
    
    const hasJobIdParam = parameters.some(p => p.name === '@jobId');
    
    return hasJobIdFilter && hasJobIdParam;
  }
  
  return true; // Other containers don't require this check
}

/**
 * Create a partition-scoped query for candidates
 * Ensures privacy by limiting query to a single job
 * 
 * @param {string} jobId - Job ID to scope the query to
 * @param {object} additionalFilters - Additional WHERE conditions
 * @returns {object} Cosmos DB query specification
 */
function createPartitionScopedQuery(jobId, additionalFilters = {}) {
  let whereClause = 'c.jobId = @jobId';
  const parameters = [{ name: '@jobId', value: jobId }];
  
  // Add additional filters
  Object.keys(additionalFilters).forEach(key => {
    const paramName = `@${key}`;
    whereClause += ` AND c.${key} = ${paramName}`;
    parameters.push({ name: paramName, value: additionalFilters[key] });
  });
  
  return {
    query: `SELECT * FROM c WHERE ${whereClause}`,
    parameters: parameters
  };
}

/**
 * Sanitize candidate data for public API responses
 * Removes sensitive personal information
 * 
 * @param {object} candidate - Full candidate object
 * @returns {object} Sanitized candidate object (safe for public API)
 */
function sanitizeCandidateData(candidate) {
  // Create a copy to avoid mutating original
  const sanitized = { ...candidate };
  
  // Remove sensitive fields
  delete sanitized.email;
  delete sanitized.phone;
  delete sanitized.linkedIn;
  delete sanitized.cvUrl;
  delete sanitized.coverLetterUrl;
  
  // Keep only non-sensitive fields
  return {
    id: sanitized.id,
    jobId: sanitized.jobId,
    fullName: sanitized.fullName,
    currentRole: sanitized.currentRole,
    yearsOfExperience: sanitized.yearsOfExperience,
    skills: sanitized.skills,
    scores: sanitized.scores,
    status: sanitized.status,
    appliedAt: sanitized.appliedAt,
    source: sanitized.source
  };
}

/**
 * Sanitize candidate data for admin API responses
 * Includes contact info but generates fresh SAS tokens for file URLs
 * 
 * @param {object} candidate - Full candidate object
 * @returns {object} Admin-safe candidate object with fresh SAS tokens
 */
function sanitizeCandidateDataForAdmin(candidate) {
  const adminData = { ...candidate };
  
  // Regenerate SAS tokens with fresh expiration (don't expose permanent URLs)
  if (adminData.cvUrl) {
    // Extract jobId, candidateId, extension from existing URL or metadata
    const cvExtension = adminData.cvExtension || 'pdf';
    adminData.cvUrl = generateCvSasUrl(candidate.jobId, candidate.id, cvExtension, 1); // 1-day expiry
  }
  
  if (adminData.coverLetterUrl) {
    const clExtension = adminData.coverLetterExtension || 'pdf';
    adminData.coverLetterUrl = generateCoverLetterSasUrl(candidate.jobId, candidate.id, clExtension, 1);
  }
  
  return adminData;
}

// ============================================
// SECURITY VALIDATION
// ============================================

/**
 * Validate that connection string is not exposed in client code
 * This should only be called from server-side code
 * 
 * @returns {boolean} True if running in server environment
 */
function validateServerSideExecution() {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY ERROR: Connection strings cannot be used in client-side code. Use SAS tokens instead.');
  }
  return true;
}

/**
 * Validate file upload size and type
 * 
 * @param {File|Buffer} file - File to validate
 * @param {number} maxSizeMB - Maximum file size in MB (default: 5)
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @returns {object} Validation result {valid: boolean, error: string}
 */
function validateFileUpload(file, maxSizeMB = 5, allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`
    };
  }
  
  return {
    valid: true,
    error: null
  };
}

// ============================================
// INDEX POLICY CONFIGURATION
// ============================================

/**
 * Get recommended index policy for candidates container
 * Optimizes queries on status and scores.total
 * 
 * @returns {object} Cosmos DB index policy
 */
function getCandidatesIndexPolicy() {
  return {
    indexingMode: 'consistent',
    automatic: true,
    includedPaths: [
      {
        path: '/*' // Index all paths by default
      }
    ],
    excludedPaths: [
      {
        path: '/_etag/?' // Exclude system properties
      }
    ],
    compositeIndexes: [
      [
        { path: '/jobId', order: 'ascending' },
        { path: '/scores/total', order: 'descending' }
      ],
      [
        { path: '/jobId', order: 'ascending' },
        { path: '/status', order: 'ascending' }
      ],
      [
        { path: '/jobId', order: 'ascending' },
        { path: '/appliedAt', order: 'descending' }
      ]
    ]
  };
}

/**
 * Get recommended index policy for jobs container
 * 
 * @returns {object} Cosmos DB index policy
 */
function getJobsIndexPolicy() {
  return {
    indexingMode: 'consistent',
    automatic: true,
    includedPaths: [
      {
        path: '/*'
      }
    ],
    excludedPaths: [
      {
        path: '/_etag/?'
      }
    ]
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Initialization
  initializeBlobSecurity,
  
  // SAS Token Generation
  generateBlobSasUrl,
  generateCvSasUrl,
  generateCoverLetterSasUrl,
  
  // Cosmos DB Access Control
  isPartitionScopedQuery,
  createPartitionScopedQuery,
  sanitizeCandidateData,
  sanitizeCandidateDataForAdmin,
  
  // Security Validation
  validateServerSideExecution,
  validateFileUpload,
  
  // Index Policies
  getCandidatesIndexPolicy,
  getJobsIndexPolicy
};

