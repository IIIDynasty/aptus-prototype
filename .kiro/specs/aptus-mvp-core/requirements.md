# Requirements Document

## Introduction

Aptus is an AI-powered recruitment platform designed to help Northern Nigerian recruiters identify qualified candidates faster. The MVP transforms a working prototype into a functional platform by integrating Azure backend services (Cosmos DB, Blob Storage, Functions, SignalR), implementing an AI ranking engine using OpenAI, enabling real-time candidate updates, and providing platform source attribution. The system uses a no-login approach with unique URLs for MVP v1.0, focusing on speed-to-value and low friction for recruiters. All Azure services are on the free tier, eliminating upfront payment barriers.

## Glossary

- **Aptus_System**: The complete recruitment platform including frontend, backend, AI engine, and database
- **Recruiter**: A user posting jobs and evaluating candidates
- **Candidate**: A job seeker applying through Aptus links
- **Job_Posting**: A role advertised by a recruiter with requirements and description
- **Application**: A candidate's submission including form data, CV, and optional cover letter
- **Match_Score**: AI-calculated percentage (0-100%) indicating candidate-job fit
- **Admin_Dashboard**: Recruiter interface showing ranked candidates and analytics
- **Application_Link**: Public URL candidates use to apply (aptus.io/jobs/{job-id}/apply)
- **Admin_Link**: Private URL recruiters use to view candidates (aptus.io/jobs/{job-id}/admin)
- **Azure_Cosmos_DB**: NoSQL document database providing data storage with Change Feed for real-time synchronization
- **Azure_Blob_Storage**: Cloud storage service for CV and cover letter files with SAS token access
- **Azure_Functionss**: Serverless backend functions for AI processing triggered by database or storage events
- **Azure_SignalR**: Real-time WebSocket service for live dashboard updates
- **OpenAI_API**: Third-party AI service for embeddings and text analysis
- **Source_Parameter**: UTM tracking parameter identifying application origin platform
- **Shortlist_Action**: Recruiter marking a candidate for interview
- **Reject_Action**: Recruiter declining a candidate with optional notification
- **Real_Time_Update**: Immediate UI change triggered by database Change Feed and SignalR broadcast
- **CV_Parser**: Component extracting text from PDF documents
- **Ranking_Table**: Sorted list of candidates by match score
- **Platform_Analytics**: Dashboard showing application source performance

## Requirements

### Requirement 1: Job Posting Creation

**User Story:** As a recruiter, I want to create a job posting with title, location, experience level, description, required skills, and qualifications, so that candidates receive clear requirements and the AI can match appropriately.

#### Acceptance Criteria

1. WHEN a recruiter submits a job posting form with all required fields, THE Aptus_System SHALL validate the data and save it to Azure_Cosmos_DB within 2 seconds
2. THE Aptus_System SHALL enforce that job title, location (Northern Nigerian state), experience level, description, and at least one skill are provided before allowing submission
3. WHEN a job posting is successfully created, THE Aptus_System SHALL generate a unique Job_ID in format "JOB-{YEAR}-{4-digit-random}" within 1 second
4. WHEN a Job_ID is generated, THE Aptus_System SHALL create an Application_Link in format "aptus.io/jobs/{job-id}/apply" and Admin_Link in format "aptus.io/jobs/{job-id}/admin"
5. THE Aptus_System SHALL display both generated links to the recruiter with clear labels indicating which is for candidates and which is for the dashboard
6. THE Aptus_System SHALL store job skills as an array in Azure_Cosmos_DB to enable matching operations
7. THE Aptus_System SHALL support adding and removing skills using tag-based input before submission

### Requirement 2: Candidate Application Submission

**User Story:** As a candidate, I want to submit my application with personal details, experience, skills, achievements, and optional CV, so that recruiters can evaluate my qualifications.

#### Acceptance Criteria

1. WHEN a candidate accesses an Application_Link, THE Aptus_System SHALL display the job posting details and application form without requiring login
2. THE Aptus_System SHALL enforce that full name, email, years of experience, key skills (at least one), and measurable achievements summary are provided before allowing submission
3. WHEN a candidate uploads a CV file, THE Aptus_System SHALL accept PDF and DOCX formats up to 5MB in size
4. WHEN a CV file is uploaded, THE Aptus_System SHALL store it in Azure_Blob_Storage under path "cvs/{job-id}/{candidate-id}.{extension}" within 10 seconds
5. WHEN an application is submitted with all required fields, THE Aptus_System SHALL save the application to Azure_Cosmos_DB under "jobs/{job-id}/candidates" within 3 seconds
6. THE Aptus_System SHALL capture the Source_Parameter from the URL query string and store it with the application if present
7. THE Aptus_System SHALL display a processing animation with message "Analyzing Your Application" while AI scoring is in progress

### Requirement 3: AI Match Score Calculation

**User Story:** As the system, I want to calculate a match score for each candidate using structured form data and optional CV analysis, so that recruiters see candidates ranked by qualification fit.

#### Acceptance Criteria

1. WHEN a candidate application is saved to Azure_Cosmos_DB, THE Aptus_System SHALL trigger a Azure_Functions to calculate the match score within 5 seconds
2. THE Aptus_System SHALL calculate skills match score as 40% of total, using exact match (50%) and semantic similarity (50%) via OpenAI embeddings
3. THE Aptus_System SHALL calculate experience match score as 30% of total, comparing candidate years against job level requirements (Entry=1yr, Mid=3yr, Senior=5yr, Lead=8yr, Executive=12yr)
4. THE Aptus_System SHALL calculate qualifications score as 20% of total, checking for relevant degrees (BSc, MSc, HND, PhD) and certifications (AWS, PMP, Google)
5. THE Aptus_System SHALL calculate application quality score as 10% of total, using OpenAI GPT-3.5-turbo to analyze presence of metrics, clarity, and professionalism in the achievements summary
6. IF a CV file is uploaded, THE Aptus_System SHALL extract text using CV_Parser and use OpenAI GPT-3.5-turbo to identify additional skills and verify qualifications, adjusting scores by up to 10%
7. THE Aptus_System SHALL compute the total match score as a weighted sum of the four components, rounding to the nearest integer percentage
8. WHEN the match score calculation completes, THE Aptus_System SHALL update the candidate record in Azure_Cosmos_DB with the score and component breakdown within 2 seconds
9. IF AI processing fails, THE Aptus_System SHALL retry once, and if still failing, assign a default score of 50% and log the error

### Requirement 4: Semantic Skills Matching

**User Story:** As the AI engine, I want to recognize similar skills even when named differently, so that candidates are not penalized for terminology variations.

#### Acceptance Criteria

1. WHEN calculating skills match score, THE Aptus_System SHALL use OpenAI text-embedding-3-small model to generate vector representations of job required skills and candidate skills
2. THE Aptus_System SHALL calculate cosine similarity between job skills vector and candidate skills vector
3. IF cosine similarity is 0.75 or greater, THE Aptus_System SHALL consider the skills semantically matched
4. THE Aptus_System SHALL combine exact string matches (case-insensitive) and semantic matches to compute the final skills match percentage
5. THE Aptus_System SHALL cache embeddings for common skills to reduce API calls and improve response time

### Requirement 5: Real-Time Candidate Updates

**User Story:** As a recruiter, I want to see new applicants appear immediately in my dashboard without refreshing, so that I can respond quickly to strong candidates.

#### Acceptance Criteria

1. WHEN a recruiter accesses the Admin_Link, THE Aptus_System SHALL establish a Azure_Cosmos_DB listener on "jobs/{job-id}/candidates"
2. WHEN a new candidate application is added to the database, THE Aptus_System SHALL trigger a Real_Time_Update event within 2 seconds
3. WHEN a Real_Time_Update event occurs, THE Aptus_System SHALL insert the new candidate into the Ranking_Table in match score descending order without page refresh
4. WHEN a candidate's match score is updated, THE Aptus_System SHALL re-sort the Ranking_Table in real-time
5. WHEN the applicant count changes, THE Aptus_System SHALL update the dashboard statistics counters in real-time
6. THE Aptus_System SHALL maintain real-time synchronization for up to 100 concurrent recruiter connections per job posting

### Requirement 6: Candidate Ranking Display

**User Story:** As a recruiter, I want to view candidates sorted by match score with visual indicators, so that I can quickly identify top prospects.

#### Acceptance Criteria

1. WHEN a recruiter views the Admin_Dashboard, THE Aptus_System SHALL display candidates in a Ranking_Table sorted by match score in descending order
2. THE Aptus_System SHALL assign rank badges with visual styling: rank 1 (gold), rank 2 (silver), rank 3 (bronze), rank 4+ (gray)
3. THE Aptus_System SHALL display each candidate's name, current role, years of experience, match score (percentage), skills match fraction, and status
4. THE Aptus_System SHALL render match score as a horizontal bar with color coding: 80%+ green, 55-79% blue, below 55% red
5. THE Aptus_System SHALL show skills match as "X/Y skills" badge with color: 75%+ green, 50-74% blue, below 50% red
6. THE Aptus_System SHALL display current status badge: "Pending" (gray), "Shortlisted" (green), "Rejected" (red)
7. THE Aptus_System SHALL provide action buttons "Shortlist" and "Reject" for each candidate, disabling the button if that action is already applied

### Requirement 7: Candidate Shortlisting

**User Story:** As a recruiter, I want to shortlist candidates for interview, so that I can track my selection pipeline.

#### Acceptance Criteria

1. WHEN a recruiter clicks the "Shortlist" button for a candidate, THE Aptus_System SHALL update the candidate's status to "shortlisted" in Azure_Cosmos_DB within 1 second
2. WHEN a candidate is shortlisted, THE Aptus_System SHALL update the status badge to green "Shortlisted" with checkmark icon
3. WHEN a candidate is shortlisted, THE Aptus_System SHALL disable the "Shortlist" button and enable the "Reject" button
4. WHEN a candidate is shortlisted, THE Aptus_System SHALL increment the shortlisted counter in dashboard statistics
5. THE Aptus_System SHALL display a success toast notification "Candidate shortlisted ✓" for 3 seconds

### Requirement 8: Candidate Rejection

**User Story:** As a recruiter, I want to reject candidates and optionally send them a notification, so that candidates receive closure and I maintain organized records.

#### Acceptance Criteria

1. WHEN a recruiter clicks the "Reject" button for a candidate, THE Aptus_System SHALL display a confirmation modal with the candidate's name and a preview of the rejection email
2. THE Aptus_System SHALL pre-populate the rejection email with job title, candidate name, and a professional template message
3. WHEN the recruiter confirms rejection, THE Aptus_System SHALL update the candidate's status to "rejected" in Azure_Cosmos_DB within 1 second
4. WHEN a candidate is rejected with notification, THE Aptus_System SHALL send an email to the candidate's email address using a transactional email service within 10 seconds
5. WHEN a candidate is rejected, THE Aptus_System SHALL update the status badge to red "Rejected" with X icon
6. WHEN a candidate is rejected, THE Aptus_System SHALL disable the "Reject" button and enable the "Shortlist" button
7. THE Aptus_System SHALL display a toast notification "Rejection notification sent" for 3 seconds

### Requirement 9: Platform Source Tracking

**User Story:** As a recruiter, I want to know which distribution platforms bring the best candidates, so that I can focus my posting efforts effectively.

#### Acceptance Criteria

1. WHEN a job posting is created, THE Aptus_System SHALL generate unique Application_Links for each selected distribution platform with source parameter in format "?source={platform-identifier}"
2. WHEN a candidate applies via a tracked link, THE Aptus_System SHALL extract the Source_Parameter from the URL and store it with the application
3. THE Aptus_System SHALL display Platform_Analytics showing each source with: application count, average match score, shortlisted count, and quality rating
4. THE Aptus_System SHALL calculate source quality rating as: 5 stars (avg score 80%+), 4 stars (70-79%), 3 stars (60-69%), 2 stars (50-59%), 1 star (below 50%)
5. THE Aptus_System SHALL sort Platform_Analytics by quality rating descending by default
6. IF a candidate applies without a Source_Parameter, THE Aptus_System SHALL record the source as "direct"

### Requirement 10: CV and Cover Letter Upload

**User Story:** As a candidate, I want to upload my CV and optional cover letter, so that recruiters can review my detailed qualifications.

#### Acceptance Criteria

1. WHEN a candidate selects a CV file, THE Aptus_System SHALL validate the file format is PDF or DOCX and size is 5MB or less before upload
2. IF the file is invalid, THE Aptus_System SHALL display an error message "Please upload a PDF or DOCX file under 5MB" and prevent submission
3. WHEN a valid CV file is selected, THE Aptus_System SHALL upload it to Azure_Blob_Storage at path "cvs/{job-id}/{candidate-id}.{extension}" with a progress indicator
4. WHEN the CV upload completes, THE Aptus_System SHALL display the filename and a "Remove" button, hiding the upload button
5. THE Aptus_System SHALL support optional cover letter upload with the same validation and storage pattern at path "cover-letters/{job-id}/{candidate-id}.{extension}"
6. WHEN a CV file exists in Azure_Blob_Storage, THE Aptus_System SHALL generate a secure download URL valid for 7 days for recruiter access
7. THE Aptus_System SHALL extract text from uploaded PDF/DOCX files using CV_Parser library (pdf-parse for PDF, mammoth for DOCX) within 30 seconds

### Requirement 11: CV Text Extraction and Analysis

**User Story:** As the system, I want to extract and analyze CV content using AI, so that additional skills and qualifications can enhance the match score.

#### Acceptance Criteria

1. WHEN a CV file upload completes, THE Aptus_System SHALL trigger CV_Parser to extract plain text from the document within 30 seconds
2. WHEN text extraction completes, THE Aptus_System SHALL send the extracted text to OpenAI GPT-3.5-turbo with a prompt requesting skills, experience, and qualifications in structured format
3. THE Aptus_System SHALL parse the AI response to identify: additional skills not listed in the form, certification keywords, education level, and quantifiable achievements
4. THE Aptus_System SHALL merge CV-extracted skills with form-submitted skills, removing duplicates, and recalculate the skills match score
5. THE Aptus_System SHALL adjust the qualifications score upward by up to 10 points if CV confirms degrees or certifications not mentioned in the form
6. IF CV parsing or AI analysis fails, THE Aptus_System SHALL log the error and continue with form-based scoring only
7. THE Aptus_System SHALL limit CV text sent to OpenAI to 8000 characters to control costs, truncating if necessary

### Requirement 12: Dashboard Statistics

**User Story:** As a recruiter, I want to see aggregate statistics for my job postings, so that I can monitor recruitment progress at a glance.

#### Acceptance Criteria

1. WHEN a recruiter views the Admin_Dashboard, THE Aptus_System SHALL display four metric cards: Active Jobs, Total Applicants, Shortlisted, and Average Match Score
2. THE Aptus_System SHALL calculate Total Applicants by counting all candidate records for the current job posting
3. THE Aptus_System SHALL calculate Shortlisted by counting candidates with status "shortlisted"
4. THE Aptus_System SHALL calculate Average Match Score by computing the mean of all candidate match scores, rounding to the nearest integer percentage
5. THE Aptus_System SHALL update all statistics in real-time when candidate data changes
6. THE Aptus_System SHALL display a sub-label under each metric providing context (e.g., "Ready for interview" under Shortlisted)

### Requirement 13: Job Link Management

**User Story:** As a recruiter, I want to copy and share the application link easily, so that I can distribute it across platforms without errors.

#### Acceptance Criteria

1. WHEN a job posting is successfully created, THE Aptus_System SHALL display the Application_Link in a copy-friendly text box with a "Copy Link" button
2. WHEN the recruiter clicks "Copy Link", THE Aptus_System SHALL copy the full Application_Link to the system clipboard within 500ms
3. WHEN the link is copied, THE Aptus_System SHALL display a success toast "Link copied to clipboard" for 2 seconds
4. THE Aptus_System SHALL provide a "Preview Candidate Application Page" button that opens the Application_Link in a new browser tab
5. THE Aptus_System SHALL display share buttons for LinkedIn, Jobberman, WhatsApp, Telegram, and Facebook with platform-appropriate icons
6. WHEN a share button is clicked, THE Aptus_System SHALL display a toast indicating the platform (e.g., "Shared to LinkedIn") for user confirmation

### Requirement 14: Application Processing Animation

**User Story:** As a candidate, I want to see a clear indication that my application is being analyzed, so that I understand the system is working and remain engaged.

#### Acceptance Criteria

1. WHEN a candidate submits an application, THE Aptus_System SHALL display a full-screen overlay with animated dots and the message "Analyzing Your Application…"
2. THE Aptus_System SHALL display a sub-message "Aptus AI is scoring your profile against job requirements" below the main title
3. THE Aptus_System SHALL animate three dots in sequence with a pulse effect, repeating continuously while processing
4. WHEN AI match score calculation completes, THE Aptus_System SHALL hide the processing overlay and display the match result within 1 second
5. IF processing takes longer than 30 seconds, THE Aptus_System SHALL update the message to "Still analyzing… This is taking longer than usual" to maintain transparency

### Requirement 15: Match Score Result Display

**User Story:** As a candidate, I want to see my match score and breakdown after applying, so that I understand how well I fit the role.

#### Acceptance Criteria

1. WHEN AI scoring completes successfully, THE Aptus_System SHALL display a match result card with the total match percentage in a large circular badge
2. THE Aptus_System SHALL color-code the match circle: 80%+ green, 55-79% blue, below 55% red
3. THE Aptus_System SHALL display a match label: 80%+ "Excellent Match", 55-79% "Good Match", below 55% "Partial Match"
4. THE Aptus_System SHALL show a breakdown section with four rows: Skills Match, Experience Match, Qualifications, Application Quality, each with an icon, label, and horizontal progress bar
5. THE Aptus_System SHALL animate the progress bars filling from 0% to their final values over 1.2 seconds for visual engagement
6. THE Aptus_System SHALL display a message below the breakdown: "The recruiter will review your application. You'll hear back if shortlisted."
7. THE Aptus_System SHALL provide a "View Application" button that displays the submitted form data for candidate review

### Requirement 16: Northern Nigerian State Location Selection

**User Story:** As a recruiter, I want to select job locations from a dropdown of Northern Nigerian states, so that location data is consistent and relevant to our target market.

#### Acceptance Criteria

1. THE Aptus_System SHALL provide a location input field with autocomplete suggestions for the job posting form
2. THE Aptus_System SHALL restrict location suggestions to the 18 Northern Nigerian states: Bauchi, Benue, Borno, Gombe, Jigawa, Kaduna, Kano, Katsina, Kebbi, Kogi, Kwara, Nasarawa, Niger, Plateau, Sokoto, Taraba, Yobe, Zamfara
3. WHEN a recruiter types in the location field, THE Aptus_System SHALL filter and display matching state names in real-time
4. WHEN a recruiter selects a state from the dropdown, THE Aptus_System SHALL populate the input field with the selected state name
5. THE Aptus_System SHALL allow the recruiter to type "Remote (Nigeria)" or a specific city with state in parentheses (e.g., "Lagos, Nigeria")

### Requirement 17: Cost-Efficient AI Processing

**User Story:** As the system, I want to minimize AI API costs while maintaining quality, so that the platform remains profitable at scale.

#### Acceptance Criteria

1. THE Aptus_System SHALL use OpenAI text-embedding-3-small model (not ada-002) for embeddings to optimize cost vs. quality
2. THE Aptus_System SHALL use GPT-3.5-turbo (not GPT-4) for text analysis to maintain low per-candidate costs
3. THE Aptus_System SHALL limit GPT-3.5-turbo quality assessment prompts to 100 input tokens and 10 output tokens maximum
4. THE Aptus_System SHALL cache skill embeddings for frequently used skills (e.g., "Python", "JavaScript", "Project Management") to avoid redundant API calls
5. WHEN CV text exceeds 8000 characters, THE Aptus_System SHALL truncate to the first 8000 characters before sending to OpenAI to control costs
6. THE Aptus_System SHALL process AI scoring asynchronously using Azure_Functionss to avoid blocking the application submission flow
7. THE Aptus_System SHALL log OpenAI token usage for each candidate to enable cost monitoring and optimization

### Requirement 18: Error Handling and Resilience

**User Story:** As a user, I want the system to handle errors gracefully and provide helpful feedback, so that temporary issues don't block my workflow.

#### Acceptance Criteria

1. IF Azure_Cosmos_DB connection fails during job creation, THE Aptus_System SHALL display an error message "Unable to save job posting. Please check your connection and retry." and allow resubmission
2. IF OpenAI_API returns an error during scoring, THE Aptus_System SHALL retry once after a 2-second delay, and if still failing, assign a default score of 50% and log the error with candidate ID and timestamp
3. IF CV upload to Azure_Blob_Storage fails, THE Aptus_System SHALL display "CV upload failed. Please try again." and allow re-upload without losing form data
4. IF CV_Parser fails to extract text, THE Aptus_System SHALL log the error, continue with form-based scoring, and mark the CV as "text extraction failed" in the candidate record
5. THE Aptus_System SHALL display user-friendly error messages without exposing technical stack traces or API keys
6. WHEN a Real_Time_Update event fails to deliver, THE Aptus_System SHALL automatically reconnect to Azure_Cosmos_DB within 5 seconds and re-synchronize data
7. THE Aptus_System SHALL validate all form inputs client-side before submission to reduce server errors and improve user experience

### Requirement 19: Multi-Step Job Creation Flow

**User Story:** As a recruiter, I want to create a job posting in clear steps with progress indication, so that the process feels organized and manageable.

#### Acceptance Criteria

1. THE Aptus_System SHALL divide job creation into three steps: "Job Details", "Distribution", and "Published", with a visual progress indicator at the top
2. WHEN a recruiter is on Step 1, THE Aptus_System SHALL display "Job Details" as active, "Distribution" and "Published" as inactive, with step numbers and labels
3. WHEN the recruiter clicks "Continue to Distribution", THE Aptus_System SHALL validate all required Step 1 fields and display field-specific errors if validation fails
4. IF Step 1 validation succeeds, THE Aptus_System SHALL hide Step 1, display Step 2, and update the progress indicator to show Step 2 as active and Step 1 as completed
5. WHEN the recruiter clicks "Back" on Step 2, THE Aptus_System SHALL return to Step 1 without losing entered data
6. WHEN the recruiter clicks "Publish Job" on Step 2, THE Aptus_System SHALL save the job to Azure_Cosmos_DB, generate links, and display Step 3 with success confirmation
7. THE Aptus_System SHALL display Step 3 as read-only with no back button, providing "View Dashboard" and "View Applicants" navigation options

### Requirement 20: Distribution Channel Selection

**User Story:** As a recruiter, I want to select which platforms will receive my job posting, so that I can target the most relevant communities.

#### Acceptance Criteria

1. WHEN a recruiter reaches Step 2 of job creation, THE Aptus_System SHALL display a grid of 12 distribution channel cards with platform name, icon, type (WhatsApp/Telegram/Facebook), and member count
2. WHEN a recruiter clicks a channel card, THE Aptus_System SHALL toggle selection, adding a checkmark icon and highlighting the card with blue border and light blue background
3. WHEN a recruiter clicks a selected card, THE Aptus_System SHALL deselect it, removing the checkmark and highlight
4. THE Aptus_System SHALL allow selecting zero or more distribution channels, treating Step 2 as optional
5. WHEN the recruiter publishes the job, THE Aptus_System SHALL generate a unique Application_Link with source parameter for each selected channel
6. THE Aptus_System SHALL display an informational section on Step 2 explaining the benefit of community distribution, member reach (340,000+), and pay-per-applicant pricing model

### Requirement 21: Parser Integration for CV and Cover Letter

**User Story:** As the system, I want to parse PDF and DOCX files reliably, so that CV content can be analyzed without manual intervention.

#### Acceptance Criteria

1. THE Aptus_System SHALL use the pdf-parse library to extract text from PDF files uploaded as CVs or cover letters
2. THE Aptus_System SHALL use the mammoth library to extract text from DOCX files uploaded as CVs or cover letters
3. WHEN pdf-parse or mammoth completes extraction, THE Aptus_System SHALL return plain text with preserved line breaks and spacing where possible
4. IF a PDF is encrypted or password-protected, THE Aptus_System SHALL log the error, skip text extraction, and display a message to the candidate "Unable to read CV. Please upload an unprotected PDF."
5. THE Aptus_System SHALL handle multi-page PDFs, extracting text from all pages sequentially
6. THE Aptus_System SHALL detect and handle common CV formatting issues (e.g., tables, columns, embedded images) by extracting text in reading order
7. WHEN text extraction takes longer than 30 seconds, THE Aptus_System SHALL timeout, log the error, and continue without CV analysis

### Requirement 22: Pretty Printer for Job Posting Data

**User Story:** As the system, I want to format job posting data into a human-readable structure, so that it can be shared consistently across platforms.

#### Acceptance Criteria

1. THE Aptus_System SHALL provide a Pretty_Printer function that accepts a Job_Posting object and returns formatted plain text
2. THE Pretty_Printer SHALL format job postings with sections: Title, Location, Experience Level, Department, Description, Required Skills (bullet list), Key Qualifications
3. WHEN the recruiter copies the Application_Link, THE Aptus_System SHALL also provide a "Copy Job Description" button that copies the pretty-printed text to clipboard
4. THE Pretty_Printer SHALL format skills as a bulleted list with "• " prefix for each skill
5. THE Pretty_Printer SHALL wrap long descriptions at 80 characters per line for readability in plain text contexts
6. FOR ALL valid Job_Posting objects, formatting then parsing then formatting SHALL produce an equivalent output (idempotence property)

### Requirement 23: Round-Trip Property for Job Data

**User Story:** As the system, I want to ensure job data integrity through serialization and deserialization, so that no information is lost when saving and retrieving jobs.

#### Acceptance Criteria

1. WHEN a Job_Posting object is serialized to JSON and saved to Azure_Cosmos_DB, THE Aptus_System SHALL preserve all fields exactly
2. WHEN a Job_Posting object is retrieved from Azure_Cosmos_DB and deserialized, THE Aptus_System SHALL reconstruct the object with identical field values and types
3. THE Aptus_System SHALL validate that for any Job_Posting object J, deserialize(serialize(J)) equals J for all required and optional fields
4. THE Aptus_System SHALL preserve array order for skills and selected distribution channels through round-trip serialization
5. THE Aptus_System SHALL handle null/undefined optional fields consistently, treating them as absent rather than converting to empty strings

### Requirement 24: Application Status Workflow

**User Story:** As the system, I want to manage candidate status transitions clearly, so that data integrity is maintained and invalid state changes are prevented.

#### Acceptance Criteria

1. WHEN a candidate application is created, THE Aptus_System SHALL set the initial status to "pending"
2. THE Aptus_System SHALL allow status transitions: "pending" → "shortlisted", "pending" → "rejected", "shortlisted" → "rejected", "rejected" → "shortlisted"
3. THE Aptus_System SHALL prevent invalid status transitions by disabling UI buttons for already-applied actions
4. WHEN a status is updated, THE Aptus_System SHALL record a timestamp in format ISO 8601 in a statusHistory array for audit purposes
5. THE Aptus_System SHALL ensure that only one status can be active at a time per candidate

### Requirement 25: Candidate Data Privacy

**User Story:** As a candidate, I want my personal data to be stored securely and accessed only by authorized recruiters, so that my privacy is protected.

#### Acceptance Criteria

1. THE Aptus_System SHALL store candidate data in Azure_Cosmos_DB under "jobs/{job-id}/candidates/{candidate-id}" with access restricted to the job's Admin_Link
2. THE Aptus_System SHALL not expose candidate email addresses, phone numbers, or CV download URLs in publicly accessible Application_Links
3. THE Aptus_System SHALL generate Azure_Blob_Storage download URLs for CVs with 7-day expiration and signed access tokens
4. THE Aptus_System SHALL not transmit candidate data to third-party services except OpenAI_API for scoring, and only transmit non-identifiable content (skills, achievements text)
5. THE Aptus_System SHALL not include candidate names or contact information in AI prompts sent to OpenAI_API
6. THE Aptus_System SHALL use HTTPS for all client-server communication to prevent data interception
7. THE Aptus_System SHALL comply with basic data protection principles: purpose limitation, data minimization, and secure storage



