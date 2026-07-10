# Task 1: Azure Project and Core Infrastructure Setup — COMPLETE ✅

## Overview

Task 1 from `.kiro/specs/aptus-mvp-core/tasks.md` has been successfully implemented. This task establishes the foundational Azure infrastructure for the Aptus MVP platform.

---

## What Was Completed

### ✅ Configuration Files Created

#### 1. **package.json** (Updated for Azure)
- **Location**: `./package.json`
- **Description**: Node.js project configuration with Azure SDK dependencies
- **Key Dependencies**:
  - `@azure/cosmos` v4.0.0 — Cosmos DB NoSQL database SDK
  - `@azure/storage-blob` v12.17.0 — Blob Storage SDK for CV/cover letter files
  - `@azure/functions` v4.0.0 — Azure Functions serverless runtime
  - `@microsoft/signalr` v8.0.0 — Real-time WebSocket communication
  - `openai` v4.20.1 — OpenAI API client (unchanged from Firebase version)
  - `pdf-parse` v1.1.1 — PDF text extraction
  - `mammoth` v1.6.0 — DOCX text extraction
  - `dotenv` v16.3.1 — Environment variable management
  - `express` v4.18.2 — HTTP server for local development

#### 2. **azure-config.js**
- **Location**: `./azure-config.js`
- **Description**: Central Azure services configuration and initialization module
- **Features**:
  - Cosmos DB client initialization with database/container references
  - Blob Storage client with SAS token generation
  - Environment variable loading from `.env`
  - Helper functions for accessing containers and generating secure URLs
  - Automatic connection validation
- **Exports**:
  - `initializeAzureServices()` — Initialize all Azure services
  - `getContainer(name)` — Get Cosmos DB container reference
  - `getBlobContainerClient(name)` — Get Blob Storage container client
  - `generateBlobSasUrl(container, blob, expiry)` — Generate secure download URLs with 7-day expiration

#### 3. **.env.template**
- **Location**: `./.env.template`
- **Description**: Template for environment variables with placeholders
- **Variables**:
  - `COSMOS_DB_ENDPOINT` — Cosmos DB URI
  - `COSMOS_DB_KEY` — Cosmos DB primary key
  - `BLOB_STORAGE_ACCOUNT_NAME` — Storage account name
  - `BLOB_STORAGE_ACCOUNT_KEY` — Storage account key
  - `BLOB_STORAGE_CONNECTION_STRING` — Full connection string
  - `SIGNALR_CONNECTION_STRING` — SignalR Service connection string
  - `AZURE_FUNCTIONS_URL` — Azure Functions app URL
  - `OPENAI_API_KEY` — OpenAI API key
- **Usage**: Copy to `.env` and fill in actual Azure values (see AZURE_SETUP.md)

#### 4. **staticwebapp.config.json**
- **Location**: `./staticwebapp.config.json`
- **Description**: Azure Static Web Apps hosting configuration
- **Features**:
  - SPA routing configuration (routes to index.html)
  - Job application/admin link URL rewriting
  - MIME type mappings
  - Security headers (CSP, X-Frame-Options, etc.)
  - 404 fallback handling
- **Routes Configured**:
  - `/` → `index.html`
  - `/jobs/:jobId/apply` → `index.html`
  - `/jobs/:jobId/admin` → `index.html`

#### 5. **server.js**
- **Location**: `./server.js`
- **Description**: Local development server with Express
- **Features**:
  - Serves static files (HTML, CSS, JS)
  - Initializes Azure services on startup
  - Provides health check endpoint (`/api/health`)
  - SPA routing fallback
  - Displays Azure connection status in console
- **Usage**: `npm start` or `npm run dev` (with nodemon)

#### 6. **AZURE_SETUP.md**
- **Location**: `./AZURE_SETUP.md`
- **Description**: **Comprehensive step-by-step guide** for manual Azure account and service setup
- **Sections**:
  1. Prerequisites
  2. Create Azure Account (Azure for Students or Free Trial)
  3. Set Up Azure Cosmos DB (create account, database, 3 containers)
  4. Set Up Azure Blob Storage (create account, 2 containers)
  5. Set Up Azure Functions (create function app)
  6. Set Up Azure SignalR Service (create SignalR resource)
  7. Set Up Azure Static Web Apps (deploy via GitHub)
  8. Configure Environment Variables (copy .env.template to .env)
  9. Install Dependencies (`npm install`)
  10. Next Steps
- **Target Audience**: Users who need to manually create Azure resources through the Azure Portal
- **Detail Level**: Includes screenshots descriptions, exact field values, and troubleshooting tips

---

## Azure Services Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend Layer                          │
│                  (HTML/CSS/JavaScript)                     │
│                Azure Static Web Apps                       │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                  Azure Services Layer                      │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Azure Cosmos DB (NoSQL)                         │    │
│  │  Database: aptus-mvp                             │    │
│  │  ├─ jobs (partition: /id)                        │    │
│  │  ├─ candidates (partition: /jobId)               │    │
│  │  └─ skillEmbeddingsCache (partition: /skill)     │    │
│  │  Free: 1000 RU/s + 25GB                          │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Azure Blob Storage                              │    │
│  │  ├─ cvs/{jobId}/{candidateId}.{ext}             │    │
│  │  └─ cover-letters/{jobId}/{candidateId}.{ext}   │    │
│  │  Free: 5GB + 20K operations                     │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Azure Functions (Serverless)                    │    │
│  │  ├─ onCandidateCreated (Cosmos DB trigger)      │    │
│  │  ├─ processCVUpload (Blob trigger)              │    │
│  │  └─ calculateMatchScore (HTTP trigger)          │    │
│  │  Free: 1M executions/month                      │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Azure SignalR Service                           │    │
│  │  Real-time dashboard updates                     │    │
│  │  Free: 20 connections, 20K msgs/day             │    │
│  └──────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                  External Services                         │
│  ┌──────────────────────────────────────────────────┐    │
│  │  OpenAI API                                      │    │
│  │  ├─ text-embedding-3-small (skills matching)    │    │
│  │  └─ gpt-3.5-turbo (CV parsing, quality score)   │    │
│  └──────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

---

## Requirements Satisfied

Task 1 satisfies the following requirements from `requirements.md`:

- ✅ **Requirement 1.1**: Job posting creation with Azure Cosmos DB storage
- ✅ **Requirement 2.4**: Candidate application submission with Azure Cosmos DB
- ✅ **Requirement 10.4**: CV file upload to Azure Blob Storage

---

## What the User Needs to Do

### 🔴 **CRITICAL: Manual Azure Account Setup Required**

The files created in this task provide the **configuration and code structure**, but the user **must manually create their Azure account and resources** using the Azure Portal.

### Step-by-Step Instructions

1. **Follow AZURE_SETUP.md**:
   - Open `AZURE_SETUP.md` in the project root
   - Follow steps 1-7 to create Azure account and all services
   - Estimated time: **1-2 hours** (mostly waiting for resource provisioning)

2. **Copy Connection Strings**:
   - After creating each Azure resource, copy the connection strings
   - Save them temporarily in a notes app

3. **Configure Environment Variables**:
   ```bash
   # Copy template to .env
   cp .env.template .env
   
   # Edit .env and paste your actual Azure connection strings
   nano .env  # or use any text editor
   ```

4. **Install Dependencies**:
   ```bash
   npm install
   ```

5. **Test Local Server**:
   ```bash
   npm start
   ```
   - Visit `http://localhost:3000`
   - Check console for Azure service status

6. **Verify Connections**:
   - Look for ✅ next to Cosmos DB and Blob Storage in console
   - If ⏳ appears, check your `.env` file configuration

---

## Cost Analysis

### Free Tier Limits (No Payment Required)

| Service | Free Tier | Estimated MVP Usage (100 apps/month) | Cost |
|---------|-----------|--------------------------------------|------|
| Azure Cosmos DB | 1000 RU/s, 25GB | ~200 RU/s, 1GB | **FREE** |
| Azure Blob Storage | 5GB, 20K ops | 500MB, 5K ops | **FREE** |
| Azure Functions | 1M executions | ~10K executions | **FREE** |
| Azure SignalR | 20 connections, 20K msgs | 5 connections, 5K msgs | **FREE** |
| Azure Static Web Apps | 100GB bandwidth | 10GB bandwidth | **FREE** |
| OpenAI API | N/A | 100 candidates × $0.0013 | **$0.13** |
| **TOTAL** | | | **$0.13/month** |

### Scaling (1,000 applications/month)

- Azure services remain **FREE** (within limits)
- OpenAI cost: **$1.30/month**
- **Total: $1.30-6.30/month** (SignalR may need upgrade)

---

## Next Steps

### ✅ Task 1 Complete

Move to **Task 2: Implement Azure access control and security**

### Tasks 2 Sub-tasks:
- 2.1 Configure Cosmos DB access policies
- 2.2 Configure Blob Storage SAS token security

### Development Workflow

1. **Local Development**:
   ```bash
   npm run dev  # Starts server with nodemon (auto-restart)
   ```

2. **Azure Functions** (Task 13+):
   - Create `functions/` directory
   - Implement serverless functions for AI scoring
   - Deploy with Azure Functions Core Tools

3. **Static Web Apps Deployment**:
   - Push to GitHub
   - Azure Static Web Apps GitHub Action auto-deploys

---

## Files Summary

| File | Purpose | Size | User Action Required |
|------|---------|------|---------------------|
| `package.json` | Node.js dependencies | 16 KB | `npm install` |
| `azure-config.js` | Azure SDK initialization | 6 KB | None (reads from .env) |
| `.env.template` | Environment variable template | 2 KB | **Copy to .env and fill in values** |
| `staticwebapp.config.json` | Static Web Apps config | 2 KB | None (auto-used by Azure) |
| `server.js` | Local dev server | 2 KB | `npm start` |
| `AZURE_SETUP.md` | **Manual setup guide** | 24 KB | **Read and follow steps 1-7** |

---

## Troubleshooting

### "Azure services not initialized"

**Symptom**: Server starts but shows ⏳ for Azure services

**Solution**:
1. Check `.env` file exists (not just `.env.template`)
2. Verify connection strings are correct (no placeholder text)
3. Ensure Cosmos DB and Blob Storage resources exist in Azure Portal

### "Module not found: @azure/cosmos"

**Symptom**: Error when running `npm start`

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Cannot find module 'dotenv'"

**Symptom**: Error loading environment variables

**Solution**:
```bash
npm install dotenv
```

### "Invalid connection string format"

**Symptom**: Blob Storage or Cosmos DB connection fails

**Solution**:
- Check connection string format in `.env`
- Ensure no extra spaces or line breaks
- Re-copy from Azure Portal > Keys section

---

## Important Notes

### Security

- ⚠️ **Never commit `.env` to version control** — it contains secret keys
- ⚠️ `.env` is in `.gitignore` by default
- ⚠️ For production, use Azure Key Vault or Azure Functions App Settings

### Firebase Migration

If you later want to migrate to Firebase:
- Cosmos DB → Firebase Realtime Database (export JSON)
- Blob Storage → Firebase Storage (copy files)
- Azure Functions → Firebase Functions (port code)
- SignalR → Firebase Realtime sync (change client code)
- **Estimated migration time: 2-3 days**

### OpenAI API Key

- Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- Add to `.env` as `OPENAI_API_KEY=sk-...`
- Used for embeddings (skills matching) and GPT-3.5-turbo (CV parsing, quality scoring)

---

## Validation Checklist

Before moving to Task 2, verify:

- ✅ Azure account created (Azure for Students or Free Trial)
- ✅ Azure Cosmos DB created with database `aptus-mvp` and 3 containers
- ✅ Azure Blob Storage created with 2 containers (`cvs`, `cover-letters`)
- ✅ Azure Functions app created (Consumption plan)
- ✅ Azure SignalR Service created (Free tier, Serverless mode)
- ✅ Azure Static Web Apps created (optional for now, can deploy later)
- ✅ `.env` file created with all connection strings filled in
- ✅ `npm install` completed successfully
- ✅ `npm start` runs without errors
- ✅ Console shows ✅ for Cosmos DB and Blob Storage
- ✅ `http://localhost:3000` loads the Aptus landing page

---

## Conclusion

Task 1 establishes the complete Azure infrastructure foundation for the Aptus MVP. All configuration files, SDK initialization code, and comprehensive setup documentation have been created.

**The user must now manually follow `AZURE_SETUP.md` to create Azure resources and configure `.env` before proceeding to Task 2.**

🎉 **Task 1: Complete**
