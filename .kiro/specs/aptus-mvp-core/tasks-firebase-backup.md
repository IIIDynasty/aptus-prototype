# Implementation Plan: Aptus MVP Core

## Overview

This implementation plan breaks down the Aptus MVP into discrete coding tasks. The platform uses Firebase (Realtime Database, Storage, Functions, Hosting) for backend infrastructure and OpenAI (GPT-3.5-turbo and text-embedding-3-small) for AI-powered candidate scoring. The frontend is vanilla HTML/CSS/JavaScript with real-time synchronization. Each task builds incrementally, ensuring integrated functionality at every step.

## Tasks

- [x] 1. Set up Firebase project and core infrastructure
  - Create Firebase project in console
  - Initialize Firebase SDK in the web application
  - Configure Firebase Realtime Database with JSON schema structure for jobs, candidates, statistics
  - Configure Firebase Storage buckets for CVs and cover letters with folder structure
  - Set up Firebase Hosting for static file deployment
  - Create `.firebaserc` and `firebase.json` configuration files
  - _Requirements: 1.1, 2.4, 10.4_

- [ ] 2. Implement Firebase security rules
  - [ ] 2.1 Write Realtime Database security rules
    - Define rules for `/jobs/{jobId}` read/write access (public read for application link, admin link for write)
    - Define rules for `/candidates/{candidateId}` with privacy restrictions (no public exposure of email, phone, CV URLs)
    - Define rules for `/skillEmbeddingsCache` with read-only access
    - _Requirements: 25.1, 25.2, 25.6_
  
  - [ ] 2.2 Write Firebase Storage security rules
    - Define rules for `/cvs/{jobId}/{candidateId}` with 7-day signed URL access
    - Define rules for `/cover-letters/{jobId}/{candidateId}` with same access pattern
    - Restrict public access, require authentication token for downloads
    - _Requirements: 10.6, 25.3_

- [ ] 3. Implement Job Posting Manager module
  - [ ] 3.1 Create JobPosting data model and validation
    - Define `JobPosting` interface with all required fields (id, title, department, location, experienceLevel, description, skills, qualifications)
    - Implement `validateJobData()` function with field-specific validation rules
    - Implement `generateJobId()` function in format "JOB-{YEAR}-{4-digit-random}"
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 3.2 Write property test for job posting validation
    - **Property 1: Job Posting Validation Rejects Invalid Submissions**
    - **Validates: Requirements 1.2**
  
  - [ ] 3.3 Implement job creation and link generation
    - Implement `createJobPosting()` function that validates data, generates ID, saves to Firebase
    - Implement `generateJobLinks()` function that returns `applicationLink` and `adminLink` in correct format
    - Add timestamp tracking with `createdAt` field
    - _Requirements: 1.1, 1.4, 1.5_
  
  - [ ]* 3.4 Write property test for job link format
    - **Property 2: Job Link Generation Format**
    - **Validates: Requirements 1.3, 1.4**

- [ ] 4. Implement multi-step job creation UI
  - [ ] 4.1 Create Step 1: Job Details form
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

- [ ] 6. Implement Candidate Application Processor module
  - [ ] 6.1 Create CandidateApplication data model
    - Define `CandidateApplication` interface with personalInfo, experience, files, source, scores, status, appliedAt fields
    - Define `StatusChange` interface for status history tracking
    - Implement initial status as "pending"
    - _Requirements: 2.1, 2.2, 24.1_
  
  - [ ] 6.2 Implement application submission function
    - Implement `submitApplication()` function that validates required fields, saves to Firebase under `jobs/{jobId}/candidates`
    - Implement `extractSourceFromURL()` function to capture source parameter or default to "direct"
    - Increment job's `applicantCount` statistic on successful submission
    - Return candidate ID for subsequent operations
    - _Requirements: 2.2, 2.5, 2.6, 9.2_
  
  - [ ]* 6.3 Write property test for candidate application validation
    - **Property 4: Candidate Application Validation**
    - **Validates: Requirements 2.2**
  
  - [ ]* 6.4 Write property test for URL source parameter extraction
    - **Property 11: URL Source Parameter Extraction**
    - **Validates: Requirements 9.2_

- [ ] 7. Implement file upload system
  - [ ] 7.1 Create CV and cover letter upload UI
    - Build file input with drag-and-drop support for PDF and DOCX
    - Display file validation error messages for invalid format or size > 5MB
    - Show upload progress indicator during file transfer
    - Display uploaded filename with "Remove" button after successful upload
    - _Requirements: 10.1, 10.2, 10.4, 18.2_
  
  - [ ]* 7.2 Write property test for file upload validation
    - **Property 12: File Upload Validation**
    - **Validates: Requirements 10.1, 10.2**
  
  - [ ] 7.3 Implement Firebase Storage upload function
    - Implement `uploadFile()` function that uploads to path `cvs/{jobId}/{candidateId}.{ext}` or `cover-letters/{jobId}/{candidateId}.{ext}`
    - Generate secure download URL with 7-day expiration
    - Handle upload failures with retry capability
    - Store file URL in candidate record
    - _Requirements: 2.3, 2.4, 10.3, 10.6, 18.3_
  
  - [ ]* 7.4 Write property test for storage path format
    - **Property 3: CV Storage Path Format**
    - **Validates: Requirements 2.3, 10.3**

- [ ] 8. Implement candidate application form UI
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
  
  - [ ] 10.5 Implement skill merging and deduplication
    - Implement function to merge CV-extracted skills with form-submitted skills
    - Perform case-insensitive deduplication (e.g., "Python" and "python" → "Python")
    - Return unified skill list for scoring
    - _Requirements: 11.2, 11.4_
  
  - [ ]* 10.6 Write property test for skill deduplication
    - **Property 13: Skill List Deduplication**
    - **Validates: Requirements 11.2, 11.4**
  
  - [ ] 10.7 Implement error handling for CV parsing
    - Handle pdf-parse/mammoth exceptions gracefully
    - Log errors with file metadata
    - Mark CV as "text extraction failed" in database on error
    - Continue scoring with form data only if parsing fails
    - Display user-friendly error messages
    - _Requirements: 11.6, 18.4, 21.4_

- [ ] 11. Implement AI Scoring Engine module
  - [ ] 11.1 Set up OpenAI API client
    - Install `openai` npm package
    - Configure API key from environment variables
    - Create rate limiting wrapper with retry logic
    - _Requirements: 3.1, 17.2, 18.2_
  
  - [ ] 11.2 Implement semantic skills matching with embeddings
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
  
  - [ ] 11.5 Implement experience match scoring
    - Implement `calculateExperienceMatch()` function with level mapping: Entry=1yr, Mid=3yr, Senior=5yr, Lead=8yr, Executive=12yr
    - Apply scoring logic: ≥required+2 = 100, ≥required = 85, ≥required-1 = 60, else max(0, 40 - (required - candidate) * 10)
    - _Requirements: 3.3_
  
  - [ ] 11.6 Implement qualifications scoring
    - Implement `calculateQualificationsScore()` function with keyword detection
    - Detect degrees: BSc, MSc, HND, PhD, Chartered
    - Detect certifications: AWS, PMP, Google, Cisco, Certified
    - Apply scoring: degree + cert = 100, degree OR cert = 70, neither = 40
    - Adjust score by up to +10 if CV confirms additional unlisted credentials
    - _Requirements: 3.4, 11.5_
  
  - [ ] 11.7 Implement application quality assessment
    - Implement `assessApplicationQuality()` function using GPT-3.5-turbo
    - Create prompt analyzing achievements summary for: presence of metrics/numbers, clarity, professionalism
    - Limit prompt to 100 input tokens and 10 output tokens
    - Return 0-100 score
    - _Requirements: 3.5, 17.3_
  
  - [ ] 11.8 Implement total match score calculation
    - Implement `calculateMatchScore()` function that computes weighted sum
    - Apply weights: skills 40%, experience 30%, qualifications 20%, application quality 10%
    - Round result to nearest integer
    - Store component breakdown in scores object
    - _Requirements: 3.7, 3.8_
  
  - [ ]* 11.9 Write property test for weighted score calculation
    - **Property 6: Weighted Score Calculation**
    - **Validates: Requirements 3.3, 3.7_

- [ ] 12. Implement caching for OpenAI embeddings
  - [ ] 12.1 Create embedding cache system
    - Create Firebase Realtime Database path `/skillEmbeddingsCache/{skill}`
    - Implement cache lookup before calling OpenAI API
    - Store embedding vectors as arrays keyed by lowercase, trimmed skill name
    - Pre-warm cache with top 100 common skills (Python, JavaScript, SQL, etc.)
    - _Requirements: 4.5, 17.1, 17.4_
  
  - [ ]* 12.2 Write property test for embedding cache behavior
    - **Property 17: Embedding Cache Hit Behavior**
    - **Validates: Requirements 4.5, 17.1, 17.4**
  
  - [ ] 12.3 Implement batch embedding requests
    - Modify embedding function to send up to 10 skills per API call
    - Split skill arrays into batches of 10
    - Process batches sequentially with rate limiting
    - Cache all returned embeddings
    - _Requirements: 17.1_

- [ ] 13. Implement Firebase Functions for AI scoring triggers
  - [ ] 13.1 Create `onCandidateCreated` Firebase Function
    - Set up database trigger on `jobs/{jobId}/candidates/{candidateId}` creation
    - Retrieve candidate data and job posting data
    - Call `calculateMatchScore()` with candidate and job data
    - Update candidate record with scores and component breakdown
    - Execute within 60-second timeout
    - _Requirements: 3.1, 3.8, 17.6_
  
  - [ ] 13.2 Create `processCVUpload` Firebase Function
    - Set up storage trigger on `cvs/{jobId}/{candidateId}` upload
    - Download file from storage
    - Call appropriate parser function (PDF or DOCX)
    - Call `parseCVWithAI()` to extract structured data
    - Merge CV skills with candidate's form skills
    - Re-calculate match score with adjusted data
    - Execute within 90-second timeout
    - _Requirements: 11.1, 11.4, 11.5, 21.7_
  
  - [ ] 13.3 Implement error handling and retry logic for Functions
    - Add try-catch blocks around OpenAI API calls
    - Retry once after 2-second delay on OpenAI API failure
    - Assign default score of 50% if both attempts fail
    - Log errors with candidate ID, timestamp, error message
    - Continue workflow without blocking
    - _Requirements: 3.9, 18.2, 18.5_

- [ ] 14. Checkpoint - Ensure AI scoring pipeline works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement Real-Time Update Manager module
  - [ ] 15.1 Implement Firebase Realtime Database listeners
    - Implement `attachJobListener()` function that establishes listener on `jobs/{jobId}/candidates`
    - Implement `detachJobListener()` function for cleanup
    - Handle connection loss with automatic reconnection within 5 seconds
    - Support up to 100 concurrent connections per job
    - _Requirements: 5.1, 5.6, 18.6_
  
  - [ ] 15.2 Implement real-time UI updates
    - Wire listener callback to update candidate ranking table
    - Insert new candidates in real-time without page refresh
    - Re-sort table by match score when new candidate added
    - Update statistics counters (applicant count, shortlisted count, avg match score) in real-time
    - Display "Reconnecting..." indicator during connection loss
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 18.6_

- [ ] 16. Implement Recruiter Dashboard UI
  - [ ] 16.1 Create dashboard statistics cards
    - Build four metric cards: Active Jobs, Total Applicants, Shortlisted, Average Match Score
    - Implement `calculateAverageMatchScore()` function that computes mean of all candidate scores
    - Display sub-labels under each metric
    - Wire cards to update in real-time when candidate data changes
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 16.2 Write property test for average match score calculation
    - **Property 15: Average Match Score Calculation**
    - **Validates: Requirements 12.1, 12.4**
  
  - [ ] 16.3 Create candidate ranking table
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

- [ ] 17. Implement candidate action system
  - [ ] 17.1 Implement shortlist functionality
    - Add "Shortlist" button to each candidate row
    - Implement `updateCandidateStatus()` function that updates status to "shortlisted" in Firebase
    - Update status badge to green "Shortlisted" with checkmark icon
    - Disable "Shortlist" button and enable "Reject" button
    - Increment `shortlistedCount` statistic
    - Display success toast "Candidate shortlisted ✓" for 3 seconds
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 17.2 Implement reject functionality with notification
    - Add "Reject" button to each candidate row
    - Create rejection confirmation modal with candidate name and email preview
    - Pre-populate rejection email template with job title, candidate name, professional message
    - On confirmation, update status to "rejected" in Firebase
    - Send rejection email via transactional email service (SendGrid or Firebase Email extension) within 10 seconds
    - Update status badge to red "Rejected" with X icon
    - Disable "Reject" button and enable "Shortlist" button
    - Display toast "Rejection notification sent" for 3 seconds
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [ ] 17.3 Implement status transition validation
    - Enforce valid transitions: pending → shortlisted, pending → rejected, shortlisted ↔ rejected
    - Prevent invalid transitions by disabling already-applied action buttons
    - Record status change in `statusHistory` array with timestamp
    - Ensure only one status active at a time
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_
  
  - [ ]* 17.4 Write property test for status transition validation
    - **Property 19: Candidate Status Transition Validation**
    - **Validates: Requirements 24.1, 24.2, 24.3**

- [ ] 18. Implement Platform Analytics Tracker module
  - [ ] 18.1 Create platform performance dashboard
    - Build analytics section displaying each source with: application count, avg match score, shortlisted count, quality rating
    - Implement `calculatePlatformStats()` function that aggregates data per source
    - Implement `generateQualityRating()` function: 5 stars (≥80%), 4 stars (70-79%), 3 stars (60-69%), 2 stars (50-59%), 1 star (<50%)
    - Sort sources by quality rating descending by default
    - Display visual star ratings
    - _Requirements: 9.3, 9.4, 9.5, 9.6_

- [ ] 19. Implement candidate match result display
  - [ ] 19.1 Create match result card UI
    - Build match result card with large circular badge showing total match percentage
    - Apply color coding: 80%+ green, 55-79% blue, <55% red
    - Display match label: "Excellent Match" (80%+), "Good Match" (55-79%), "Partial Match" (<55%)
    - Add breakdown section with four rows: Skills Match, Experience Match, Qualifications, Application Quality
    - Animate progress bars filling from 0% to final values over 1.2 seconds
    - Display message: "The recruiter will review your application. You'll hear back if shortlisted."
    - Add "View Application" button to display submitted form data
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_
  
  - [ ] 19.2 Wire match result display to AI scoring completion
    - Hide processing animation when scoring completes
    - Display match result card within 1 second of scoring completion
    - Handle extended processing (>30 seconds) with updated message: "Still analyzing… This is taking longer than usual"
    - _Requirements: 14.4, 14.5_

- [ ] 20. Implement Pretty Printer for job postings
  - [ ] 20.1 Create job formatting function
    - Implement `formatJobPosting()` function that accepts JobPosting object
    - Format output with sections: Title, Location, Experience Level, Department, Description, Required Skills (bulleted), Key Qualifications
    - Format skills as bulleted list with "• " prefix
    - Wrap long descriptions at 80 characters per line
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_
  
  - [ ]* 20.2 Write property test for formatting round-trip (idempotence)
    - **Property 22 (partial): Pretty Printer Idempotence**
    - **Validates: Requirements 22.6**

- [ ] 21. Implement data serialization and privacy controls
  - [ ] 21.1 Implement JSON serialization round-trip
    - Ensure all JobPosting and CandidateApplication objects serialize/deserialize correctly
    - Preserve array order for skills and selected distribution channels
    - Handle null/undefined optional fields consistently
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_
  
  - [ ]* 21.2 Write property test for serialization round-trip
    - **Property 18: Job Data Serialization Round-Trip**
    - **Validates: Requirements 23.1, 23.2, 23.3, 23.4**
  
  - [ ] 21.3 Implement data privacy filters
    - Create function to filter sensitive data from public API responses (exclude email, phone, LinkedIn, cvUrl, coverLetterUrl)
    - Ensure candidate data accessible only via Admin_Link
    - Ensure AI prompts do not include candidate names or contact information
    - Configure HTTPS for all client-server communication
    - _Requirements: 25.1, 25.2, 25.4, 25.5, 25.6_
  
  - [ ]* 21.4 Write property test for sensitive data exclusion
    - **Property 20: Sensitive Data Exclusion from Public API**
    - **Validates: Requirements 25.2, 25.5**

- [ ] 22. Implement cost monitoring and optimization
  - [ ] 22.1 Add OpenAI token usage logging
    - Log all OpenAI API calls with token counts (input and output)
    - Store logs in Firebase Realtime Database under `/apiUsageLogs/{timestamp}`
    - Calculate per-candidate cost based on token usage and pricing
    - _Requirements: 17.7_
  
  - [ ] 22.2 Implement token usage optimization
    - Ensure GPT-3.5-turbo quality assessment prompts use ≤100 input tokens and ≤10 output tokens
    - Ensure text-embedding-3-small is used (not ada-002)
    - Verify CV text truncation to 8000 characters before API calls
    - Verify batch embedding requests (10 skills per call)
    - _Requirements: 17.1, 17.2, 17.3, 17.5_

- [ ] 23. Checkpoint - Ensure complete recruiter and candidate workflows
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 24. Write integration tests for Firebase services
  - [ ]* 24.1 Test Firebase Realtime Database integration
    - Test job posting save and retrieve with round-trip verification
    - Test candidate application save
    - Test real-time listener triggers on data change
    - Test concurrent write conflict resolution
  
  - [ ]* 24.2 Test Firebase Storage integration
    - Test CV upload and download URL generation
    - Test signed URL expiration (7 days)
    - Test file access permissions (public vs private)
  
  - [ ]* 24.3 Test Firebase Functions triggers
    - Test `onCandidateCreated` function fires on database write
    - Test `processCVUpload` function fires on storage upload
    - Test function execution timeout (<60 seconds for scoring, <90 seconds for CV processing)

- [ ]* 25. Write integration tests for OpenAI API
  - Test embedding generation for sample skills with cache hits/misses
  - Test GPT-3.5-turbo quality assessment with known inputs
  - Test retry behavior on 429 rate limit response
  - Test error handling on 500 server error response
  - Use Firebase Emulator Suite and `nock` library to mock OpenAI calls

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

- [ ] 27. Deploy to Firebase Hosting and configure production environment
  - Build production bundle with minified CSS and JavaScript
  - Configure Firebase Hosting with `firebase.json` (routing, redirects)
  - Set up environment variables for OpenAI API key
  - Deploy Firebase Functions to production
  - Deploy security rules to production
  - Configure custom domain if available
  - Test deployed application end-to-end
  - _Requirements: All requirements in production environment_

- [ ] 28. Final checkpoint - Full system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP iteration
- Each task references specific requirements for traceability back to acceptance criteria
- Property tests validate universal correctness properties defined in the design document
- Integration and E2E tests validate system behavior across components
- The Firebase Emulator Suite should be used for local development and testing before deploying to production
- OpenAI API calls should be mocked during testing to avoid costs and ensure deterministic results
- All AI scoring happens asynchronously in Firebase Functions to avoid blocking the UI
- Real-time updates leverage Firebase's built-in WebSocket synchronization for zero-configuration live updates
