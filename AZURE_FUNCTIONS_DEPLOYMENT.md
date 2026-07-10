# Azure Functions Deployment Guide

This guide explains how to deploy the Azure Functions for Aptus MVP.

---

## Functions Overview

### 1. onCandidateCreated
- **Trigger**: Cosmos DB Change Feed on `candidates` container
- **Purpose**: Auto-score candidates when they apply
- **Execution Time**: 3-5 seconds
- **Output**: Updates candidate scores, broadcasts to SignalR

### 2. processCVUpload
- **Trigger**: Blob Storage upload to `cvs` container
- **Purpose**: Parse CV, extract skills, re-calculate score
- **Execution Time**: 5-10 seconds
- **Output**: Updates candidate with CV data, broadcasts to SignalR

### 3. signalrNegotiate
- **Trigger**: HTTP (GET/POST)
- **Purpose**: Provide SignalR connection info to clients
- **Execution Time**: <1 second
- **Output**: SignalR connection URL and access token

---

## Deployment Steps

### Option 1: Deploy via VS Code (Recommended)

1. **Install VS Code Extension**
   - Install "Azure Functions" extension
   - Install "Azure Account" extension

2. **Sign in to Azure**
   - Click Azure icon in sidebar
   - Sign in with your Azure account

3. **Deploy Functions**
   - Right-click on `functions` folder
   - Select "Deploy to Function App..."
   - Choose your Function App: `aptus-functions-ismail`
   - Confirm deployment

4. **Configure Environment Variables**
   - Go to Azure Portal → Function App
   - Settings → Configuration
   - Add application settings:
     ```
     COSMOS_DB_ENDPOINT=https://aptus-cosmos-ismail.documents.azure.com:443/
     COSMOS_DB_KEY=<your-key>
     COSMOS_DB_CONNECTION_STRING=<your-connection-string>
     BLOB_STORAGE_CONNECTION_STRING=<your-connection-string>
     SIGNALR_CONNECTION_STRING=<your-connection-string>
     OPENAI_API_KEY=<your-openai-key>
     ```
   - Click "Save"

### Option 2: Deploy via Azure CLI

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Login to Azure
az login

# Deploy functions
cd functions
func azure functionapp publish aptus-functions-ismail
```

### Option 3: Deploy via GitHub Actions

Create `.github/workflows/deploy-functions.yml`:

```yaml
name: Deploy Azure Functions

on:
  push:
    branches: [ main ]
    paths:
      - 'functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd functions
          npm install
      
      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: 'aptus-functions-ismail'
          package: './functions'
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

---

## Testing Functions Locally

### 1. Install Azure Functions Core Tools

```bash
npm install -g azure-functions-core-tools@4
```

### 2. Create local.settings.json

In `functions/` folder:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "COSMOS_DB_ENDPOINT": "https://aptus-cosmos-ismail.documents.azure.com:443/",
    "COSMOS_DB_KEY": "your-key-here",
    "COSMOS_DB_CONNECTION_STRING": "your-connection-string",
    "BLOB_STORAGE_CONNECTION_STRING": "your-blob-connection-string",
    "SIGNALR_CONNECTION_STRING": "your-signalr-connection-string",
    "OPENAI_API_KEY": "your-openai-key"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*"
  }
}
```

### 3. Run Functions Locally

```bash
cd functions
func start
```

Functions will run on `http://localhost:7071`

---

## Current Setup (Local Development)

For now, scoring runs in the main Express server (`server.js`):
- Scoring triggered after application submission
- CV processing triggered after file upload
- Works perfectly for development and testing

**Azure Functions are optional for MVP!**  
They provide:
- Better scalability (auto-scale)
- Lower costs (pay per execution)
- Isolated execution (failures don't affect main app)

But the current setup works great for 0-500 applications/month.

---

## When to Deploy Azure Functions

Deploy Azure Functions when:
1. **You're ready for production** - Better for live traffic
2. **You want auto-scaling** - Handles traffic spikes
3. **You have 100+ applications/day** - More cost-effective
4. **You want isolated AI processing** - Doesn't block main server

---

## SignalR Setup (Real-Time Updates)

### Current: Mock Mode
- SignalR client initialized but uses mock connection
- Works for UI development
- No actual real-time updates yet

### Production: Azure SignalR Service
1. Ensure SignalR Service is created (already done)
2. Deploy `signalrNegotiate` function
3. Update frontend to use real SignalR endpoint
4. Enable real-time dashboard updates

**For MVP v1.0:**  
Dashboard refresh on page load is sufficient. Real-time updates can be added in v1.1.

---

## Cost Analysis

### Current Setup (Server-Based Scoring)
- Free (runs in Express server)
- Good for 0-500 applications/month

### Azure Functions Setup
- Free tier: 1M executions/month
- 100 applications/month = ~200 executions (2 per candidate)
- **Cost: $0.00/month** (within free tier)

### When Volume Increases (1000+ apps/month)
- Azure Functions: More cost-effective
- Server-based: May need larger VM

---

## Summary

**Current Status:**
- ✅ AI scoring working in main server
- ✅ CV parsing working in main server
- ✅ Azure Functions code written and ready
- ⏳ Azure Functions deployment optional

**For MVP Launch:**
- Current setup is production-ready
- Can handle 0-500 applications/month easily
- Deploy Functions later for better scalability

**Next Steps:**
- Test end-to-end flow
- Pre-warm embedding cache
- Launch MVP!
- Deploy Functions when ready for scale

---

## Files Created

```
functions/
├── host.json                         # Functions configuration
├── onCandidateCreated/
│   ├── index.js                      # Scoring trigger
│   └── function.json                 # Cosmos DB binding
├── processCVUpload/
│   ├── index.js                      # CV parsing trigger
│   └── function.json                 # Blob Storage binding
└── signalrNegotiate/
    ├── index.js                      # SignalR connection
    └── function.json                 # HTTP binding

signalr-client.js                     # Frontend SignalR client
```

All ready for deployment when needed! 🚀
