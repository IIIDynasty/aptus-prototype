/* ============================================
   APTUS — Development Server (for local testing)
   ============================================ */

const express = require('express');
const path = require('path');
const multer = require('multer');
const azureConfig = require('./azure-config');
const azureSecurity = require('./azure-security');
const jobManager = require('./services/JobManager');
const candidateManager = require('./services/CandidateManager');
const emailService = require('./services/EmailService');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF and DOCX
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX allowed.'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Initialize Azure services on startup
(async () => {
  const initialized = await azureConfig.initializeAzureServices();
  const securityInitialized = azureSecurity.initializeBlobSecurity();
  emailService.initialize();
  
  if (!initialized || !securityInitialized) {
    console.error('⚠️  Warning: Azure services not fully initialized. Check your .env file.');
    console.log('   Copy .env.template to .env and fill in your Azure connection strings.');
  }
})();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Aptus server running' });
});

// Job Posting Routes
app.post('/api/jobs', async (req, res) => {
  try {
    // Pass the request host so generated links point to the right server
    const baseUrl = req.get('host') || 'localhost:3000';
    const result = await jobManager.createJobPosting(req.body, baseUrl);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/jobs/:jobId', async (req, res) => {
  try {
    const job = await jobManager.getJobPosting(req.params.jobId);
    res.json(job);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await jobManager.getAllJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/jobs/:jobId', async (req, res) => {
  try {
    await jobManager.closeJobPosting(req.params.jobId);
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Candidate Application Routes
app.post('/api/candidates', async (req, res) => {
  try {
    const sourceUrl = req.headers.referer || req.headers.origin;
    const candidate = await candidateManager.submitApplication(req.body, sourceUrl);
    
    // Trigger scoring asynchronously (don't wait)
    candidateManager.scoreCandidate(candidate.id, candidate.jobId)
      .catch(err => console.error('Scoring failed:', err.message));
    
    res.json(candidate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/jobs/:jobId/candidates', async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    const candidates = await candidateManager.getCandidatesByJob(req.params.jobId, filters);
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/candidates/:candidateId', async (req, res) => {
  try {
    const { jobId } = req.query;
    if (!jobId) {
      return res.status(400).json({ error: 'jobId query parameter is required' });
    }
    const candidate = await candidateManager.getCandidate(req.params.candidateId, jobId);
    res.json(candidate);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.patch('/api/candidates/:candidateId/status', async (req, res) => {
  try {
    const { jobId, status, note } = req.body;
    if (!jobId || !status) {
      return res.status(400).json({ error: 'jobId and status are required' });
    }
    await candidateManager.updateCandidateStatus(req.params.candidateId, jobId, status, note);
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// File Upload Routes
app.post('/api/upload/cv', upload.single('cv'), async (req, res) => {
  try {
    const { jobId, candidateId } = req.body;
    if (!jobId || !candidateId) {
      return res.status(400).json({ error: 'jobId and candidateId are required' });
    }
    
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const cvUrl = await candidateManager.uploadCV(jobId, candidateId, req.file.buffer, fileExtension);
    
    // Update candidate with CV URL
    await candidateManager.updateCandidateFiles(candidateId, jobId, {
      cvUrl: cvUrl,
      cvExtension: fileExtension
    });
    
    // Process CV asynchronously (extract skills, re-score)
    const blobName = `${jobId}/${candidateId}.${fileExtension}`;
    candidateManager.processCandidateCV(candidateId, jobId, blobName, fileExtension)
      .catch(err => console.error('CV processing failed:', err.message));
    
    res.json({ cvUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload/cover-letter', upload.single('coverLetter'), async (req, res) => {
  try {
    const { jobId, candidateId } = req.body;
    if (!jobId || !candidateId) {
      return res.status(400).json({ error: 'jobId and candidateId are required' });
    }
    
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const coverLetterUrl = await candidateManager.uploadCoverLetter(jobId, candidateId, req.file.buffer, fileExtension);
    
    // Update candidate with cover letter URL
    await candidateManager.updateCandidateFiles(candidateId, jobId, {
      coverLetterUrl: coverLetterUrl,
      coverLetterExtension: fileExtension
    });
    
    res.json({ coverLetterUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistics Route
app.get('/api/jobs/:jobId/statistics', async (req, res) => {
  try {
    const stats = await candidateManager.getJobStatistics(req.params.jobId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Platform Analytics Route
app.get('/api/jobs/:jobId/analytics', async (req, res) => {
  try {
    const analytics = await candidateManager.getPlatformAnalytics(req.params.jobId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Utility Routes
app.post('/api/prewarm-cache', async (req, res) => {
  try {
    const { prewarmCache } = require('./services/ScoringEngine');
    await prewarmCache();
    res.json({ success: true, message: 'Cache pre-warmed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SignalR Negotiate Endpoint (for local development)
app.post('/api/signalr/negotiate', (req, res) => {
  // For local development, return mock connection info
  // In production, this would be handled by Azure Functions
  res.json({
    url: process.env.SIGNALR_CONNECTION_STRING || 'http://localhost:3000/signalr',
    accessToken: 'mock-token-for-local-dev'
  });
});

// ============================================
// Email Routes
// ============================================

// Bulk action: send interview invites or rejection emails to multiple candidates
app.post('/api/emails/bulk-action', async (req, res) => {
  try {
    const { candidateIds, jobId, action } = req.body;
    if (!candidateIds || !jobId || !action) {
      return res.status(400).json({ error: 'candidateIds, jobId, and action are required' });
    }
    if (!['interview', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "interview" or "reject"' });
    }

    const job = await jobManager.getJobPosting(jobId);
    const results = [];
    const errors = [];

    for (const candidateId of candidateIds) {
      try {
        const candidate = await candidateManager.getCandidate(candidateId, jobId);
        const newStatus = action === 'interview' ? 'shortlisted' : 'rejected';
        await candidateManager.updateCandidateStatus(candidateId, jobId, newStatus);

        const prototypeTestingEmail = 'ismailisah006@gmail.com'; // PROTOTYPE OVERRIDE

        if (action === 'interview') {
          await emailService.sendInterviewInvite(
            prototypeTestingEmail,
            candidate.name || candidate.fullName,
            job.title
          );
        } else {
          await emailService.sendRejectionEmail(
            prototypeTestingEmail,
            candidate.name || candidate.fullName,
            job.title
          );
        }
        results.push({ candidateId, success: true });
      } catch (err) {
        console.error(`Failed for candidate ${candidateId}:`, err.message);
        errors.push({ candidateId, error: err.message });
      }
    }

    res.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notify admin when a free community distribution is requested
app.post('/api/emails/notify-community', async (req, res) => {
  try {
    const { communityName, jobLink } = req.body;
    if (!communityName || !jobLink) {
      return res.status(400).json({ error: 'communityName and jobLink are required' });
    }

    const ADMIN_EMAIL = 'ismailisah006@gmail.com';
    await emailService.sendCommunityNotification(ADMIN_EMAIL, communityName, jobLink);

    res.json({ success: true, message: `Notification sent for community: ${communityName}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html for all routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     APTUS MVP — Development Server        ║
╚═══════════════════════════════════════════╝

🚀 Server running at: http://localhost:${PORT}
📁 Serving static files from: ${__dirname}

Azure Services Status:
  ${azureConfig.cosmosClient() ? '✅' : '⏳'} Cosmos DB
  ${azureConfig.blobServiceClient() ? '✅' : '⏳'} Blob Storage
  
Next Steps:
  1. Ensure .env file is configured with Azure connection strings
  2. See AZURE_SETUP.md for setup instructions
  3. Access the app at http://localhost:${PORT}
  
Press Ctrl+C to stop the server
`);
});
