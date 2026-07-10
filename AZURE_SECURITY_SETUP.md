# Azure Security Configuration Guide

This guide explains how to configure security settings in the Azure Portal for the Aptus MVP.

---

## Overview

Task 2 implements two main security features:

1. **Cosmos DB Access Policies** - Control who can read/write data
2. **Blob Storage SAS Tokens** - Secure, time-limited file access

Most security features are **implemented in code** (`azure-security.js`), but some require **Azure Portal configuration**.

---

## Part 1: Cosmos DB Security (Portal Configuration)

### 1.1 Configure Index Policies for Performance

Index policies help queries run faster on `status` and `scores.total` fields.

**Steps:**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Cosmos DB account: **`aptus-cosmos-ismail`**
3. In left menu, click **"Data Explorer"**
4. Expand `aptus-mvp` database
5. Click on **`candidates`** container
6. Click **"Settings"** (gear icon)
7. Scroll to **"Indexing Policy"** section
8. Replace the existing JSON with:

```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {
      "path": "/*"
    }
  ],
  "excludedPaths": [
    {
      "path": "/_etag/?"
    }
  ],
  "compositeIndexes": [
    [
      {
        "path": "/jobId",
        "order": "ascending"
      },
      {
        "path": "/scores/total",
        "order": "descending"
      }
    ],
    [
      {
        "path": "/jobId",
        "order": "ascending"
      },
      {
        "path": "/status",
        "order": "ascending"
      }
    ],
    [
      {
        "path": "/jobId",
        "order": "ascending"
      },
      {
        "path": "/appliedAt",
        "order": "descending"
      }
    ]
  ]
}
```

9. Click **"Save"**

**What this does:**
- Optimizes queries that filter by `jobId` and sort by `scores.total` (for rankings)
- Optimizes queries that filter by `jobId` and `status` (for shortlisted candidates)
- Optimizes queries that filter by `jobId` and `appliedAt` (for recent applications)

### 1.2 Configure Firewall Rules (Optional - for Production)

For MVP, we'll keep "All networks" enabled. In production, you'd restrict access.

**Future Production Setup (skip for now):**

1. In Cosmos DB account, go to **"Networking"**
2. Select **"Selected networks"**
3. Add IP addresses:
   - Your Azure Functions app IP
   - Your Azure Static Web Apps IP
4. Save

**Current MVP Setup:** Leave as "All networks" ✅

---

## Part 2: Blob Storage Security (Code-Based)

Blob Storage security is **already implemented in code** via `azure-security.js`:

### ✅ Features Implemented

1. **SAS Token Generation**
   - Function: `generateBlobSasUrl()`
   - Creates read-only URLs that expire after 7 days
   - HTTPS-only access
   - Blob-level access (cannot list other files)

2. **File Upload Validation**
   - Function: `validateFileUpload()`
   - Max size: 5MB
   - Allowed types: PDF, DOCX only

3. **Secure URL Generation**
   - `generateCvSasUrl()` - For CVs
   - `generateCoverLetterSasUrl()` - For cover letters
   - Fresh tokens generated on each access

### 🔒 Security Features

**What's Protected:**
- ✅ No permanent URLs (all time-limited)
- ✅ Read-only access (cannot modify or delete files)
- ✅ Blob-level access (cannot list all files in container)
- ✅ HTTPS-only (no HTTP access)
- ✅ Connection strings never exposed to client

**Container Settings (already configured in Task 1):**
- `cvs` container: Private access ✅
- `cover-letters` container: Private access ✅

---

## Part 3: Data Privacy Controls (Code-Based)

Privacy controls are implemented in `azure-security.js`:

### ✅ Privacy Functions

1. **`sanitizeCandidateData()`**
   - Removes email, phone, LinkedIn from public API responses
   - Used when displaying match results to candidates

2. **`sanitizeCandidateDataForAdmin()`**
   - Includes contact info but regenerates SAS tokens
   - Used in recruiter dashboard
   - Tokens expire after 1 day (shorter than default 7 days)

3. **`createPartitionScopedQuery()`**
   - Ensures queries are scoped to a single job
   - Prevents recruiters from seeing candidates from other jobs
   - Privacy-by-design approach

4. **`isPartitionScopedQuery()`**
   - Validates that queries include jobId filter
   - Prevents cross-partition data leaks

---

## Part 4: Security Best Practices

### ✅ Already Implemented

1. **Environment Variables**
   - All secrets in `.env` file
   - Never committed to Git (in `.gitignore`)
   - Loaded with `dotenv` package

2. **Server-Side Only**
   - Connection strings only in server code
   - SAS tokens generated server-side
   - Client receives only time-limited URLs

3. **HTTPS Enforcement**
   - All SAS tokens require HTTPS
   - Azure Static Web Apps provides free SSL

4. **Partition Key Design**
   - `jobs` container: partitioned by `/id`
   - `candidates` container: partitioned by `/jobId`
   - Enables efficient privacy-scoped queries

### 🔐 Production Recommendations (Future)

When moving to production, also configure:

1. **Azure Key Vault**
   - Store connection strings in Key Vault
   - Reference from Azure Functions

2. **Managed Identities**
   - Use Azure AD authentication
   - Remove connection string keys

3. **Network Isolation**
   - Enable Cosmos DB firewall
   - Use Private Endpoints for Blob Storage

4. **DDoS Protection**
   - Enable Azure DDoS Protection Standard
   - Configure rate limiting

---

## Testing Security Features

### Test SAS Token Generation

Create a test file: `test-security.js`

```javascript
const { initializeBlobSecurity, generateCvSasUrl } = require('./azure-security');

// Initialize
initializeBlobSecurity();

// Generate a test SAS URL
const testUrl = generateCvSasUrl('JOB-2024-TEST', 'candidate-123', 'pdf', 7);

console.log('Test SAS URL:', testUrl);
console.log('✅ URL should expire in 7 days');
console.log('✅ URL should start with https://');
console.log('✅ URL should include ?sv= (SAS token)');
```

Run: `node test-security.js`

### Test Data Sanitization

```javascript
const { sanitizeCandidateData } = require('./azure-security');

const candidate = {
  id: 'c123',
  jobId: 'j456',
  fullName: 'John Doe',
  email: 'john@example.com', // SENSITIVE
  phone: '+234 123 4567', // SENSITIVE
  currentRole: 'Developer',
  scores: { total: 85 }
};

const sanitized = sanitizeCandidateData(candidate);

console.log('Original:', candidate);
console.log('Sanitized:', sanitized);
console.log('✅ Email should be removed:', !sanitized.email);
console.log('✅ Phone should be removed:', !sanitized.phone);
```

---

## Verification Checklist

### Task 2.1: Cosmos DB Access Policies ✅

- ✅ Index policies configured for `candidates` container
- ✅ Partition-scoped query functions created
- ✅ Data sanitization functions created
- ✅ Privacy controls implemented in code

### Task 2.2: Blob Storage SAS Token Security ✅

- ✅ SAS token generation function created
- ✅ Read-only permissions enforced
- ✅ 7-day expiration configured
- ✅ Blob-level access (not container-level)
- ✅ HTTPS-only access
- ✅ Connection strings in environment variables (not client code)
- ✅ File upload validation implemented

---

## Summary

### What You Did

1. ✅ **Created `azure-security.js`** - Complete security module
2. ✅ **Updated `server.js`** - Initialize security on startup
3. ⏳ **Configure index policies** - Do this in Azure Portal now

### What's Protected

- **Candidate Privacy**: Email, phone, LinkedIn never exposed publicly
- **File Security**: Time-limited, read-only URLs for CVs
- **Query Isolation**: Candidates scoped to their job (no cross-job queries)
- **Connection Security**: Keys never exposed to client code

### Cost Impact

**$0.00** - All security features use existing free tier resources!

---

## Next Steps

After completing Task 2:

1. Configure index policies in Azure Portal (5 minutes)
2. Test SAS token generation (optional)
3. Move to **Task 3: Implement Job Posting Manager**

---

## Requirements Satisfied

Task 2 satisfies:

- ✅ **Requirement 10.6**: CV files secured with SAS tokens (7-day expiry)
- ✅ **Requirement 25.1**: Candidate data accessible only via Admin_Link
- ✅ **Requirement 25.2**: Partition-scoped queries prevent cross-job data access
- ✅ **Requirement 25.3**: Blob access controlled with SAS tokens (not public URLs)
- ✅ **Requirement 25.6**: HTTPS enforced for all blob access

---

**Task 2 Code Complete! ✅**

Azure Portal configuration: ~5 minutes (index policies only)
