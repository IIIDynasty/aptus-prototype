# Implementation Plan: Aptus MVP Core

## Overview

This implementation plan breaks down the Aptus MVP into discrete coding tasks. The platform uses **Azure services** (Cosmos DB, Blob Storage, Functions, SignalR, Static Web Apps) for backend infrastructure and OpenAI (GPT-3.5-turbo and text-embedding-3-small) for AI-powered candidate scoring. The frontend is vanilla HTML/CSS/JavaScript with real-time synchronization via Azure SignalR Service. Each task builds incrementally, ensuring integrated functionality at every step. **All Azure services use the free tier, eliminating upfront payment barriers.**

## Tasks

- [x] 1. Set up Azure project and core infrastructure
  - Create Azure account and activate free tier or Azure for Students
  - Create Azure Cosmos DB account (free tier: 1000 RU/s + 25GB storage)
  - Create database `aptus-mvp` with three containers: `jobs` (partition key: `/id`), `candidates` (partition key: `/jobId`), `skillEmbeddingsCache` (partition key: `/skill`)
  - Create Azure Blob Storage account (free tier: 5GB + 20K operations)
  - Create containers in Blob Storage: `cvs`, `cover-letters` with private access level
  - Create Azure Functions app (Consumption plan, Node.js 18 runtime)
  - Create Azure SignalR Service resource (free tier: 20 concurrent connections)
  - Create Azure Static Web Apps resource for hosting
  - Install Azure SDKs: `@azure/cosmos`, `@azure/storage-blob`, `@azure/functions`, `@azure/web-pubsub-express`
  - Create `azure-config.js` with connection strings and endpoints (use environment variables)
  - _Requirements: 1.1, 2.4, 10.4_

- [x] 2. Implement Azure access control and security
  - [x] 2.1 Configure Cosmos DB access policies
    - Set up container-level access policies for `jobs` container (allow read for application link, write for admin operations)
    - Set up container-level access policies for `candidates` container with partition-scoped queries (privacy: no cross-partition queries)
    - Configure index policies for efficient queries on `status` and `scores.total` fields
    - Enable Cosmos DB firewall rules to restrict access to Azure Functions and Static Web Apps
    - _Requirements: 25.1, 25.2, 25.6_
  
  - [x] 2.2 Configure Blob Storage SAS token security
    - Implement function to generate SAS tokens for CV and cover letter blobs with 7-day expiration
    - Set SAS token permissions to read-only (`r` permission)
    - Configure blob-level access (not container-level) to prevent listing all files
    - Store connection string in Azure Function environment variables (never in client code)
    - _Requirements: 10.6, 25.3_

- [x] 3. Implement Job Posting Manager module
  - [x] 3.1 Create JobPosting data model and validation
    - Define `JobPosting` interface with all required fields (id, title, department, location, experienceLevel, description, skills, qualifications)
    - Implement `validateJobData()` function with field-specific validation rules
    - Implement `generateJobId()` function in format "JOB-{YEAR}-{4-digit-random}"
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 3.2 Write property test for job posting validation
    - **Property 1: Job Posting Validation Rejects Invalid Submissions**
    - **Validates: Requirements 1.2**
  
  - [x] 3.3 Implement job creation and link generation
    - Implement `createJobPosting()` function that validates data, generates ID, saves to Azure Cosmos DB using `@azure/cosmos` SDK
    - Use Cosmos DB `items.create()` method with job document in `jobs` container
    - Implement `generateJobLinks()` function that returns `applicationLink` and `adminLink` in correct format
    - Add timestamp tracking with `createdAt` field
    - _Requirements: 1.1, 1.4, 1.5_
  
  - [ ]* 3.4 Write property test for job link format
    - **Property 2: Job Link Generation Format**
    - **Validates: Requirements 1.3, 1.4_

- [x] 4. Implement multi-step job creation UI
  - [x] 4.1 Create Step 1: Job Details form
    - Build HTML form with fields: title, department, location (autocomplete), experience level (dropdown), description (textarea), skills (tag input), qualifications (textarea)
    - Implement tag-based skill input with add/remove buttons
    - Implement Northern Nigerian state autocomplete with 18 states
    - Add client-side validation with field-specific error messages
    - _Requirements: 1.2, 1.7, 16.1, 16.4, 18.7_
  
  - [ ]* 4.2 Write property test for location autocomplete filtering
    - **Property 16: Location Autocomplete Filtering**
    - **Validates: Requirements 16.1, 16.2, 16.3**
  
  - [ ] 4.3 Create Step 2: Distribution Channels selection
    - Build grid of 12 distribution channel cards with name, icon, type, member count
    - Implement toggle selection with visual feedback (checkmark, blue border, highlight)
    - Generate source-parameterized links for each selected channel
    - _Requirements: 20.1, 20.2, 20.3, 20.5_
  
  - [ ]* 4.4 Write property test for platform source link generation
    - **Property 10: Platform Source Link Generation**
    - **Validates: Requirements 9.1, 20.5**
  
  - [ ] 4.5 Create Step 3: Published confirmation screen
    - Display success message with generated Application_Link and Admin_Link
    - Add "Copy Link" button with clipboard API integration
    - Add "Copy Job Description" button using Pretty_Printer
    - Add "Preview" and "View Dashboard" navigation buttons
    - Display toast notification on successful copy
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 19.6, 19.7_
  
  - [ ] 4.6 Implement multi-step progress indicator
    - Create visual progress bar with three steps: Job Details, Distribution, Published
    - Implement step navigation with "Continue" and "Back" buttons
    - Preserve form data when navigating between steps
    - Update progress indicator state (active, completed, inactive)
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 5. Checkpoint - Ensure job posting flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Candidate Application Processor module
  - [x] 6.1 Create CandidateApplication data model
    - Define `CandidateApplication` interface with personalInfo, experience, files, source, scores, status, appliedAt fields
    - Define `StatusChange` interface for status history tracking
    - Implement initial status as "pending"
    - _Requirements: 2.1, 2.2, 24.1_
  
  - [x] 6.2 Implement application submission function
    - Implement `submitApplication()` function that validates required fields, saves to Azure Cosmos DB `candidates` container
    - Use partition key `jobId` for all candidate documents to co-locate candidates with their job
    - Implement `extractSourceFromURL()` function to capture source parameter or default to "direct"
    - Increment job's `applicantCount` statistic in `jobs` container on successful submission
    - Return candidate ID for subsequent operations
    - _Requirements: 2.2, 2.5, 2.6, 9.2_
  
  - [ ]* 6.3 Write property test for candidate application validation
    - **Property 4: Candidate Application Validation**
    - **Validates: Requirements 2.2**
  
  - [ ]* 6.4 Write property test for URL source parameter extraction
    - **Property 11: URL Source Parameter Extraction**
    - **Validates: Requirements 9.2**

- [x] 7. Implement file upload system
  - [x] 7.1 Create CV and cover letter upload UI
    - Build file input with drag-and-drop support for PDF and DOCX
    - Display file validation error messages for invalid format or size > 5MB
    - Show upload progress indicator during file transfer
    - Display uploaded filename with "Remove" button after successful upload
    - _Requirements: 10.1, 10.2, 10.4, 18.2_
  
  - [ ]* 7.2 Write property test for file upload validation
    - **Property 12: File Upload Validation**
    - **Validates: Requirements 10.1, 10.2**
  
  - [x] 7.3 Implement Azure Blob Storage upload function
    - Implement `uploadFile()` function using `@azure/storage-blob` SDK that uploads to path `cvs/{jobId}/{candidateId}.{ext}` or `cover-letters/{jobId}/{candidateId}.{ext}`
    - Use `BlockBlobClient.uploadData()` method to upload file buffer
    - Generate SAS token with 7-day expiration using `generateBlobSASQueryParameters()` for secure download URLs
    - Handle upload failures with retry capability
    - Store blob URL with SAS token in candidate record in Cosmos DB
    - _Requirements: 2.3, 2.4, 10.3, 10.6, 18.3_
  
  - [ ]* 7.4 Write property test for storage path format
    - **Property 3: CV Storage Path Format**
    - **Validates: Requirements 2.3, 10.3**

- [x] 8. Implement candidate application form UI
  - Create HTML form with fields: full name, email, phone (optional), LinkedIn (optional), years of experience, current role (optional), skills (tag input), measurable achievements (textarea)
  - Display job posting details at top of form (title, location, experience level, required skills)
  - Implement client-side validation for required fields with error messages
  - Add CV and cover letter upload sections (integrated from task 7.1)
  - Wire form submission to `submitApplication()` function
  - Display processing animation with "Analyzing Your Application..." message after submission
  - _Requirements: 2.1, 2.2, 2.7, 14.1, 14.2, 14.3, 14.5, 18.7_

- [ ] 9. Checkpoint - Ensure application submission and file upload work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement CV Parser module
  - [ ] 10.1 Set up PDF and DOCX parsing libraries
    - Install `pdf-parse` library for PDF text extraction
    - Install `mammoth` library for DOCX text extraction
    - Create error handling for encrypted or corrupted files
    - _Requirements: 10.7, 21.1, 21.2_
  
  - [ ] 10.2 Implement text extraction functions
    - Implement `extractTextFromPDF()` function using pdf-parse with multi-page support
    - Implement `extractTextFromDOCX()` function using mammoth with preserved formatting
    - Handle extraction timeout after 30 seconds
    - Return plain text with preserved line breaks
    - _Requirements: 10.7, 21.3, 21.5, 21.7_
  
  - [ ] 10.3 Implement AI-powered CV parsing
    - Implement `parseCVWithAI()` function that sends extracted text to OpenAI GPT-3.5-turbo
    - Create prompt requesting structured extraction: skills, certifications, education, experience
    - Truncate CV text to 8000 characters before sending to API
    - Parse AI response to extract skills, qualifications, experience
    - _Requirements: 11.1, 11.2, 11.3, 11.7_
  
  - [ ]* 10.4 Write property test for text truncation
    - **Property 14: Text Truncation at 8000 Characters**
    - **Validates: Requirements 11.3, 11.7**
  
  - [x] 10.5 Implement skill merging and deduplication
    - Implement function to merge CV-extracted skills with form-submitted skills
    - Perform case-insensitive deduplication (e.g., "Python" and "python" → "Python")
    - Return unified skill list for scoring
    - _Requirements: 11.2, 11.4_
  
  - [ ]* 10.6 Write property test for skill deduplication
    - **Property 13: Skill List Deduplication**
    - **Validates: Requirements 11.2, 11.4**
  
  - [x] 10.7 Implement error handling for CV parsing
    - Handle pdf-parse/mammoth exceptions gracefully
    - Log errors with file metadata
    - Mark CV as "text extraction failed" in database on error
    - Continue scoring with form data only if parsing fails
    - Display user-friendly error messages
    - _Requirements: 11.6, 18.4, 21.4_

- [x] 11. Implement AI Scoring Engine module
  - [x] 11.1 Set up OpenAI API client
    - Install `openai` npm package
    - Configure API key from environment variables
    - Create rate limiting wrapper with retry logic
    - _Requirements: 3.1, 17.2, 18.2_
  
  - [x] 11.2 Implement semantic skills matching with embeddings
    - Implement `calculateSkillsMatch()` function using exact match (50%) and semantic match (50%)
    - Implement exact match using case-insensitive string comparison
    - Implement semantic match using OpenAI text-embedding-3-small model
    - Calculate cosine similarity between job skills vector and candidate skills vector
    - Consider skills matched if cosine similarity ≥ 0.75
    - _Requirements: 3.2, 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 11.3 Write property test for skills match score calculation
    - **Property 5: Skills Match Score Calculation**
    - **Validates: Requirements 3.2, 4.2, 4.4**
  
  - [ ]* 11.4 Write property test for cosine similarity threshold
    - **Property 7: Semantic Similarity Threshold and Calculation**
    - **Validates: Requirements 4.2, 4.3**
  
  - [x] 11.5 Implement experience match scoring
    - Implement `calculateExperienceMatch()` function with level mapping: Entry=1yr, Mid=3yr, Senior=5yr, Lead=8yr, Executive=12yr
    - Apply scoring logic: ≥required+2 = 100, ≥required = 85, ≥required-1 = 60, else max(0, 40 - (required - candidate) * 10)
    - _Requirements: 3.3_
  
  - [x] 11.6 Implement qualifications scoring
    - Implement `calculateQualificationsScore()` function with keyword detection
    - Detect degrees: BSc, MSc, HND, PhD, Chartered
    - Detect certifications: AWS, PMP, Google, Cisco, Certified
    - Apply scoring: degree + cert = 100, degree OR cert = 70, neither = 40
    - Adjust score by up to +10 if CV confirms additional unlisted credentials
    - _Requirements: 3.4, 11.5_
  
  - [x] 11.7 Implement application quality assessment
    - Implement `assessApplicationQuality()` function using GPT-3.5-turbo
    - Create prompt analyzing achievements summary for: presence of metrics/numbers, clarity, professionalism
    - Limit prompt to 100 input tokens and 10 output tokens
    - Return 0-100 score
    - _Requirements: 3.5, 17.3_
  
  - [x] 11.8 Implement total match score calculation
    - Implement `calculateMatchScore()` function that computes weighted sum
    - Apply weights: skills 40%, experience 30%, qualifications 20%, application quality 10%
    - Round result to nearest integer
    - Store component breakdown in scores object
    - _Requirements: 3.7, 3.8_
  
  - [ ]* 11.9 Write property test for weighted score calculation
    - **Property 6: Weighted Score Calculation**
    - **Validates: Requirements 3.3, 3.7_

- [x] 12. Implement caching for OpenAI embeddings
  - [x] 12.1 Create embedding cache system
    - Create Azure Cosmos DB container `skillEmbeddingsCache` with partition key `/skill`
    - Implement cache lookup in Cosmos DB before calling OpenAI API
    - Store embedding vectors as arrays in documents keyed by lowercase, trimmed skill name
    - Pre-warm cache with top 100 common skills (Python, JavaScript, SQL, etc.)
    - _Requirements: 4.5, 17.1, 17.4_
  
  - [ ]* 12.2 Write property test for embedding cache behavior
    - **Property 17: Embedding Cache Hit Behavior**
    - **Validates: Requirements 4.5, 17.1, 17.4**
  
  - [x] 12.3 Implement batch embedding requests
    - Modify embedding function to send up to 10 skills per API call
    - Split skill arrays into batches of 10
    - Process batches sequentially with rate limiting
    - Cache all returned embeddings
    - _Requirements: 17.1_

- [x] 13. Implement Azure Functions for AI scoring triggers
  - [x] 13.1 Create `onCandidateCreated` Azure Function
    - Set up Cosmos DB trigger on `candidates` container (monitors Change Feed)
    - Configure function to filter for new candidate document insertions
    - Retrieve candidate data and job posting data from Cosmos DB
    - Call `calculateMatchScore()` with candidate and job data
    - Update candidate document in Cosmos DB with scores and component breakdown using `item.replace()`
    - Execute within 60-second timeout
    - _Requirements: 3.1, 3.8, 17.6_
  
  - [x] 13.2 Create `processCVUpload` Azure Function
    - Set up Blob Storage trigger on `cvs` container (monitors blob uploads)
    - Parse blob path to extract `jobId` and `candidateId` from `{jobId}/{candidateId}.{ext}`
    - Download blob data using `BlockBlobClient.downloadToBuffer()`
    - Call appropriate parser function (PDF or DOCX based on extension)
    - Call `parseCVWithAI()` to extract structured data
    - Merge CV skills with candidate's form skills from Cosmos DB
    - Re-calculate match score with adjusted data and update Cosmos DB
    - Execute within 90-second timeout
    - _Requirements: 11.1, 11.4, 11.5, 21.7_
  
  - [x] 13.3 Implement error handling and retry logic for Functions
    - Add try-catch blocks around OpenAI API calls
    - Retry once after 2-second delay on OpenAI API failure
    - Assign default score of 50% if both attempts fail
    - Log errors to Azure Application Insights with candidate ID, timestamp, error message
    - Continue workflow without blocking
    - _Requirements: 3.9, 18.2, 18.5_

- [ ] 14. Checkpoint - Ensure AI scoring pipeline works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement Real-Time Update Manager module
  - [x] 15.1 Implement Azure SignalR Service connection
    - Implement `connectToSignalR()` function using `@microsoft/signalr` client library
    - Create Azure Function HTTP trigger for SignalR negotiation endpoint (returns SignalR connection info)
    - Implement `joinJobGroup()` function to subscribe client to job-specific group
    - Implement `disconnectFromSignalR()` function for cleanup
    - Handle connection loss with automatic reconnection within 5 seconds using SignalR's built-in retry
    - Support up to 20 concurrent connections per job (free tier limit)
    - _Requirements: 5.1, 5.6, 18.6_
  
  - [x] 15.2 Implement real-time UI updates via SignalR
    - Create Azure Function with Cosmos DB trigger + SignalR output binding for broadcasting changes
    - Configure function to broadcast `newCandidate` event to job-specific SignalR group when candidate inserted
    - Configure function to broadcast `candidateUpdated` event when candidate status changes
    - Wire SignalR listener callback to update candidate ranking table in UI
    - Insert new candidates in real-time without page refresh
    - Re-sort table by match score when new candidate added
    - Update statistics counters (applicant count, shortlisted count, avg match score) in real-time
    - Display "Reconnecting..." indicator during connection loss
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 18.6_

- [x] 16. Implement Recruiter Dashboard UI
  - [x] 16.1 Create dashboard statistics cards
    - Build four metric cards: Active Jobs, Total Applicants, Shortlisted, Average Match Score
    - Implement `calculateAverageMatchScore()` function that computes mean of all candidate scores
    - Display sub-labels under each metric
    - Wire cards to update in real-time when candidate data changes
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 16.2 Write property test for average match score calculation
    - **Property 15: Average Match Score Calculation**
    - **Validates: Requirements 12.1, 12.4**
  
  - [x] 16.3 Create candidate ranking table
    - Build table with columns: Rank, Name, Current Role, Years of Experience, Match Score, Skills Match, Status, Actions
    - Implement sorting by match score in descending order
    - Assign rank badges with visual styling: rank 1 (gold), rank 2 (silver), rank 3 (bronze), rank 4+ (gray)
    - Display match score as horizontal progress bar with color coding: 80%+ green, 55-79% blue, <55% red
    - Display skills match as "X/Y skills" badge with color coding
    - Display status badge: Pending (gray), Shortlisted (green), Rejected (red)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 16.4 Write property test for candidate ranking sort order
    - **Property 8: Candidate Ranking Sort Order**
    - **Validates: Requirements 6.1**
  
  - [ ]* 16.5 Write property test for rank badge assignment
    - **Property 9: Rank Badge Assignment**
    - **Validates: Requirements 6.2**

- [x] 17. Implement candidate action system
  - [x] 17.1 Implement shortlist functionality
    - Add "Shortlist" button to each candidate row
    - Implement `updateCandidateStatus()` function that updates status to "shortlisted" in Azure Cosmos DB
    - Use Cosmos DB `item.replace()` method to update candidate document
    - Update status badge to green "Shortlisted" with checkmark icon
    - Disable "Shortlist" button and enable "Reject" button
    - Increment `shortlistedCount` statistic
    - Display success toast "Candidate shortlisted ✓" for 3 seconds
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 17.2 Implement reject functionality with notification
    - Add "Reject" button to each candidate row
    - Create rejection confirmation modal with candidate name and email preview
    - Pre-populate rejection email template with job title, candidate name, professional message
    - On confirmation, update status to "rejected" in Azure Cosmos DB
    - Send rejection email via transactional email service (Azure Communication Services or SendGrid) within 10 seconds
    - Update status badge to red "Rejected" with X icon
    - Disable "Reject" button and enable "Shortlist" button
    - Display toast "Rejection notification sent" for 3 seconds
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 17.3 Implement status transition validation
    - Enforce valid transitions: pending → shortlisted, pending → rejected, shortlisted ↔ rejected
    - Prevent invalid transitions by disabling already-applied action buttons
    - Record status change in `statusHistory` array with timestamp
    - Ensure only one status active at a time
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_
  
  - [ ]* 17.4 Write property test for status transition validation
    - **Property 19: Candidate Status Transition Validation**
    - **Validates: Requirements 24.1, 24.2, 24.3**

- [x] 18. Implement Platform Analytics Tracker module
  - [x] 18.1 Create platform performance dashboard
    - Build analytics section displaying each source with: application count, avg match score, shortlisted count, quality rating
    - Implement `calculatePlatformStats()` function that aggregates data per source
    - Implement `generateQualityRating()` function: 5 stars (≥80%), 4 stars (70-79%), 3 stars (60-69%), 2 stars (50-59%), 1 star (<50%)
    - Sort sources by quality rating descending by default
    - Display visual star ratings
    - _Requirements: 9.3, 9.4, 9.5, 9.6_

- [x] 19. Implement candidate match result display
  - [x] 19.1 Create match result card UI
    - Build match result card with large circular badge showing total match percentage
    - Apply color coding: 80%+ green, 55-79% blue, <55% red
    - Display match label: "Excellent Match" (80%+), "Good Match" (55-79%), "Partial Match" (<55%)
    - Add breakdown section with four rows: Skills Match, Experience Match, Qualifications, Application Quality
    - Animate progress bars filling from 0% to final values over 1.2 seconds
    - Display message: "The recruiter will review your application. You'll hear back if shortlisted."
    - Add "View Application" button to display submitted form data
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_
  
  - [x] 19.2 Wire match result display to AI scoring completion
    - Hide processing animation when scoring completes
    - Display match result card within 1 second of scoring completion
    - Handle extended processing (>30 seconds) with updated message: "Still analyzing… This is taking longer than usual"
    - _Requirements: 14.4, 14.5_

- [x] 20. Implement Pretty Printer for job postings
  - [x] 20.1 Create job formatting function
    - Implement `formatJobPosting()` function that accepts JobPosting object
    - Format output with sections: Title, Location, Experience Level, Department, Description, Required Skills (bulleted), Key Qualifications
    - Format skills as bulleted list with "• " prefix
    - Wrap long descriptions at 80 characters per line
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_
  
  - [ ]* 20.2 Write property test for formatting round-trip (idempotence)
    - **Property 22 (partial): Pretty Printer Idempotence**
    - **Validates: Requirements 22.6**

- [x] 21. Implement data serialization and privacy controls
  - [x] 21.1 Implement JSON serialization round-trip
    - Ensure all JobPosting and CandidateApplication objects serialize/deserialize correctly
    - Preserve array order for skills and selected distribution channels
    - Handle null/undefined optional fields consistently
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_
  
  - [ ]* 21.2 Write property test for serialization round-trip
    - **Property 18: Job Data Serialization Round-Trip**
    - **Validates: Requirements 23.1, 23.2, 23.3, 23.4**
  
  - [x] 21.3 Implement data privacy filters
    - Create function to filter sensitive data from public API responses (exclude email, phone, LinkedIn, cvUrl, coverLetterUrl)
    - Ensure candidate data accessible only via Admin_Link
    - Ensure AI prompts do not include candidate names or contact information
    - Configure HTTPS for all client-server communication
    - _Requirements: 25.1, 25.2, 25.4, 25.5, 25.6_
  
  - [ ]* 21.4 Write property test for sensitive data exclusion
    - **Property 20: Sensitive Data Exclusion from Public API**
    - **Validates: Requirements 25.2, 25.5**

- [x] 22. Implement cost monitoring and optimization
  - [x] 22.1 Add OpenAI token usage logging
    - Log all OpenAI API calls with token counts (input and output)
    - Store logs in Azure Cosmos DB under `apiUsageLogs` container with timestamp as partition key
    - Calculate per-candidate cost based on token usage and pricing
    - _Requirements: 17.7_
  
  - [x] 22.2 Implement token usage optimization
    - Ensure GPT-3.5-turbo quality assessment prompts use ≤100 input tokens and ≤10 output tokens
    - Ensure text-embedding-3-small is used (not ada-002)
    - Verify CV text truncation to 8000 characters before API calls
    - Verify batch embedding requests (10 skills per call)
    - _Requirements: 17.1, 17.2, 17.3, 17.5_

- [ ] 23. Checkpoint - Ensure complete recruiter and candidate workflows
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 24. Write integration tests for Azure services
  - [ ]* 24.1 Test Azure Cosmos DB integration
    - Test job posting save and retrieve with round-trip verification using Cosmos DB SDK
    - Test candidate application save with correct partition key
    - Test Change Feed triggers on data insertion
    - Test concurrent write conflict resolution with optimistic concurrency
  
  - [ ]* 24.2 Test Azure Blob Storage integration
    - Test CV upload and SAS token generation
    - Test SAS URL expiration (7 days)
    - Test blob access permissions (private container with SAS tokens)
  
  - [ ]* 24.3 Test Azure Functions triggers
    - Test `onCandidateCreated` function fires on Cosmos DB Change Feed event
    - Test `processCVUpload` function fires on blob upload
    - Test function execution timeout (<60 seconds for scoring, <90 seconds for CV processing)

- [ ]* 25. Write integration tests for OpenAI API
  - Test embedding generation for sample skills with cache hits/misses in Cosmos DB
  - Test GPT-3.5-turbo quality assessment with known inputs
  - Test retry behavior on 429 rate limit response
  - Test error handling on 500 server error response
  - Use Azure Cosmos DB Emulator and Azure Storage Emulator for local development
  - Use `nock` library to mock OpenAI calls

- [ ]* 26. Write end-to-end tests for complete workflows
  - [ ]* 26.1 Test recruiter: create job and view applicants
    - Navigate to dashboard → Post job → Fill form → Submit
    - Verify job appears in job list
    - Navigate to rankings → Verify empty state
  
  - [ ]* 26.2 Test candidate: apply and see match score
    - Access application link → Fill form → Upload CV → Submit
    - Verify processing animation displays
    - Verify match score displays within 10 seconds
    - Verify match breakdown shows four components
  
  - [ ]* 26.3 Test recruiter: real-time application notification
    - Open admin dashboard (recruiter)
    - Submit application (candidate in different browser)
    - Verify new candidate appears in recruiter's table within 2 seconds
    - Verify applicant count increments
  
  - [ ]* 26.4 Test recruiter: shortlist and reject actions
    - View candidate rankings
    - Click "Shortlist" → Verify status updates
    - Click "Reject" → Verify modal → Confirm → Verify status updates

- [ ] 27. Deploy to Azure Static Web Apps and configure production environment
  - Build production bundle with minified CSS and JavaScript
  - Configure Azure Static Web Apps with `staticwebapp.config.json` (routing, redirects for SPA)
  - Set up environment variables for OpenAI API key in Azure Function App settings
  - Deploy Azure Functions to production using Azure CLI or VS Code extension
  - Configure Cosmos DB firewall rules for production
  - Configure custom domain in Azure Static Web Apps if available
  - Test deployed application end-to-end
  - _Requirements: All requirements in production environment_

- [ ] 28. Final checkpoint - Full system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP iteration
- Each task references specific requirements for traceability back to acceptance criteria
- Property tests validate universal correctness properties defined in the design document
- Integration and E2E tests validate system behavior across components
- Azure Cosmos DB Emulator and Azure Storage Emulator should be used for local development and testing before deploying to production
- OpenAI API calls should be mocked during testing to avoid costs and ensure deterministic results
- All AI scoring happens asynchronously in Azure Functions to avoid blocking the UI
- Real-time updates leverage Azure SignalR Service + Cosmos DB Change Feed for event-driven live updates with automatic reconnection
