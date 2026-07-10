# Aptus MVP Core - Azure Design Document

## Overview

The Aptus MVP Core is an AI-powered recruitment platform that helps Northern Nigerian recruiters identify qualified candidates faster through intelligent matching, community-based sourcing, and real-time candidate updates. The system employs a no-login approach using unique URLs for MVP v1.0, **Azure services for backend infrastructure** (Cosmos DB, Blob Storage, Functions, SignalR, Static Web Apps), and OpenAI for AI-powered candidate scoring.

### Key Design Principles

- **Speed-to-Value**: No authentication barriers for initial use; recruiters can post jobs and receive applications immediately
- **AI-First Matching**: Leverage OpenAI embeddings and GPT-3.5-turbo to provide semantic skills matching and quality assessment
- **Real-Time Experience**: Azure SignalR Service + Cosmos DB Change Feed ensures recruiters see new applications instantly
- **Cost-Efficient AI**: Optimize token usage and cache embeddings to keep per-candidate costs under $0.002
- **Data Privacy**: Implement access controls to protect candidate information
- **Azure Free Tier**: All Azure services use free tier - no upfront payment required

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Landing    │  │  Recruiter   │  │  Candidate   │         │
│  │     Page     │  │   Dashboard  │  │  Application │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│           HTML/CSS/JavaScript (Vanilla)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Azure Services Layer                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Azure Cosmos DB (Free Tier)                      │  │
│  │  Database: aptus-mvp                                      │  │
│  │  ├─ Container: jobs (partition: id)                      │  │
│  │  ├─ Container: candidates (partition: jobId)             │  │
│  │  └─ Container: skillEmbeddingsCache (partition: skill)   │  │
│  │  Free: 1000 RU/s + 25GB storage                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Azure Blob Storage (Free Tier)                   │  │
│  │  Container: cvs/{job-id}/{candidate-id}.{ext}            │  │
│  │  Container: cover-letters/{job-id}/{candidate-id}.{ext}  │  │
│  │  Free: 5GB storage + 20K operations                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Azure Functions (Free Tier)                      │  │
│  │  ├─ onCandidateCreated (Cosmos DB trigger)               │  │
│  │  ├─ processCVUpload (Blob trigger)                       │  │
│  │  └─ calculateMatchScore (HTTP trigger)                   │  │
│  │  Free: 1M executions/month                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Azure SignalR Service (Free Tier)                │  │
│  │  Real-time updates to recruiter dashboard                 │  │
│  │  Free: 20 concurrent connections, 20K messages/day       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Azure Static Web Apps (Free)                     │  │
│  │  Hosting + CDN + Custom domains + SSL                     │  │
│  │  Free: 100GB bandwidth/month                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services Layer                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          OpenAI API                                       │  │
│  │  ├─ text-embedding-3-small (skills semantic matching)   │  │
│  │  └─ gpt-3.5-turbo (quality assessment, CV parsing)      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

The system consists of three primary frontend components and an Azure serverless backend:

**Frontend Components:**
1. **Landing Page**: Role selection interface (recruiter vs candidate)
2. **Recruiter Dashboard**: Job management, candidate rankings, analytics with real-time updates via SignalR
3. **Candidate Application**: Form submission, file upload, match result display

**Backend Services (Azure):**
1. **Azure Cosmos DB**: NoSQL document database with Change Feed for real-time sync
2. **Azure Functions**: Event-driven serverless functions for AI processing
3. **Azure Blob Storage**: File storage for CV and cover letter files with SAS tokens
4. **Azure SignalR Service**: Real-time WebSocket communication for live updates
5. **Azure Static Web Apps**: Static file hosting with CDN and custom domains

## Components and Interfaces

### 1. Job Posting Manager

**Responsibility**: Handle job creation, validation, and link generation

**Interface:**
```javascript
// JobPosting data structure
interface JobPosting {
  id: string;              // Format: JOB-{YEAR}-{4-digit-random}, also partition key
  title: string;
  department: string;
  location: string;        // Northern Nigerian state or Remote
  experienceLevel: string; // Entry/Mid/Senior/Lead/Executive
  description: string;
  skills: string[];        // Required skills array
  qualifications: string;
  createdAt: number;       // Unix timestamp
  applicationLink: string; // aptus.io/jobs/{id}/apply
  adminLink: string;       // aptus.io/jobs/{id}/admin
  selectedCommunities: string[]; // Platform identifiers
  statistics: {
    applicantCount: number;
    shortlistedCount: number;
    rejectedCount: number;
    avgMatchScore: number;
  };
}

// Public methods
function createJobPosting(jobData: Partial<JobPosting>): Promise<JobPosting>
function generateJobLinks(jobId: string): { applicationLink: string, adminLink: string }
function validateJobData(jobData: Partial<JobPosting>): ValidationResult
```

**Key Behaviors:**
- Validates all required fields before saving to Cosmos DB
- Generates unique Job_ID using year prefix and random 4-digit suffix
- Creates both public application link and private admin link
- Stores skills as array for efficient matching operations
- Uses Job ID as partition key in Cosmos DB

**Cosmos DB Operations:**
```javascript
const { CosmosClient } = require('@azure/cosmos');
const client = new CosmosClient({ endpoint, key });
const database = client.database('aptus-mvp');
const container = database.container('jobs');

// Create job
await container.items.create({
  id: jobId,
  ...jobData
});
```

### 2. Candidate Application Processor

**Responsibility**: Process candidate submissions, manage file uploads, trigger AI scoring

**Interface:**
```javascript
// Application data structure
interface CandidateApplication {
  id: string;              // Candidate ID
  jobId: string;           // Partition key
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    linkedIn?: string;
  };
  experience: {
    years: number;
    currentRole?: string;
    skills: string[];
    summary: string;        // Measurable achievements
  };
  files: {
    cvUrl?: string;         // Azure Blob Storage URL with SAS token
    coverLetterUrl?: string;
  };
  source?: string;          // UTM source parameter
  scores: {
    total: number;
    skills: number;
    experience: number;
    qualifications: number;
    applicationQuality: number;
  };
  status: 'pending' | 'shortlisted' | 'rejected';
  appliedAt: number;
  statusHistory: StatusChange[];
}

interface StatusChange {
  from: string;
  to: string;
  timestamp: number;
}

// Public methods
function submitApplication(jobId: string, appData: Partial<CandidateApplication>): Promise<string>
function uploadFile(file: File, type: 'cv' | 'cover', jobId: string, candidateId: string): Promise<string>
function extractSourceFromURL(url: string): string | null
```

**Key Behaviors:**
- Enforces required field validation before Cosmos DB write
- Uploads files to Azure Blob Storage with path pattern: `cvs/{job-id}/{candidate-id}.{ext}`
- Generates SAS tokens for secure file access with 7-day expiration
- Captures source parameter from URL query string for platform tracking
- Triggers Azure Function for AI scoring upon successful save (via Cosmos DB Change Feed)
- Uses jobId as partition key for efficient querying
- Returns candidate ID for subsequent updates

**Azure Blob Storage Upload:**
```javascript
const { BlobServiceClient, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require('@azure/storage-blob');

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient('cvs');
const blobName = `${jobId}/${candidateId}.pdf`;
const blockBlobClient = containerClient.getBlockBlobClient(blobName);

// Upload
await blockBlobClient.uploadData(fileBuffer);

// Generate SAS URL (7-day expiry)
const sasToken = generateBlobSASQueryParameters({
  containerName: 'cvs',
  blobName: blobName,
  permissions: 'r',
  expiresOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
}, sharedKeyCredential);

const sasUrl = `${blockBlobClient.url}?${sasToken}`;
```

### 3. AI Scoring Engine

**Responsibility**: Calculate match scores using OpenAI embeddings and GPT models

**Interface:**
```javascript
// Scoring configuration
interface ScoringWeights {
  skills: 0.4;
  experience: 0.3;
  qualifications: 0.2;
  applicationQuality: 0.1;
}

interface MatchScore {
  total: number;           // 0-100
  skills: number;          // 0-100
  experience: number;      // 0-100
  qualifications: number;  // 0-100
  applicationQuality: number; // 0-100
}

// Public methods
function calculateMatchScore(candidate: CandidateApplication, job: JobPosting): Promise<MatchScore>
function calculateSkillsMatch(candidateSkills: string[], jobSkills: string[]): Promise<number>
function calculateExperienceMatch(candidateYears: number, jobLevel: string): number
function calculateQualificationsScore(qualifications: string): number
function assessApplicationQuality(summary: string): Promise<number>
```

**Scoring Algorithm:**

**Skills Match (40% weight):**
- **Exact Match (50%)**: Case-insensitive string comparison
- **Semantic Match (50%)**: OpenAI embeddings with cosine similarity ≥ 0.75
- Formula: `(exactMatches + semanticMatches) / totalRequiredSkills * 100`

**Experience Match (30% weight):**
- Level mapping: Entry=1yr, Mid=3yr, Senior=5yr, Lead=8yr, Executive=12yr
- Scoring logic:
  - `candidateYears >= required + 2`: 100 points
  - `candidateYears >= required`: 85 points
  - `candidateYears >= required - 1`: 60 points
  - Otherwise: `max(0, 40 - (required - candidate) * 10)`

**Qualifications Score (20% weight):**
- Keyword detection: BSc, MSc, HND, PhD, Chartered, Certified, AWS, PMP, Google, Cisco
- Has degree + certification: 100 points
- Has degree OR certification: 70 points
- Neither but relevant experience: 40 points

**Application Quality (10% weight):**
- GPT-3.5-turbo analysis of achievements summary
- Criteria: presence of metrics/numbers, clarity, professionalism
- Returns 0-100 score

**Total Score Calculation:**
```javascript
total = Math.round(
  skills * 0.4 +
  experience * 0.3 +
  qualifications * 0.2 +
  applicationQuality * 0.1
)
```

**Azure Function Implementation:**
```javascript
// functions/onCandidateCreated/index.js
module.exports = async function (context, documents) {
  for (const candidate of documents) {
    // Get job details
    const job = await getJobFromCosmosDB(candidate.jobId);
    
    // Calculate match score
    const score = await calculateMatchScore(candidate, job);
    
    // Update candidate record in Cosmos DB
    await updateCandidateScore(candidate.id, candidate.jobId, score);
    
    // Broadcast to SignalR for real-time update
    await broadcastToRecruiters(candidate.jobId, { ...candidate, scores: score });
  }
};
```

### 4. CV Parser

**Responsibility**: Extract text from PDF and DOCX files for AI analysis

**Interface:**
```javascript
interface ParsedCV {
  text: string;
  extractedSkills: string[];
  extractedQualifications: string[];
  extractedExperience?: string;
  parsingStatus: 'success' | 'failed' | 'timeout';
  errorMessage?: string;
}

// Public methods
function extractTextFromPDF(blobUrl: string): Promise<string>
function extractTextFromDOCX(blobUrl: string): Promise<string>
function parseCVWithAI(cvText: string, jobSkills: string[]): Promise<ParsedCV>
```

**Key Behaviors:**
- Uses `pdf-parse` library for PDF text extraction
- Uses `mammoth` library for DOCX text extraction
- Downloads blob from Azure Blob Storage
- Sends extracted text (max 8000 characters) to OpenAI GPT-3.5-turbo
- AI prompt requests structured extraction: skills, certifications, education, achievements
- Merges CV-extracted skills with form-submitted skills (deduplication)
- Adjusts qualifications score up to +10 points if CV confirms unlisted credentials
- Handles errors gracefully: logs failure, continues with form-based scoring

**Azure Function (Blob Trigger):**
```javascript
// functions/processCVUpload/index.js
module.exports = async function (context, blob) {
  const blobName = context.bindingData.name; // e.g., "JOB-2025-1234/CAND-abc.pdf"
  const [jobId, fileName] = blobName.split('/');
  const candidateId = fileName.split('.')[0];
  
  // Extract text from blob
  const cvText = await extractTextFromPDF(blob);
  
  // Analyze with OpenAI
  const parsedData = await parseCVWithAI(cvText, jobSkills);
  
  // Update candidate record
  await updateCandidateWithCVData(candidateId, jobId, parsedData);
};
```

### 5. Real-Time Update Manager

**Responsibility**: Manage Azure SignalR connections and UI synchronization via Cosmos DB Change Feed

**Interface:**
```javascript
// Public methods
function connectToSignalR(jobId: string): Promise<signalR.HubConnection>
function disconnectFromSignalR(connection: signalR.HubConnection): Promise<void>
function broadcastToJob(jobId: string, eventName: string, data: any): Promise<void>
function updateCandidateStatus(jobId: string, candidateId: string, status: string): Promise<void>
```

**Key Behaviors:**
- Establishes SignalR WebSocket connection to Azure Function endpoint
- Listens for events: `newCandidate`, `candidateUpdated`, `statisticsUpdated`
- Triggers UI updates within 2 seconds of database change
- Supports up to 20 concurrent recruiter connections (free tier) per job
- Automatically reconnects if connection drops
- Updates dashboard statistics counters in real-time

**Client-Side Connection:**
```javascript
const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${azureFunctionUrl}/api`)
  .withAutomaticReconnect()
  .build();

await connection.start();

// Join job-specific group
await connection.invoke('JoinJob', jobId);

// Listen for new candidates
connection.on('newCandidate', (candidate) => {
  addCandidateToTable(candidate);
  updateStatistics();
});

// Listen for status changes
connection.on('candidateUpdated', (candidate) => {
  updateCandidateRow(candidate);
});
```

**Server-Side (Azure Function):**
```javascript
// functions/negotiate/index.js - SignalR connection negotiation
module.exports = async function (context, req) {
  return {
    url: process.env.AzureSignalRConnectionString
  };
};

// functions/broadcast/index.js - Cosmos DB Change Feed → SignalR
module.exports = async function (context, documents) {
  const signalRMessages = [];
  
  for (const doc of documents) {
    signalRMessages.push({
      target: 'newCandidate',
      arguments: [doc],
      groupName: doc.jobId // Send to specific job group
    });
  }
  
  context.bindings.signalRMessages = signalRMessages;
};
```

### 6. Platform Analytics Tracker

**Responsibility**: Track application sources and generate performance reports

**Interface:**
```javascript
interface PlatformStats {
  source: string;
  applicationCount: number;
  avgMatchScore: number;
  shortlistedCount: number;
  qualityRating: number; // 1-5 stars
}

// Public methods
function trackApplicationSource(candidateId: string, source: string): Promise<void>
function calculatePlatformStats(jobId: string): Promise<PlatformStats[]>
function generateQualityRating(avgScore: number): number
```

**Quality Rating Calculation:**
- 5 stars: avgScore ≥ 80%
- 4 stars: avgScore 70-79%
- 3 stars: avgScore 60-69%
- 2 stars: avgScore 50-59%
- 1 star: avgScore < 50%

**Cosmos DB Query:**
```javascript
const { resources: candidates } = await container.items
  .query({
    query: 'SELECT * FROM c WHERE c.jobId = @jobId',
    parameters: [{ name: '@jobId', value: jobId }]
  })
  .fetchAll();

// Group by source and calculate stats
const statsBySource = {};
candidates.forEach(c => {
  if (!statsBySource[c.source]) {
    statsBySource[c.source] = { count: 0, totalScore: 0, shortlisted: 0 };
  }
  statsBySource[c.source].count++;
  statsBySource[c.source].totalScore += c.scores.total;
  if (c.status === 'shortlisted') statsBySource[c.source].shortlisted++;
});
```

## Data Models

### Azure Cosmos DB Schema

**Database:** `aptus-mvp`

**Container 1: jobs**
- Partition Key: `/id`

```json
{
  "id": "JOB-2025-4582",
  "title": "Senior Software Engineer",
  "department": "Engineering",
  "location": "Lagos, Nigeria (Hybrid)",
  "experienceLevel": "Senior Level (5+ years)",
  "description": "...",
  "skills": ["Python", "Django", "PostgreSQL", "AWS"],
  "qualifications": "BSc Computer Science or equivalent, AWS certification",
  "createdAt": 1737840000000,
  "applicationLink": "aptus.io/jobs/JOB-2025-4582/apply",
  "adminLink": "aptus.io/jobs/JOB-2025-4582/admin",
  "selectedCommunities": ["whatsapp-tech-professionals", "telegram-nigerian-devs"],
  "statistics": {
    "applicantCount": 0,
    "shortlistedCount": 0,
    "rejectedCount": 0,
    "avgMatchScore": 0
  }
}
```

**Container 2: candidates**
- Partition Key: `/jobId`

```json
{
  "id": "CAND-abc123",
  "jobId": "JOB-2025-4582",
  "personalInfo": {
    "fullName": "Chukwuemeka Okafor",
    "email": "chukwuemeka@email.com",
    "phone": "+234 800 000 0000",
    "linkedIn": "linkedin.com/in/chukwuemeka"
  },
  "experience": {
    "years": 7,
    "currentRole": "Senior Developer at Flutterwave",
    "skills": ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
    "summary": "Built payment APIs processing ₦4B+ monthly..."
  },
  "files": {
    "cvUrl": "https://aptusmvpstorage.blob.core.windows.net/cvs/JOB-2025-4582/CAND-abc123.pdf?sv=2021-08-06&...",
    "coverLetterUrl": null
  },
  "source": "whatsapp-tech-professionals",
  "scores": {
    "total": 87,
    "skills": 95,
    "experience": 85,
    "qualifications": 85,
    "applicationQuality": 90
  },
  "status": "shortlisted",
  "appliedAt": 1737844800000,
  "statusHistory": [
    { "from": "pending", "to": "shortlisted", "timestamp": 1737850000000 }
  ]
}
```

**Container 3: skillEmbeddingsCache**
- Partition Key: `/skill`

```json
{
  "id": "python",
  "skill": "python",
  "embedding": [0.023, -0.145, 0.678, /* ...1536 dimensions */ ]
}
```

### Azure Blob Storage Structure

**Storage Account:** `aptusmvpstorage`

```
Container: cvs
├─ {job-id}/
│  └─ {candidate-id}.pdf
│  └─ {candidate-id}.docx

Container: cover-letters
├─ {job-id}/
   └─ {candidate-id}.pdf
   └─ {candidate-id}.docx
```

**Access Control:**
- CV and cover letter URLs are SAS tokens with 7-day expiration
- Only recruiters accessing admin dashboard can retrieve download URLs
- Public application links cannot access blob storage directly

## Correctness Properties

### Property 3 (Updated): Blob Storage Path Format

*For any* CV upload with job-id and candidate-id, the Azure Blob Storage path SHALL follow the pattern "cvs/{job-id}/{candidate-id}.{extension}" or "cover-letters/{job-id}/{candidate-id}.{extension}".

**Validates: Requirements 2.3**

**All other properties (1-2, 4-20) remain unchanged from original design.**

## Error Handling

### Error Categories and Recovery Strategies

**1. OpenAI API Failures**
- Same as original design

**2. CV Parsing Failures**
- Same as original design

**3. Azure Cosmos DB Connection Loss**
- **Scenario**: Network interruption, Cosmos DB service degradation
- **Detection**: SDK throws exception or timeout
- **Recovery**:
  - Automatically retry with exponential backoff (Azure SDK built-in)
  - Re-synchronize data after reconnection
  - Display "Reconnecting..." indicator in UI
- **User Impact**: Brief UI freeze; automatic recovery without data loss

**4. Azure Blob Storage Upload Failure**
- **Scenario**: Network timeout, quota exceeded, permission denied
- **Detection**: Upload promise rejects or progress stalls > 30 seconds
- **Recovery**:
  - Display error: "CV upload failed. Please try again."
  - Allow user to retry upload without losing form data
  - Do not proceed to scoring until upload succeeds or user skips CV
- **User Impact**: User must retry upload or continue without CV

**5. Azure SignalR Connection Loss**
- **Scenario**: WebSocket disconnection
- **Detection**: SignalR SDK emits `onclose` event
- **Recovery**:
  - Automatically reconnect using SignalR's built-in retry (with exponential backoff)
  - Re-join job-specific group after reconnection
  - Fetch latest data on reconnect to catch missed updates
- **User Impact**: Temporary loss of real-time updates; automatic recovery

**6. Azure Functions Timeout**
- **Scenario**: AI scoring takes longer than function timeout (default 5 minutes)
- **Detection**: Function execution exceeds timeout
- **Recovery**:
  - Log timeout error
  - Mark candidate as "scoring pending"
  - Retry function execution automatically (Azure Functions built-in)
  - If second attempt fails, assign default score of 50%
- **User Impact**: Delayed scoring; transparent retry

## Testing Strategy

Same as original design document - all testing strategies apply with Azure services:
- Unit tests for scoring algorithms
- Property-based tests for correctness properties
- Integration tests for Azure services (using Azure Storage Emulator, Cosmos DB Emulator)
- E2E tests for complete workflows

## Performance Optimization

### Caching Strategy

**1. Skill Embeddings Cache**
- **Location**: Azure Cosmos DB container `skillEmbeddingsCache`
- **Partition Key**: skill name (lowercase, trimmed)
- **Key**: skill name as document ID
- **Value**: 1536-dimension embedding vector array
- **TTL**: No expiration (embeddings don't change)
- **Pre-warming**: Cache top 100 common skills on initial deployment
- **Expected Hit Rate**: 70%+ after 100 applications

**2. Candidate Score Cache**
- Stored in candidate document in Cosmos DB
- Invalidation: Only when candidate data changes
- Benefit: Avoid re-calculating scores on dashboard reload

**3. Job Metadata Cache**
- **Location**: Client-side sessionStorage
- **Duration**: Session lifetime
- **Content**: Job title, required skills, experience level
- **Benefit**: Reduce Cosmos DB reads when navigating between views

### Async Processing

**1. AI Scoring Pipeline**
- **Trigger**: Azure Function with Cosmos DB trigger fires on candidate document creation
- **Execution**: Runs in background; candidate sees "Analyzing..." animation
- **Timeout**: 5 minutes max function execution
- **Benefit**: Application submission returns immediately; scoring doesn't block UI

**2. CV Text Extraction**
- **Trigger**: Azure Function with Blob trigger fires on CV upload
- **Execution**: Downloads blob, parses, extracts text, calls OpenAI
- **Timeout**: 10 minutes max
- **Benefit**: Upload returns immediately; parsing happens asynchronously

**3. Real-Time Updates via Change Feed**
- Cosmos DB Change Feed automatically triggers Azure Function
- Function broadcasts updates to SignalR
- No polling needed - completely event-driven
- Latency: < 1 second from database write to UI update

### Azure-Specific Optimizations

**1. Cosmos DB Partition Strategy**
- Jobs partitioned by `id` (each job is its own partition)
- Candidates partitioned by `jobId` (all candidates for a job in same partition)
- Enables efficient cross-partition queries avoided
- Read/write operations stay within single partition

**2. Cosmos DB Indexing**
- Automatic indexing on all properties
- Custom index for `status` and `scores.total` for dashboard queries
- Reduces RU consumption for common queries

**3. Blob Storage Tiers**
- Use **Hot tier** for recent CVs (last 30 days)
- Move to **Cool tier** after 30 days (automated lifecycle policy)
- Reduces storage costs for older jobs

**4. SignalR Connection Pooling**
- Single SignalR connection per client supports all listeners
- Supports 20 concurrent clients per job (free tier)
- Upgrade to Standard tier for 1000+ concurrent connections

### Expected Performance Metrics

| Metric | Target | Actual (Expected) |
|--------|--------|-------------------|
| Job posting save (Cosmos DB) | < 2 seconds | ~500ms |
| Application submission | < 3 seconds | ~1 second |
| AI match score calculation | < 5 seconds | ~3 seconds (with cache hits) |
| CV upload (5MB, Blob Storage) | < 10 seconds | ~5 seconds |
| Real-time update propagation (SignalR) | < 2 seconds | ~500ms |
| Dashboard load (50 candidates) | < 2 seconds | ~800ms |
| Per-candidate AI cost | < $0.002 | ~$0.0013 |

---

## Summary

The Aptus MVP Core design delivers a fast, cost-efficient, AI-powered recruitment platform using **Azure services** (Cosmos DB, Blob Storage, Functions, SignalR, Static Web Apps) as the backbone and OpenAI for intelligent candidate matching. The no-login approach with unique URLs minimizes friction, while real-time updates via SignalR and Cosmos DB Change Feed provide recruiters with instant visibility into new applications.

**Key Design Decisions:**
- **Azure Cosmos DB** for NoSQL database with Change Feed for real-time sync
- **Azure Blob Storage** for file storage with SAS tokens for secure access
- **Azure Functions** for serverless AI processing with automatic scaling
- **Azure SignalR Service** for real-time WebSocket communication
- **Azure Static Web Apps** for hosting with CDN and custom domains
- OpenAI GPT-3.5-turbo + embeddings for balance of quality and cost
- Client-side validation for fast feedback
- Async AI processing to avoid blocking user workflows
- Comprehensive caching to minimize API costs
- **All Azure services on free tier - zero upfront payment**

**Next Steps:**
1. Sign up for Azure (free tier or Azure for Students)
2. Enable services: Cosmos DB, Blob Storage, Functions, SignalR, Static Web Apps
3. Update spec documents with Azure architecture
4. Implement core components (Job Manager, AI Scoring Engine)
5. Write property-based tests for correctness properties
6. Integrate OpenAI API with rate limiting and caching
7. Deploy to Azure Static Web Apps for staging environment testing
