# Aptus MVP — Azure Setup Guide

This guide walks you through setting up all Azure services needed for the Aptus MVP platform. **All services use Azure's free tier** — no upfront payment required.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Azure Account](#step-1-create-azure-account)
3. [Step 2: Set Up Azure Cosmos DB](#step-2-set-up-azure-cosmos-db)
4. [Step 3: Set Up Azure Blob Storage](#step-3-set-up-azure-blob-storage)
5. [Step 4: Set Up Azure Functions](#step-4-set-up-azure-functions)
6. [Step 5: Set Up Azure SignalR Service](#step-5-set-up-azure-signalr-service)
7. [Step 6: Set Up Azure Static Web Apps](#step-6-set-up-azure-static-web-apps)
8. [Step 7: Configure Environment Variables](#step-7-configure-environment-variables)
9. [Step 8: Install Dependencies](#step-8-install-dependencies)
10. [Next Steps](#next-steps)

---

## Prerequisites

- **Email address** for Azure account
- **GitHub account** (for Static Web Apps deployment)
- **OpenAI API key** (get from [OpenAI Platform](https://platform.openai.com/api-keys))
- **Basic command line knowledge**

---

## Step 1: Create Azure Account

### Option A: Azure for Students (Recommended if you have a .edu email)

1. Go to [Azure for Students](https://azure.microsoft.com/en-us/free/students/)
2. Click **"Start free"**
3. Sign in with your Microsoft account (or create one)
4. Verify your student status with your .edu email
5. **You get $100 credit for 12 months** + free services

### Option B: Azure Free Trial (For everyone else)

1. Go to [Azure Free Account](https://azure.microsoft.com/en-us/free/)
2. Click **"Start free"**
3. Sign in with Microsoft account
4. **Enter credit card** (won't be charged unless you explicitly upgrade)
5. You get **$200 credit for 30 days** + 12 months of free services

### ✅ Verification

- Log in to [Azure Portal](https://portal.azure.com)
- You should see the Azure dashboard
- Your subscription should show "Free Trial" or "Azure for Students"

---

## Step 2: Set Up Azure Cosmos DB

### Create Cosmos DB Account

1. In [Azure Portal](https://portal.azure.com), click **"Create a resource"**
2. Search for **"Azure Cosmos DB"** and select it
3. Click **"Create"**
4. Select **"Azure Cosmos DB for NoSQL"**

### Configure Cosmos DB

**Basics Tab:**
- **Subscription**: Select your free subscription
- **Resource Group**: Create new → name it `aptus-mvp-rg`
- **Account Name**: Choose a unique name (e.g., `aptus-mvp-cosmos-[yourname]`)
- **Location**: Select closest to Nigeria (e.g., **South Africa North** for lowest latency)
- **Capacity mode**: Select **Serverless** (free tier alternative, no provisioned RU/s)
  - ⚠️ If Serverless is not available, select **Provisioned throughput** and enable "Apply Free Tier Discount" checkbox
- **Apply Free Tier Discount**: ✅ **Checked** (gives you 1000 RU/s free)

**Global Distribution Tab:**
- Leave defaults (single region)

**Networking Tab:**
- **Connectivity method**: Select **"All networks"** (for MVP, we'll secure later)

**Backup Policy Tab:**
- Leave default (Periodic backup)

**Encryption Tab:**
- Leave defaults

**Review + Create:**
- Click **"Create"**
- Wait 3-5 minutes for deployment

### Create Database and Containers

1. Once deployed, click **"Go to resource"**
2. In left menu, click **"Data Explorer"**

#### Create Database

1. Click **"New Database"**
2. **Database id**: `aptus-mvp`
3. **Provision throughput**: ❌ **Unchecked** (we'll set it per container)
4. Click **"OK"**

#### Create Container 1: jobs

1. Click **"New Container"**
2. **Database id**: Select **"Use existing"** → `aptus-mvp`
3. **Container id**: `jobs`
4. **Partition key**: `/id`
5. **Provision dedicated throughput**: ❌ Unchecked (if serverless) OR ✅ Checked and set to **400 RU/s** (if provisioned)
6. Click **"OK"**

#### Create Container 2: candidates

1. Click **"New Container"**
2. **Database id**: Select **"Use existing"** → `aptus-mvp`
3. **Container id**: `candidates`
4. **Partition key**: `/jobId`
5. **Provision dedicated throughput**: ❌ Unchecked (if serverless) OR ✅ Checked and set to **400 RU/s** (if provisioned)
6. Click **"OK"**

#### Create Container 3: skillEmbeddingsCache

1. Click **"New Container"**
2. **Database id**: Select **"Use existing"** → `aptus-mvp`
3. **Container id**: `skillEmbeddingsCache`
4. **Partition key**: `/skill`
5. **Provision dedicated throughput**: ❌ Unchecked (if serverless) OR ✅ Checked and set to **200 RU/s** (if provisioned)
6. Click **"OK"**

### Get Connection Strings

1. In Cosmos DB resource, go to **"Keys"** (left menu under Settings)
2. Copy the following:
   - **URI** (e.g., `https://aptus-mvp-cosmos.documents.azure.com:443/`)
   - **PRIMARY KEY** (long string)
3. **Save these** — you'll need them for `.env` file

---

## Step 3: Set Up Azure Blob Storage

### Create Storage Account

1. In [Azure Portal](https://portal.azure.com), click **"Create a resource"**
2. Search for **"Storage account"** and select it
3. Click **"Create"**

### Configure Storage Account

**Basics Tab:**
- **Subscription**: Select your free subscription
- **Resource Group**: Select `aptus-mvp-rg` (same as Cosmos DB)
- **Storage account name**: Choose unique name (e.g., `aptusmvpstorage[yourname]`)
  - ⚠️ Must be lowercase, no special characters, 3-24 characters
- **Region**: Select **South Africa North** (same as Cosmos DB)
- **Performance**: **Standard**
- **Redundancy**: **Locally-redundant storage (LRS)** (cheapest)

**Advanced Tab:**
- Leave defaults

**Networking Tab:**
- **Network access**: Select **"Enable public access from all networks"** (for MVP)

**Data Protection Tab:**
- Leave defaults (can enable soft delete later)

**Review + Create:**
- Click **"Create"**
- Wait 2-3 minutes for deployment

### Create Blob Containers

1. Once deployed, click **"Go to resource"**
2. In left menu, click **"Containers"** (under Data storage)

#### Create Container 1: cvs

1. Click **"+ Container"**
2. **Name**: `cvs`
3. **Public access level**: **Private (no anonymous access)**
4. Click **"Create"**

#### Create Container 2: cover-letters

1. Click **"+ Container"**
2. **Name**: `cover-letters`
3. **Public access level**: **Private (no anonymous access)**
4. Click **"Create"**

### Get Connection String

1. In Storage Account resource, go to **"Access keys"** (left menu under Security + networking)
2. Click **"Show keys"** (if hidden)
3. Copy **"Connection string"** from key1
4. Also copy:
   - **Storage account name** (from Overview page)
   - **Key** (key1 value)
5. **Save these** — you'll need them for `.env` file

---

## Step 4: Set Up Azure Functions

### Create Function App

1. In [Azure Portal](https://portal.azure.com), click **"Create a resource"**
2. Search for **"Function App"** and select it
3. Click **"Create"**

### Configure Function App

**Basics Tab:**
- **Subscription**: Select your free subscription
- **Resource Group**: Select `aptus-mvp-rg`
- **Function App name**: Choose unique name (e.g., `aptus-mvp-functions-[yourname]`)
- **Publish**: **Code**
- **Runtime stack**: **Node.js**
- **Version**: **18 LTS** (or latest available)
- **Region**: Select **South Africa North**

**Hosting Tab:**
- **Storage account**: Select the storage account you created in Step 3
- **Operating System**: **Windows** (or Linux, both work)
- **Plan type**: **Consumption (Serverless)** ✅ (Free tier: 1M executions/month)

**Networking Tab:**
- Leave defaults

**Monitoring Tab:**
- **Enable Application Insights**: **Yes** (free tier available)
- Create new Application Insights or use existing

**Review + Create:**
- Click **"Create"**
- Wait 3-5 minutes for deployment

### Get Function App URL

1. Once deployed, click **"Go to resource"**
2. In **Overview** page, copy the **URL** (e.g., `https://aptus-mvp-functions.azurewebsites.net`)
3. **Save this** — you'll need it for `.env` file

### Configure Environment Variables (Later)

We'll add connection strings (Cosmos DB, Blob Storage, OpenAI) to Function App settings after completing all steps.

---

## Step 5: Set Up Azure SignalR Service

### Create SignalR Service

1. In [Azure Portal](https://portal.azure.com), click **"Create a resource"**
2. Search for **"SignalR Service"** and select it
3. Click **"Create"**

### Configure SignalR Service

**Basics Tab:**
- **Subscription**: Select your free subscription
- **Resource Group**: Select `aptus-mvp-rg`
- **Resource name**: Choose unique name (e.g., `aptus-mvp-signalr-[yourname]`)
- **Region**: Select **South Africa North**
- **Pricing tier**: **Free** (20 concurrent connections, 20K messages/day)
- **Service Mode**: **Serverless** (for use with Azure Functions)

**Review + Create:**
- Click **"Create"**
- Wait 2-3 minutes for deployment

### Get Connection String

1. Once deployed, click **"Go to resource"**
2. In left menu, click **"Keys"** (under Settings)
3. Copy **"Connection string"** (Primary key)
4. **Save this** — you'll need it for `.env` file

---

## Step 6: Set Up Azure Static Web Apps

### Option A: Deploy via GitHub (Recommended)

1. Push your Aptus code to a GitHub repository
2. In [Azure Portal](https://portal.azure.com), click **"Create a resource"**
3. Search for **"Static Web App"** and select it
4. Click **"Create"**

**Basics Tab:**
- **Subscription**: Select your free subscription
- **Resource Group**: Select `aptus-mvp-rg`
- **Name**: Choose name (e.g., `aptus-mvp-app`)
- **Plan type**: **Free** (100 GB bandwidth/month)
- **Region**: Select closest (e.g., **East US** or **West Europe**)
- **Source**: **GitHub**
- Click **"Sign in with GitHub"** and authorize

**Build Details:**
- **Organization**: Select your GitHub username
- **Repository**: Select your Aptus repository
- **Branch**: `main` (or `master`)
- **Build Presets**: **Custom**
- **App location**: `/` (root)
- **Api location**: Leave empty (we use separate Functions app)
- **Output location**: `/` (we serve static files from root)

**Review + Create:**
- Click **"Create"**
- Azure will create a GitHub Actions workflow in your repo

### Option B: Manual Deployment (Alternative)

1. Use Azure CLI or VS Code Azure extension to deploy
2. We'll document this later if needed

### Get Static Web App URL

1. Once deployed, click **"Go to resource"**
2. In **Overview** page, copy the **URL** (e.g., `https://nice-rock-123456789.azurestaticapps.net`)
3. This is your production URL

---

## Step 7: Configure Environment Variables

### Create `.env` File

1. In your project root, copy `.env.template` to `.env`:

```bash
cp .env.template .env
```

2. Open `.env` and fill in the values you saved:

```env
# Azure Cosmos DB
COSMOS_DB_ENDPOINT=https://aptus-mvp-cosmos-[yourname].documents.azure.com:443/
COSMOS_DB_KEY=YOUR_COSMOS_DB_PRIMARY_KEY_HERE

# Azure Blob Storage
BLOB_STORAGE_ACCOUNT_NAME=aptusmvpstorage
BLOB_STORAGE_ACCOUNT_KEY=YOUR_BLOB_STORAGE_KEY_HERE
BLOB_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=aptusmvpstorage;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net

# Azure SignalR Service
SIGNALR_CONNECTION_STRING=Endpoint=https://aptus-mvp-signalr.service.signalr.net;AccessKey=YOUR_ACCESS_KEY;Version=1.0;

# Azure Functions
AZURE_FUNCTIONS_URL=https://aptus-mvp-functions-[yourname].azurewebsites.net

# OpenAI API
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY_HERE
```

### Configure Azure Functions Environment Variables

1. Go to your **Function App** in Azure Portal
2. In left menu, click **"Configuration"** (under Settings)
3. Click **"+ New application setting"** and add each variable:
   - `COSMOS_DB_ENDPOINT`
   - `COSMOS_DB_KEY`
   - `BLOB_STORAGE_CONNECTION_STRING`
   - `SIGNALR_CONNECTION_STRING`
   - `OPENAI_API_KEY`
4. Click **"Save"** after adding all variables
5. Click **"Continue"** when prompted to restart

---

## Step 8: Install Dependencies

### Install Azure SDKs

In your project directory, run:

```bash
npm install
```

This will install:
- `@azure/cosmos` — Cosmos DB SDK
- `@azure/storage-blob` — Blob Storage SDK
- `@azure/functions` — Azure Functions runtime
- `@microsoft/signalr` — SignalR client library
- `openai` — OpenAI API client
- `pdf-parse` — PDF text extraction
- `mammoth` — DOCX text extraction
- `dotenv` — Environment variable loader

### Verify Installation

Check that all packages are installed:

```bash
npm list --depth=0
```

You should see all Azure packages listed.

---

## Next Steps

### ✅ You've completed Azure setup!

**What you have now:**
- ✅ Azure Cosmos DB with 3 containers (jobs, candidates, skillEmbeddingsCache)
- ✅ Azure Blob Storage with 2 containers (cvs, cover-letters)
- ✅ Azure Functions app (ready for serverless functions)
- ✅ Azure SignalR Service (for real-time updates)
- ✅ Azure Static Web Apps (for hosting)
- ✅ Configuration files with connection strings

### 🚀 Continue Implementation

Now proceed to **Task 2** in `tasks.md`:
- Implement Azure access control and security
- Configure Cosmos DB access policies
- Set up Blob Storage SAS tokens

### 📝 Important Notes

**Security:**
- ⚠️ **Never commit `.env` to git** — it's in `.gitignore`
- ⚠️ Keep your Azure keys private
- ⚠️ For production, restrict network access in Azure Portal

**Costs:**
- ✅ All services are **FREE** for MVP usage (0-500 applications/month)
- ✅ Azure free tier includes:
  - Cosmos DB: 1000 RU/s + 25 GB storage
  - Blob Storage: 5 GB + 20K operations
  - Functions: 1M executions/month
  - SignalR: 20 concurrent connections
  - Static Web Apps: 100 GB bandwidth

**Need Help?**
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [Azure Blob Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Azure SignalR Documentation](https://docs.microsoft.com/en-us/azure/azure-signalr/)

---

## Troubleshooting

### "Cosmos DB creation failed"
- Check that you selected **Serverless** mode or enabled **Free Tier Discount**
- Ensure your subscription is active
- Try a different region

### "Storage account name already taken"
- Storage account names must be globally unique
- Try adding random numbers to your name

### "Function App deployment fails"
- Ensure you selected **Consumption plan** (free tier)
- Check that the storage account exists
- Verify your subscription has available quota

### "SignalR connection fails"
- Ensure **Service Mode** is set to **Serverless**
- Check connection string format
- Verify Function App has SignalR binding configured

---

**Congratulations! Your Azure infrastructure is ready. 🎉**
