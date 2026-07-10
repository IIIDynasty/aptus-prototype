# Aptus MVP Core - Design Document

## Overview

The Aptus MVP Core is an AI-powered recruitment platform that helps Northern Nigerian recruiters identify qualified candidates faster through intelligent matching, community-based sourcing, and real-time candidate updates. The system employs a no-login approach using unique URLs for MVP v1.0, Firebase for backend infrastructure, and OpenAI for AI-powered candidate scoring.

### Key Design Principles

- **Speed-to-Value**: No authentication barriers for initial use; recruiters can post jobs and receive applications immediately
- **AI-First Matching**: Leverage OpenAI embeddings and GPT-3.5-turbo to provide semantic skills matching and quality assessment
- **Real-Time Experience**: Firebase Realtime Database ensures recruiters see new applications instantly
- **Cost-Efficient AI**: Optimize token usage and cache embeddings to keep per-candidate costs under $0.002
- **Data Privacy**: Implement security rules and access controls to protect candidate information

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
│                    Firebase Services Layer                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Firebase Realtime Database                       │  │
│  │  /jobs/{job-id}/                                         │  │
│  │    ├─ metadata (title, location, skills, etc.)          │  │
│  │    ├─ candidates/{candidate-id}/                        │  │
│  │    │    ├─ personalInfo                                 │  │
│  │    │    ├─ scores                                       │  │
│  │    │    ├─ status                                       │  │
│  │    └─ statistics (applicantCount, shortlistedCount)     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Firebase Storage                                 │  │
│  │  /cvs/{job-id}/{candidate-id}.{ext}                     │  │
│  │  /cover-letters/{job-id}/{candidate-id}.{ext}           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Firebase Functions (Serverless)                  │  │
│  │  ├─ onCandidateCreated (AI scoring trigger)             │  │
│  │  ├─ processCVUpload (text extraction trigger)           │  │
│  │  └─ calculateMatchScore (HTTP callable)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Firebase Hosting                                 │  │
│  │  (Static files: index.html, style.css, app.js)          │  │
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
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Email Service (SendGrid / Firebase Email)        │  │
│  │  (Rejection notifications to candidates)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

The system consists of three primary frontend components and a serverless backend:

**Frontend Components:**
1. **Landing Page**: Role selection interface (recruiter vs candidate)
2. **Recruiter Dashboard**: Job management, candidate rankings, analytics
3. **Candidate Application**: Form submission, file upload, match result display

**Backend Services:**
1. **Firebase Realtime Database**: JSON tree structure with real-time sync
2. **Firebase Functions**: Event-driven serverless functions for AI processing
3. **Firebase Storage**: Blob storage for CV and cover letter files
4. **Firebase Hosting**: Static file serving with CDN

## Components and Interfaces

### 1. Job Posting Manager

**Responsibility**: Handle job creation, validation, and link generation

**Interface:**
```javascript
// JobPosting data structure
interface JobPosting {
  id: string;              // Format: JOB-{YEAR}-{4-digit-random}
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
  applicantCount: number;
  shortlistedCount: number;
  avgMatchScore: number;
}

// Public methods
function createJobPosting(jobData: Partial<JobPosting>): Promise<JobPosting>
function generateJobLinks(jobId: string): { applicationLink: string, adminLink: string }
function validateJobData(jobData: Partial<JobPosting>): ValidationResult
```

**Key Behaviors:**
- Validates all required fields before saving to database
- Generates unique Job_ID using year prefix and random 4-digit suffix
- Creates both public application link and private admin link
- Stores skills as array for efficient matching operations

### 2. Candidate Application Processor

**Responsibility**: Process candidate submissions, manage file uploads, trigger AI scoring

**Interface:**
```javascript
// Application data structure
interface CandidateApplication {
  id: string;
  jobId: string;
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
    cvUrl?: string;
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
- Enforces required field validation before database write
- Uploads files to Firebase Storage with path pattern: `cvs/{job-id}/{candidate-id}.{ext}`
- Captures source parameter from URL query string for platform tracking
- Triggers Firebase Function for AI scoring upon successful save
- Returns candidate ID for subsequent updates

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
function extractTextFromPDF(fileUrl: string): Promise<string>
function extractTextFromDOCX(fileUrl: string): Promise<string>
function parseCVWithAI(cvText: string, jobSkills: string[]): Promise<ParsedCV>
```

**Key Behaviors:**
- Uses `pdf-parse` library for PDF text extraction
- Uses `mammoth` library for DOCX text extraction
- Sends extracted text (max 8000 characters) to OpenAI GPT-3.5-turbo
- AI prompt requests structured extraction: skills, certifications, education, achievements
- Merges CV-extracted skills with form-submitted skills (deduplication)
- Adjusts qualifications score up to +10 points if CV confirms unlisted credentials
- Handles errors gracefully: logs failure, continues with form-based scoring

### 5. Real-Time Update Manager

**Responsibility**: Manage Firebase Realtime Database listeners and UI synchronization

**Interface:**
```javascript
// Public methods
function attachJobListener(jobId: string, callback: (snapshot: DataSnapshot) => void): void
function detachJobListener(jobId: string): void
function updateCandidateStatus(jobId: string, candidateId: string, status: string): Promise<void>
function incrementApplicantCount(jobId: string): Promise<void>
```

**Key Behaviors:**
- Establishes Firebase listener on `jobs/{job-id}/candidates` path
- Triggers callback with new data within 2 seconds of database change
- Supports up to 100 concurrent recruiter connections per job
- Automatically reconnects if connection drops
- Updates dashboard statistics counters in real-time

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

## Data Models

### Firebase Realtime Database Schema

```json
{
  "jobs": {
    "{job-id}": {
      "metadata": {
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
        "selectedCommunities": ["whatsapp-tech-professionals", "telegram-nigerian-devs"]
      },
      "candidates": {
        "{candidate-id}": {
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
            "cvUrl": "https://storage.googleapis.com/.../cv.pdf",
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
      },
      "statistics": {
        "applicantCount": 18,
        "shortlistedCount": 5,
        "rejectedCount": 2,
        "avgMatchScore": 74
      }
    }
  },
  "skillEmbeddingsCache": {
    "python": [0.023, -0.145, 0.678, ...],
    "javascript": [0.112, 0.034, -0.456, ...]
  }
}
```

### Firebase Storage Structure

```
/cvs/
  /{job-id}/
    /{candidate-id}.pdf
    /{candidate-id}.docx

/cover-letters/
  /{job-id}/
    /{candidate-id}.pdf
    /{candidate-id}.docx
```

**Access Control:**
- CV and cover letter URLs are signed with 7-day expiration
- Only recruiters accessing admin dashboard can retrieve download URLs
- Public application links cannot access file storage

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing correctness properties, I will analyze the acceptance criteria to determine which are testable as properties using the prework tool.



### Property Reflection

After analyzing all acceptance criteria, I've identified the following properties. Let me review for redundancy:

**Candidate Properties:**
- Property on job posting validation (1.2) and application validation (2.2) are both about input validation but for different data types - KEEP BOTH
- Property on link format generation (1.3) and source parameter links (9.1) both test link generation but different aspects - KEEP BOTH  
- Property on storage path format (2.3) is unique - KEEP
- Properties on score calculation (3.2, 3.3) test different aspects of scoring - KEEP BOTH
- Property on cosine similarity (4.2) and threshold (4.3) could be combined into one comprehensive property - COMBINE
- Property on sorting (6.1) and rank badge assignment (6.2) are related but test different outputs - KEEP BOTH
- Property on URL source extraction (9.2) is unique - KEEP
- Property on file validation (10.1) is unique - KEEP
- Property on skill merging (11.2) and deduplication is unique - KEEP
- Property on text truncation (11.3) is unique - KEEP
- Property on mean calculation (12.1) is unique - KEEP
- Property on autocomplete filtering (16.1) is unique - KEEP
- Property on caching (17.1) is unique - KEEP
- Property on job formatting round-trip (22.1) and serialization round-trip (23.1, 23.2) all test round-trips but 22.1 is for formatted text while 23.1/23.2 are for JSON - 23.1 and 23.2 are redundant - COMBINE
- Property on state transitions (24.1) is unique - KEEP
- Property on data privacy (25.1) is unique - KEEP

**Consolidated List:** 20 unique properties after combining redundant ones

### Correctness Properties

### Property 1: Job Posting Validation Rejects Invalid Submissions

*For any* job posting data, if required fields (title, location, experience level, description, skills) are missing or invalid, the system SHALL reject the submission before database write.

**Validates: Requirements 1.2**

### Property 2: Job Link Generation Format

*For any* valid Job_ID, the generated Application_Link SHALL match the format "aptus.io/jobs/{job-id}/apply" and Admin_Link SHALL match "aptus.io/jobs/{job-id}/admin".

**Validates: Requirements 1.3**

### Property 3: CV Storage Path Format

*For any* CV upload with job-id and candidate-id, the Firebase Storage path SHALL follow the pattern "cvs/{job-id}/{candidate-id}.{extension}".

**Validates: Requirements 2.3**

### Property 4: Candidate Application Validation

*For any* candidate application data, if required fields (full name, email, years of experience, at least one skill, achievements summary) are missing or invalid, the system SHALL reject the submission.

**Validates: Requirements 2.2**

### Property 5: Skills Match Score Calculation

*For any* candidate skill set and job required skill set, the skills match score SHALL be calculated as: `(exactMatches * 0.5 + semanticMatches * 0.5) / totalRequiredSkills * 100` where exactMatches are case-insensitive string matches and semanticMatches have cosine similarity ≥ 0.75.

**Validates: Requirements 3.2**

### Property 6: Weighted Score Calculation

*For any* set of component scores (skills, experience, qualifications, applicationQuality), the total match score SHALL equal `round(skills * 0.4 + experience * 0.3 + qualifications * 0.2 + applicationQuality * 0.1)`.

**Validates: Requirements 3.3**

### Property 7: Semantic Similarity Threshold and Calculation

*For any* two skill embedding vectors, the cosine similarity SHALL be calculated as `dot(v1, v2) / (||v1|| * ||v2||)`, and skills SHALL be considered semantically matched if and only if the similarity is ≥ 0.75.

**Validates: Requirements 4.2, 4.3**

### Property 8: Candidate Ranking Sort Order

*For any* list of candidates with match scores, when displayed in the ranking table, candidates SHALL be sorted in descending order by total match score (highest first).

**Validates: Requirements 6.1**

### Property 9: Rank Badge Assignment

*For any* candidate position in a sorted ranking list, the rank badge SHALL be: rank 1 (gold), rank 2 (silver), rank 3 (bronze), rank ≥ 4 (gray).

**Validates: Requirements 6.2**

### Property 10: Platform Source Link Generation

*For any* selected distribution platform identifiers, generated Application_Links SHALL include source parameter in format "?source={platform-identifier}" where platform-identifier matches the selected platform's ID.

**Validates: Requirements 9.1**

### Property 11: URL Source Parameter Extraction

*For any* URL containing a query parameter "source={value}", the system SHALL extract and store the value as the application source; if no source parameter exists, SHALL store "direct".

**Validates: Requirements 9.2**

### Property 12: File Upload Validation

*For any* uploaded file, the system SHALL accept the file if and only if: (1) the file format is PDF or DOCX, AND (2) the file size is ≤ 5MB.

**Validates: Requirements 10.1**

### Property 13: Skill List Deduplication

*For any* two skill lists (CV-extracted and form-submitted), merging SHALL produce a single list containing all unique skills with case-insensitive deduplication (e.g., "Python" and "python" → "Python").

**Validates: Requirements 11.2**

### Property 14: Text Truncation at 8000 Characters

*For any* extracted CV text, if the text length exceeds 8000 characters, the system SHALL truncate to exactly the first 8000 characters before sending to OpenAI API; otherwise, SHALL send the complete text.

**Validates: Requirements 11.3**

### Property 15: Average Match Score Calculation

*For any* list of candidate match scores, the average match score SHALL equal `round(sum(scores) / count(scores))` rounded to the nearest integer.

**Validates: Requirements 12.1**

### Property 16: Location Autocomplete Filtering

*For any* input string in the location field, the filtered suggestions SHALL include only Northern Nigerian state names that contain the input string as a case-insensitive substring.

**Validates: Requirements 16.1**

### Property 17: Embedding Cache Hit Behavior

*For any* skill that has been embedded previously, requesting embeddings SHALL retrieve from cache without calling OpenAI API; for new skills, SHALL call API and cache the result.

**Validates: Requirements 17.1**

### Property 18: Job Data Serialization Round-Trip

*For any* valid Job_Posting object J, the operation `deserialize(serialize(J))` SHALL produce an object equal to J for all required and optional fields, preserving types and array order.

**Validates: Requirements 23.1, 23.2**

### Property 19: Candidate Status Transition Validation

*For any* candidate with current status S and requested new status T, the transition SHALL be allowed if and only if: (S = "pending" AND T ∈ {"shortlisted", "rejected"}) OR (S = "shortlisted" AND T = "rejected") OR (S = "rejected" AND T = "shortlisted").

**Validates: Requirements 24.1**

### Property 20: Sensitive Data Exclusion from Public API

*For any* candidate record accessed via public Application_Link API endpoint, the response SHALL NOT include email, phone, linkedIn, cvUrl, or coverLetterUrl fields; only non-sensitive profile data SHALL be included.

**Validates: Requirements 25.1**

## Error Handling

### Error Categories and Recovery Strategies

**1. OpenAI API Failures**
- **Scenario**: API timeout, rate limiting, service unavailable
- **Detection**: HTTP status codes 429, 500, 503, or request timeout > 30 seconds
- **Recovery**: 
  - Retry once after 2-second delay
  - If second attempt fails, assign default match score of 50%
  - Log error with candidate ID, timestamp, and error message
  - Continue workflow without blocking application submission
- **User Impact**: Candidate sees "Score pending" message; recruiter sees candidate with 50% score flagged for review

**2. CV Parsing Failures**
- **Scenario**: PDF encrypted, corrupted file, unsupported format, parsing library failure
- **Detection**: pdf-parse or mammoth throws exception, extraction returns empty string
- **Recovery**:
  - Log parsing error with file metadata
  - Mark CV as "text extraction failed" in database
  - Continue scoring using only form-submitted data
  - Display message to candidate: "CV uploaded successfully, but text extraction failed. Your form data will be used for scoring."
- **User Impact**: Scoring proceeds with form data only; CV available for manual recruiter review

**3. Firebase Realtime Database Connection Loss**
- **Scenario**: Network interruption, Firebase service degradation
- **Detection**: Firebase SDK emits `disconnected` event
- **Recovery**:
  - Automatically reconnect within 5 seconds using Firebase built-in retry
  - Re-synchronize data snapshot after reconnection
  - Display "Reconnecting..." indicator in UI
- **User Impact**: Brief UI freeze; automatic recovery without data loss

**4. Firebase Storage Upload Failure**
- **Scenario**: Network timeout, quota exceeded, permission denied
- **Detection**: Upload promise rejects or progress stalls > 30 seconds
- **Recovery**:
  - Display error: "CV upload failed. Please try again."
  - Allow user to retry upload without losing form data
  - Do not proceed to scoring until upload succeeds or user skips CV
- **User Impact**: User must retry upload or continue without CV

**5. Input Validation Errors**
- **Scenario**: Missing required fields, invalid email format, file too large
- **Detection**: Client-side validation before submission
- **Recovery**:
  - Highlight invalid fields with red border
  - Display field-specific error messages (e.g., "Email address is required")
  - Prevent form submission until all errors resolved
- **User Impact**: Immediate feedback; user corrects errors before submission

**6. Rate Limiting (OpenAI API)**
- **Scenario**: Too many concurrent requests exceed OpenAI rate limits
- **Detection**: HTTP 429 response from OpenAI
- **Recovery**:
  - Queue scoring requests using Firebase Functions task queue
  - Process with exponential backoff: 2s, 4s, 8s delays
  - Display "Processing applications..." status to recruiters
- **User Impact**: Slightly delayed scoring (seconds to minutes); transparent queuing

### Graceful Degradation Strategies

**Scenario 1: OpenAI Service Extended Outage**
- **Fallback**: Use rule-based scoring without AI
  - Skills match: exact string matching only (no semantic matching)
  - Application quality: regex-based metric detection (presence of numbers)
  - Display warning badge: "Limited scoring mode active"
- **Recovery**: When OpenAI service restored, re-score pending applications asynchronously

**Scenario 2: Firebase Functions Cold Start Delays**
- **Mitigation**: Keep functions warm with scheduled pings every 5 minutes
- **Fallback**: If function exceeds 10-second response time, display "Scoring in progress..." and poll for updates every 3 seconds
- **User Impact**: Slightly longer wait for match result; transparent progress indication

**Scenario 3: Embedding Cache Miss Storm**
- **Scenario**: New job with many unique skills causes many OpenAI API calls
- **Mitigation**: 
  - Pre-warm cache with common skills (Python, JavaScript, SQL, etc.)
  - Batch embedding requests up to 10 skills per API call
  - Rate limit to 20 requests per minute
- **User Impact**: First few applications may take 10-15 seconds to score; subsequent applications fast

## Testing Strategy

### Unit Testing

**Purpose**: Verify individual functions and components in isolation

**Focus Areas:**
1. **Input Validation Logic**
   - Test job posting validation with various missing fields
   - Test candidate application validation with edge cases (empty strings, whitespace-only)
   - Test file validation with boundary cases (exactly 5MB, 5MB + 1 byte)

2. **Score Calculation Functions**
   - Test experience match scoring with all level tiers
   - Test weighted sum calculation with known inputs
   - Test qualifications keyword detection with various formats

3. **Data Transformation**
   - Test skill deduplication with case variations
   - Test text truncation at exact 8000-character boundary
   - Test URL source parameter extraction with malformed URLs

4. **State Management**
   - Test status transition validation with all valid/invalid combinations
   - Test status history append behavior

**Unit Test Framework**: Jest (for JavaScript)

**Example Unit Test:**
```javascript
describe('calculateWeightedScore', () => {
  it('should correctly weight components', () => {
    const scores = { skills: 80, experience: 70, qualifications: 60, applicationQuality: 50 };
    const result = calculateWeightedScore(scores);
    // 80*0.4 + 70*0.3 + 60*0.2 + 50*0.1 = 32 + 21 + 12 + 5 = 70
    expect(result).toBe(70);
  });
});
```

### Property-Based Testing

**Purpose**: Verify correctness properties hold across wide range of generated inputs

**Property-Based Testing Library**: fast-check (for JavaScript)

**Configuration**: Minimum 100 iterations per property test

**Properties to Test** (see Correctness Properties section above):

1. **Property 1: Job Posting Validation** - Generate random job objects with missing fields
2. **Property 2: Job Link Generation** - Generate random job IDs, verify format
3. **Property 4: Application Validation** - Generate random application objects
4. **Property 5: Skills Match Calculation** - Generate random skill combinations
5. **Property 6: Weighted Score Calculation** - Generate random component scores
6. **Property 7: Cosine Similarity** - Generate random vectors
7. **Property 8: Ranking Sort Order** - Generate random candidate lists
8. **Property 12: File Validation** - Generate files with random sizes/formats
9. **Property 13: Skill Deduplication** - Generate skill lists with duplicates
10. **Property 14: Text Truncation** - Generate texts of random lengths
11. **Property 15: Average Calculation** - Generate random score arrays
12. **Property 18: Serialization Round-Trip** - Generate random job objects
13. **Property 19: Status Transitions** - Generate random status pairs
14. **Property 20: Data Privacy** - Generate random candidate records

**Example Property Test:**
```javascript
// Feature: aptus-mvp-core, Property 6: Weighted score calculation
describe('Property: Weighted Score Calculation', () => {
  it('should correctly calculate weighted sum for any component scores', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // skills
        fc.integer({ min: 0, max: 100 }), // experience
        fc.integer({ min: 0, max: 100 }), // qualifications
        fc.integer({ min: 0, max: 100 }), // applicationQuality
        (skills, exp, quals, appQuality) => {
          const expected = Math.round(skills * 0.4 + exp * 0.3 + quals * 0.2 + appQuality * 0.1);
          const actual = calculateWeightedScore({ skills, experience: exp, qualifications: quals, applicationQuality: appQuality });
          return actual === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Purpose**: Verify interactions with external services and infrastructure

**Focus Areas:**

1. **Firebase Realtime Database**
   - Test job posting save and retrieve
   - Test candidate application save
   - Test real-time listener triggers on data change
   - Test concurrent write conflict resolution

2. **Firebase Storage**
   - Test CV upload and download URL generation
   - Test signed URL expiration (7 days)
   - Test file access permissions (public vs private)

3. **OpenAI API Integration**
   - Test embedding generation for sample skills
   - Test GPT-3.5-turbo quality assessment
   - Test retry behavior on 429 rate limit
   - Test error handling on 500 server error

4. **Firebase Functions Triggers**
   - Test `onCandidateCreated` function fires on database write
   - Test `processCVUpload` function fires on storage upload
   - Test function execution timeout (< 60 seconds)

**Integration Test Approach**:
- Use Firebase Emulator Suite for local testing
- Mock OpenAI API calls using `nock` library for predictable responses
- Test with realistic data sizes (CVs up to 5MB, text up to 8000 chars)

**Example Integration Test:**
```javascript
describe('Firebase Integration: Job Posting', () => {
  it('should save job to Realtime Database and retrieve', async () => {
    const job = createTestJobPosting();
    const jobId = await saveJobPosting(job);
    
    const retrieved = await getJobPosting(jobId);
    expect(retrieved).toEqual(expect.objectContaining(job));
  });
});
```

### End-to-End Testing

**Purpose**: Verify complete user workflows from browser to backend

**Scenarios:**
1. **Recruiter: Create Job and View Applicants**
   - Navigate to dashboard → Post job → Fill form → Submit
   - Verify job appears in job list
   - Navigate to rankings → Verify empty state

2. **Candidate: Apply and See Match Score**
   - Access application link → Fill form → Upload CV → Submit
   - Verify processing animation displays
   - Verify match score displays within 10 seconds
   - Verify match breakdown shows four components

3. **Recruiter: Real-Time Application Notification**
   - Open admin dashboard (recruiter)
   - Submit application (candidate in different browser)
   - Verify new candidate appears in recruiter's table within 2 seconds
   - Verify applicant count increments

4. **Recruiter: Shortlist and Reject**
   - View candidate rankings
   - Click "Shortlist" → Verify status updates
   - Click "Reject" → Verify modal → Confirm → Verify status updates

**E2E Test Framework**: Playwright (for browser automation)

**Configuration**: Run against Firebase Emulator Suite + Mocked OpenAI API

### Performance Testing

**Objectives:**
1. Verify Firebase Realtime Database supports 100 concurrent connections
2. Verify AI scoring completes within 5 seconds for 95th percentile
3. Verify CV upload completes within 10 seconds for 5MB files
4. Verify dashboard loads with 50 candidates within 2 seconds

**Load Testing Approach**:
- Use Artillery or k6 for load generation
- Simulate 100 concurrent recruiters viewing dashboard
- Simulate 500 candidates applying simultaneously
- Monitor Firebase quota usage and OpenAI token consumption

### Cost Monitoring Tests

**Purpose**: Ensure AI costs remain within expected bounds

**Test Cases:**
1. Verify per-candidate OpenAI cost < $0.002
2. Verify embedding cache hit rate > 70% after 100 applications
3. Verify token usage for quality assessment < 120 tokens per candidate
4. Monitor monthly Firebase function execution costs

**Implementation**: Add logging to track OpenAI API calls and token usage; create dashboard to visualize costs over time

## Performance Optimization

### Caching Strategy

**1. Skill Embeddings Cache**
- **Location**: Firebase Realtime Database at `/skillEmbeddingsCache/{skill}`
- **Key**: Lowercase, trimmed skill name
- **Value**: 1536-dimension embedding vector array
- **TTL**: No expiration (embeddings don't change)
- **Pre-warming**: Cache top 100 common skills on initial deployment
- **Expected Hit Rate**: 70%+ after 100 applications

**2. Candidate Score Cache**
- **Location**: Stored in candidate record under `/scores`
- **Invalidation**: Only when candidate data changes (status updates don't trigger re-scoring)
- **Benefit**: Avoid re-calculating scores when recruiter re-opens dashboard

**3. Job Metadata Cache**
- **Location**: Client-side sessionStorage
- **Duration**: Session lifetime
- **Content**: Job title, required skills, experience level
- **Benefit**: Reduce Firebase reads when navigating between views

### Async Processing

**1. AI Scoring Pipeline**
- **Trigger**: Firebase Function `onCandidateCreated` fires on database write
- **Execution**: Runs in background; candidate sees "Analyzing..." animation
- **Timeout**: 60 seconds max function execution
- **Benefit**: Application submission returns immediately; scoring doesn't block UI

**2. CV Text Extraction**
- **Trigger**: Firebase Function `processCVUpload` fires on storage upload
- **Execution**: Downloads file, parses, extracts text, calls OpenAI
- **Timeout**: 90 seconds max
- **Benefit**: Upload returns immediately; parsing happens asynchronously

**3. Bulk Email Notifications**
- **Implementation**: Queue rejection emails in Firestore collection
- **Processing**: Background function processes queue every 5 minutes
- **Benefit**: UI responds immediately; emails sent asynchronously

### Real-Time Efficiency

**1. Selective Field Sync**
- Only sync changed fields using Firebase's delta updates
- Avoid syncing entire candidate records on status update
- Reduce bandwidth by 60% for status-only updates

**2. Connection Pooling**
- Firebase SDK automatically manages WebSocket connections
- Single connection per client supports all listeners
- Supports 100 concurrent clients per job without connection exhaustion

**3. Listener Optimization**
- Attach listeners to `/jobs/{job-id}/candidates` not root `/jobs`
- Use `.orderByChild('scores/total')` for pre-sorted data from Firebase
- Reduce client-side sorting computation

### Data Size Optimization

**1. Truncate CV Text**
- Limit to 8000 characters before sending to OpenAI
- Reduce token costs by 50% for lengthy CVs
- No meaningful accuracy loss (first 8000 chars contain key info)

**2. Compress Embeddings**
- Store embeddings as Float32Array instead of standard JavaScript arrays
- Reduce storage size by 50%

**3. Lazy Load Candidate Details**
- Initial ranking table loads only: name, role, years, score
- Load full application (achievements, CV URL) only when recruiter clicks candidate
- Reduce initial Firebase read size by 70%

### OpenAI API Optimization

**1. Batch Embedding Requests**
- Send up to 10 skills per embedding API call instead of individual calls
- Reduce API calls by 10x for jobs with many required skills

**2. Minimize Prompt Tokens**
- Keep GPT-3.5-turbo prompts under 100 tokens
- Use concise system messages
- Limit candidate summary to 500 characters in prompts

**3. Use GPT-3.5-turbo Instead of GPT-4**
- Cost: $0.0005 per 1K tokens vs $0.03 per 1K tokens (60x cheaper)
- Speed: ~2 seconds response time vs ~5 seconds
- Accuracy: Sufficient for quality assessment task

### Expected Performance Metrics

| Metric | Target | Actual (Expected) |
|--------|--------|-------------------|
| Job posting save | < 2 seconds | ~1 second |
| Application submission | < 3 seconds | ~1.5 seconds |
| AI match score calculation | < 5 seconds | ~3 seconds (with cache hits) |
| CV upload (5MB) | < 10 seconds | ~7 seconds |
| Real-time update propagation | < 2 seconds | ~500ms |
| Dashboard load (50 candidates) | < 2 seconds | ~1 second |
| Per-candidate AI cost | < $0.002 | ~$0.0013 |

---

## Summary

The Aptus MVP Core design delivers a fast, cost-efficient, AI-powered recruitment platform using Firebase as the backbone and OpenAI for intelligent candidate matching. The no-login approach with unique URLs minimizes friction, while real-time updates provide recruiters with instant visibility into new applications. Property-based testing ensures correctness across edge cases, and robust error handling with graceful degradation maintains system resilience.

**Key Design Decisions:**
- Firebase Realtime Database for zero-configuration real-time sync
- OpenAI GPT-3.5-turbo + embeddings for balance of quality and cost
- Serverless Firebase Functions for automatic scaling
- Client-side validation for fast feedback
- Async AI processing to avoid blocking user workflows
- Comprehensive caching to minimize API costs

**Next Steps:**
1. Review and approve design with stakeholders
2. Set up Firebase project and configure security rules
3. Implement core components (Job Manager, AI Scoring Engine)
4. Write property-based tests for correctness properties
5. Integrate OpenAI API with rate limiting and caching
6. Deploy to Firebase Hosting for staging environment testing
