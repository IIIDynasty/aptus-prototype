# Aptus MVP - Azure Architecture & Technical Design

## Executive Summary
This document outlines the Azure-based technical architecture, AI strategy, cost analysis, and implementation roadmap for transforming Aptus from a prototype to a functional MVP. **This architecture uses Azure services (with 1-year free tier) instead of Firebase to eliminate upfront payment barriers.**

---

## Table of Contents
1. [Authentication Strategy](#1-authentication-strategy)
2. [AI Ranking System](#2-ai-ranking-system)
3. [Platform Partner Integration](#3-platform-partner-integration)
4. [Real-Time Updates](#4-real-time-updates)
5. [Tech Stack - Azure Architecture](#5-tech-stack---azure-architecture)
6. [Cost Analysis - Azure Free Tier](#6-cost-analysis---azure-free-tier)
7. [Implementation Phases](#7-implementation-phases)

---

## 1. Authentication Strategy

### Decision Point: Login or No Login?

#### Option A: No Login (Recommended for MVP v1.0)
**Pros:**
- ✅ Faster time to market
- ✅ Lower friction for recruiters to try
- ✅ Simpler architecture
- ✅ Focus on core AI value proposition
- ✅ No password management overhead

**Cons:**
- ❌ No data persistence across sessions
- ❌ No user history/analytics per recruiter
- ❌ Limited ability to track recruiter behavior

**How it works:**
1. Recruiter visits landing page → Gets started immediately
2. Creates job posting → Gets unique job link + admin dashboard link
3. Bookmark/save links to return later
4. Each job has unique URL: `aptus.io/jobs/{job-id}/admin`
5. Candidates apply via: `aptus.io/jobs/{job-id}/apply`

#### Option B: Email-Only Magic Link (Recommended for MVP v1.5)
**Implementation with Azure:**
- Use **Azure Active Directory B2C** for passwordless authentication
- Free tier: 50,000 monthly active users
- Email magic links with custom branding

#### Option C: Full Auth (Recommended for MVP v2.0+)
Full email/password or OAuth (Google, LinkedIn) using Azure AD B2C

### **RECOMMENDATION:**
**Start with Option A (No Login), plan for Option B in Phase 2**

---

## 2. AI Ranking System

### Core Question: What Data Do We Analyze?

#### Recommended Approach: **Hybrid Analysis**

**Data Sources (in order of importance):**

1. **Structured Form Data (70% weight)**
   - Years of experience
   - Skills (exact match + semantic similarity)
   - Education/qualifications
   - Current role/title
   - Measurable achievements (extracted metrics)

2. **CV/Resume Document (30% weight)**
   - Extract additional context
   - Verify claimed experience
   - Identify unlisted skills
   - Detect keywords from job description

### AI Ranking Algorithm

#### **Scoring Components (Total: 100%)**

```
TOTAL SCORE = Skills Match (40%) 
            + Experience Match (30%) 
            + Qualifications (20%) 
            + Application Quality (10%)
```

**Same algorithm as before - no changes needed for Azure migration**

### AI Model: OpenAI GPT-3.5-turbo + Embeddings

**Cost per candidate:**
- Embeddings for skills: $0.0001
- GPT-3.5 for quality check: $0.0002
- GPT-3.5 for CV parsing: $0.001
- **Total: ~$0.0013 per candidate**

**OpenAI integration remains unchanged** - Azure Functions will call OpenAI API

---

## 3. Platform Partner Integration

### Solution: **UTM-Based Tracking + Unique Job Links**

**Same as before** - no changes needed for Azure migration

Platform-specific URLs with source parameters:
```
https://aptus.io/jobs/abc123/apply?source=whatsapp-tech-professionals
```

---

## 4. Real-Time Updates

### Architecture: **Azure SignalR Service + Cosmos DB Change Feed**

#### **Azure Real-Time Solution**

**Azure SignalR Service:**
- ✅ Managed WebSocket service for real-time updates
- ✅ **Free tier: 20 concurrent connections, 20K messages/day**
- ✅ Automatic scaling
- ✅ Low latency

**Cosmos DB Change Feed:**
- ✅ Real-time stream of database changes
- ✅ Triggers Azure Functions automatically
- ✅ No polling needed - event-driven
- ✅ Guaranteed ordering

**How it works:**
```javascript
// 1. Candidate submits application
await cosmosClient.database('aptus').container('candidates').items.create(candidate);

// 2. Cosmos DB Change Feed triggers Azure Function
// 3. Azure Function broadcasts update via SignalR
await signalRConnection.send('newCandidate', candidateData);

// 4. Recruiter dashboard receives update instantly
connection.on('newCandidate', (data) => {
  updateCandidateTable(data);
  updateStatistics();
});
```

**Benefits over Firebase:**
- ✅ Works with Cosmos DB (better query capabilities)
- ✅ Free tier sufficient for MVP (20 concurrent connections)
- ✅ Can scale to thousands of connections later
- ✅ Native Azure integration

---

## 5. Tech Stack - Azure Architecture

### **Complete Azure Stack (All Free Tier)**

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
│                    Azure Services Layer                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐│
│  │          Azure Cosmos DB (Free Tier)                        ││
│  │  Database: aptus-mvp                                        ││
│  │  ├─ Container: jobs                                         ││
│  │  ├─ Container: candidates                                   ││
│  │  └─ Container: skillEmbeddingsCache                         ││
│  │  Free: 1000 RU/s + 25GB storage                            ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐│
│  │          Azure Blob Storage (Free Tier)                     ││
│  │  Container: cvs/{job-id}/{candidate-id}.{ext}              ││
│  │  Container: cover-letters/{job-id}/{candidate-id}.{ext}    ││
│  │  Free: 5GB storage + 20K operations                        ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐│
│  │          Azure Functions (Free Tier)                        ││
│  │  ├─ onCandidateCreated (Cosmos DB trigger)                 ││
│  │  ├─ processCVUpload (Blob trigger)                         ││
│  │  └─ calculateMatchScore (HTTP trigger)                     ││
│  │  Free: 1M executions/month                                 ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐│
│  │          Azure SignalR Service (Free Tier)                  ││
│  │  Real-time updates to recruiter dashboard                   ││
│  │  Free: 20 concurrent connections, 20K messages/day         ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐│
│  │          Azure Static Web Apps (Free Tier)                  ││
│  │  Hosting + CDN + Custom domains + SSL                       ││
│  │  Free: 100GB bandwidth/month                               ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services Layer                        │
│  ┌────────────────────────────────────────────────────────────┐│
│  │          OpenAI API                                         ││
│  │  ├─ text-embedding-3-small (semantic matching)             ││
│  │  └─ gpt-3.5-turbo (quality assessment, CV parsing)         ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### **Azure Services Breakdown**

#### 1. **Azure Cosmos DB (NoSQL Database)**
**Replaces:** Firebase Realtime Database

**Why Cosmos DB?**
- ✅ **Free tier: 1000 RU/s + 25GB storage** (enough for MVP)
- ✅ NoSQL document database (JSON-like structure)
- ✅ Change Feed for real-time updates
- ✅ Multi-region replication (South Africa datacenter available)
- ✅ Automatic indexing
- ✅ Low latency queries (<10ms)

**Data Structure:**
```javascript
// Jobs container
{
  "id": "JOB-2025-4582",
  "partitionKey": "JOB-2025-4582", // Same as id for now
  "title": "Senior Software Engineer",
  "location": "Lagos, Nigeria",
  "skills": ["Python", "Django"],
  "candidates": [], // Store candidate IDs, actual data in candidates container
  "statistics": {
    "applicantCount": 0,
    "shortlistedCount": 0
  }
}

// Candidates container
{
  "id": "CAND-abc123",
  "partitionKey": "JOB-2025-4582", // Partition by job ID
  "jobId": "JOB-2025-4582",
  "personalInfo": { ... },
  "scores": { ... },
  "status": "pending"
}
```

#### 2. **Azure Blob Storage (File Storage)**
**Replaces:** Firebase Storage

**Why Blob Storage?**
- ✅ **Free tier: 5GB + 20K read/write operations**
- ✅ Optimized for storing files (CVs, cover letters)
- ✅ SAS (Shared Access Signature) tokens for secure URLs with expiration
- ✅ Hot, Cool, Archive tiers (use Hot for active CVs)
- ✅ Integrated with Azure Functions triggers

**Container Structure:**
```
Storage Account: aptus-mvp-storage
├─ Container: cvs
│  └─ {job-id}/{candidate-id}.pdf
└─ Container: cover-letters
   └─ {job-id}/{candidate-id}.pdf
```

**Secure URL Generation:**
```javascript
const { BlobServiceClient, generateBlobSASQueryParameters } = require('@azure/storage-blob');

// Generate 7-day expiry URL
const sasToken = generateBlobSASQueryParameters({
  containerName: 'cvs',
  blobName: `${jobId}/${candidateId}.pdf`,
  permissions: 'r', // Read only
  expiresOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
}, storageAccountKey);

const secureUrl = `${blobUrl}?${sasToken}`;
```

#### 3. **Azure Functions (Serverless)**
**Replaces:** Firebase Functions

**Why Azure Functions?**
- ✅ **Free tier: 1 million executions/month**
- ✅ Multiple trigger types: HTTP, Cosmos DB, Blob Storage, Timer
- ✅ Node.js, Python, C# support
- ✅ Built-in environment variables for secrets (OpenAI API key)
- ✅ Scales automatically

**Key Functions:**

**a) onCandidateCreated (Cosmos DB Trigger):**
```javascript
module.exports = async function (context, documents) {
  for (const candidate of documents) {
    // Calculate AI match score
    const score = await calculateMatchScore(candidate);
    
    // Update candidate record
    await cosmosClient.database('aptus')
      .container('candidates')
      .item(candidate.id, candidate.jobId)
      .replace({ ...candidate, scores: score });
    
    // Broadcast to SignalR for real-time update
    await broadcastToRecruiters(candidate.jobId, candidate);
  }
};
```

**b) processCVUpload (Blob Storage Trigger):**
```javascript
module.exports = async function (context, blob) {
  // Extract text from PDF/DOCX
  const cvText = await parsePDF(blob);
  
  // Analyze with OpenAI
  const extractedData = await analyzeCV(cvText);
  
  // Update candidate record
  await updateCandidateWithCVData(extractedData);
};
```

**c) calculateMatchScore (HTTP Trigger):**
```javascript
module.exports = async function (context, req) {
  const { candidateId, jobId } = req.body;
  
  const candidate = await getCandidate(candidateId);
  const job = await getJob(jobId);
  
  const score = await calculateMatchScore(candidate, job);
  
  context.res = {
    body: { score }
  };
};
```

#### 4. **Azure SignalR Service (Real-Time)**
**Replaces:** Firebase Realtime Database (for real-time sync)

**Why SignalR?**
- ✅ **Free tier: 20 concurrent connections, 20K messages/day**
- ✅ WebSocket-based real-time communication
- ✅ Automatic reconnection
- ✅ Works with Azure Functions

**Client-Side Connection:**
```javascript
const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${functionAppUrl}/api`)
  .withAutomaticReconnect()
  .build();

await connection.start();

// Listen for new candidates
connection.on('newCandidate', (candidate) => {
  addCandidateToTable(candidate);
  updateStatistics();
});
```

**Server-Side (Azure Function):**
```javascript
const { SignalRClient } = require('@azure/web-pubsub');

module.exports = async function (context, candidate) {
  const client = new SignalRClient(connectionString);
  
  // Broadcast to all recruiters viewing this job
  await client.sendToGroup(`job-${candidate.jobId}`, 'newCandidate', candidate);
};
```

#### 5. **Azure Static Web Apps (Hosting)**
**Replaces:** Firebase Hosting

**Why Static Web Apps?**
- ✅ **Completely free** (no tier limits for basic features)
- ✅ Global CDN
- ✅ Custom domains + SSL
- ✅ GitHub/Azure DevOps integration for CI/CD
- ✅ URL rewrites for SPA routing
- ✅ 100GB bandwidth/month

**Configuration (`staticwebapp.config.json`):**
```json
{
  "routes": [
    {
      "route": "/jobs/:jobId/apply",
      "rewrite": "/index.html"
    },
    {
      "route": "/jobs/:jobId/admin",
      "rewrite": "/index.html"
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

---

## 6. Cost Analysis - Azure Free Tier

### Monthly Cost Breakdown (100 applications/month)

| Service | Free Tier Limit | Usage (100 apps) | Cost |
|---------|----------------|------------------|------|
| **Azure Cosmos DB** | 1000 RU/s, 25GB | ~200 RU/s, 1GB | **FREE** |
| **Azure Blob Storage** | 5GB, 20K ops | 500MB, 5K ops | **FREE** |
| **Azure Functions** | 1M executions | ~10K executions | **FREE** |
| **Azure SignalR** | 20 connections, 20K msgs | 5 connections, 5K msgs | **FREE** |
| **Static Web Apps** | 100GB bandwidth | 10GB bandwidth | **FREE** |
| **OpenAI API** | N/A | 100 candidates | **$0.13** |
| **TOTAL** | | | **$0.13/month** |

### Cost at Scale (1,000 applications/month)

| Service | Free Tier? | Usage (1K apps) | Cost |
|---------|-----------|-----------------|------|
| Azure Cosmos DB | ✅ FREE | ~500 RU/s, 5GB | **FREE** |
| Azure Blob Storage | ✅ FREE | 3GB, 15K ops | **FREE** |
| Azure Functions | ✅ FREE | ~100K executions | **FREE** |
| Azure SignalR | ⚠️ May exceed | 10 connections, 50K msgs | **$0-5** |
| Static Web Apps | ✅ FREE | 50GB bandwidth | **FREE** |
| OpenAI API | ❌ Paid | 1000 candidates | **$1.30** |
| **TOTAL** | | | **$1.30-6.30/month** |

### Cost at 10,000 applications/month

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| Azure Cosmos DB | 2000 RU/s, 20GB | **$24/month** |
| Azure Blob Storage | 15GB, 100K ops | **$1/month** |
| Azure Functions | 1M executions | **FREE** |
| Azure SignalR | Standard tier | **$50/month** |
| Static Web Apps | 100GB bandwidth | **FREE** |
| OpenAI API | 10K candidates | **$13/month** |
| **TOTAL** | | **$88/month** |

### **Key Takeaways:**
- ✅ **MVP is completely FREE** for first 1-2 months (100-500 apps/month)
- ✅ **1-year Azure free credits** cover scale-up costs
- ✅ **Only OpenAI costs money** (~$0.0013/candidate)
- ✅ **Much cheaper than Firebase** at scale (no $30 upfront)

---

## 7. Implementation Phases

### **Phase 1: Core MVP (Weeks 1-3)**

**Goal:** Functional job posting + AI ranking

**Features:**
- ✅ Recruiter creates job posting (Cosmos DB)
- ✅ Generates unique job link
- ✅ Candidate applies via form
- ✅ CV upload (Azure Blob Storage)
- ✅ AI calculates match score (Azure Functions + OpenAI)
- ✅ Ranked candidate list
- ✅ Shortlist/reject buttons
- ✅ Source tracking (UTM parameters)

**Tech:**
- Azure Cosmos DB
- Azure Blob Storage
- Azure Functions (AI processing)
- OpenAI API
- Current frontend

### **Phase 2: Real-Time + Analytics (Week 4)**

**Features:**
- ✅ Real-time applicant updates (Azure SignalR)
- ✅ Platform performance dashboard
- ✅ Email notifications (Azure Communication Services)
- ✅ Application status emails
- ✅ Export candidates to CSV

**Tech:**
- Azure SignalR Service
- Cosmos DB Change Feed
- Azure Communication Services (email)

### **Phase 3: Magic Link Auth (Week 5-6)**

**Features:**
- ✅ Recruiter enters email
- ✅ Magic link authentication (Azure AD B2C)
- ✅ View all job postings
- ✅ Historical data

**Tech:**
- Azure Active Directory B2C (free tier: 50K users)

### **Phase 4: Platform Partnerships (Week 7-8)**

**Features:**
- ✅ Partner dashboard
- ✅ Revenue tracking
- ✅ Automated payouts (manual for MVP)
- ✅ API for partners

### **Phase 5: Advanced Features (Week 9+)**

- LinkedIn API integration
- Interview scheduling
- Recruiter collaboration
- Advanced analytics

---

## Azure Setup Summary

### **Services to Enable (All Free Tier):**

1. **Azure Cosmos DB**
   - Create account (free tier)
   - Create database: `aptus-mvp`
   - Create containers: `jobs`, `candidates`, `skillEmbeddingsCache`

2. **Azure Blob Storage**
   - Create storage account (free tier)
   - Create containers: `cvs`, `cover-letters`
   - Set access level: Private (use SAS tokens)

3. **Azure Functions**
   - Create Function App (Consumption plan = free)
   - Set runtime: Node.js 18
   - Configure environment variables (OpenAI API key)

4. **Azure SignalR Service**
   - Create SignalR resource (free tier)
   - Get connection string
   - Add to Function App settings

5. **Azure Static Web Apps**
   - Create Static Web App
   - Connect to GitHub repo
   - Deploy automatically on push

### **Estimated Setup Time:** 1-2 hours

---

## Key Decisions Summary

### ✅ **RECOMMENDED DECISIONS:**

1. **Cloud Provider:** **Azure** (1-year free tier, no upfront payment)
2. **Database:** **Azure Cosmos DB** (NoSQL, change feed, free tier)
3. **File Storage:** **Azure Blob Storage** (free tier, SAS tokens)
4. **Serverless:** **Azure Functions** (1M free executions)
5. **Real-Time:** **Azure SignalR Service** (free tier sufficient)
6. **Hosting:** **Azure Static Web Apps** (completely free)
7. **Authentication:** Start with NO LOGIN, add Azure AD B2C in Phase 2
8. **AI Provider:** **OpenAI GPT-3.5-turbo + Embeddings** (unchanged)
9. **Platform Tracking:** UTM parameters + unique links (unchanged)
10. **Job Distribution:** Manual posting initially (unchanged)

### 💰 **Cost Efficiency:**
- **FREE** for MVP (0-500 applications/month)
- ~$1.30/month for 1,000 applications (just OpenAI)
- ~$88/month for 10,000 applications
- **No upfront payment required**
- **1-year Azure free credits** cover scale-up

### 🌍 **Better for Africa:**
- Azure has **South Africa** data centers (lower latency)
- Better network connectivity to Nigeria
- Local support and compliance

### 🚀 **Implementation:**
- Start with Phase 1 (Core MVP) - 3 weeks
- Add real-time in Phase 2 - 1 week
- Iterate based on feedback

---

## Migration from Firebase (if needed later)

If you later want to migrate to Firebase:
- Cosmos DB → Firebase Realtime Database (export JSON)
- Blob Storage → Firebase Storage (copy blobs)
- Azure Functions → Firebase Functions (port JavaScript)
- SignalR → Firebase Realtime sync (change client code)

**Migration difficulty:** Medium (2-3 days of work)

---

## Next Steps

1. ✅ **Sign up for Azure** (if not already done)
2. ✅ **Activate Azure for Students** (or free trial)
3. ✅ **Enable services**: Cosmos DB, Blob Storage, Functions, SignalR, Static Web Apps
4. ✅ **Get OpenAI API key** (separate from Azure)
5. ✅ **Update spec documents** to reflect Azure architecture
6. ✅ **Start implementation** with Task 1 (Azure setup)

Let me know when you're ready and I'll update all the spec documents! 🎯
