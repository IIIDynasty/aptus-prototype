# Quick Azure Setup for Aptus MVP

**Time Required**: 30-45 minutes  
**Cost**: $0 (everything uses free tier)

---

## What You'll Create

1. **Cosmos DB** - Database for jobs, candidates, skill cache
2. **Blob Storage** - File storage for CVs and cover letters
3. **Function App** - Serverless functions (for later)
4. **SignalR Service** - Real-time updates (for later)

---

## Step 1: Create Cosmos DB (10 minutes)

### 1.1 Navigate to Cosmos DB

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"** (top left, or center button)
3. In the search box, type **"Azure Cosmos DB"**
4. Click on **"Azure Cosmos DB"**
5. Click **"Create"**

### 1.2 Choose API

- Select **"Azure Cosmos DB for NoSQL"** (the first option)
- Click **"Create"**

### 1.3 Fill in Basic Information

**Project Details:**
- **Subscription**: Your free subscription (should be selected automatically)
- **Resource Group**: Click "Create new" → Name it **`aptus-mvp-rg`** → Click OK

**Instance Details:**
- **Account Name**: **`aptus-cosmos-[yourname]`** (replace [yourname] with your name, must be unique globally)
  - Example: `aptus-cosmos-ismail`
- **Location**: Choose **"South Africa North"** (closest to Nigeria for low latency)
- **Capacity mode**: Select **"Serverless"** (this is FREE, no need for provisioned throughput)
  - If "Serverless" is not available, select **"Provisioned throughput"** and make sure "Apply Free Tier Discount" is CHECKED ✅

**Global Distribution:**
- Leave as is (defaults are fine)

**Networking:**
- Leave as **"All networks"** (we'll secure it later)

**Backup Policy, Encryption, Tags:**
- Leave all defaults

### 1.4 Create

- Click **"Review + create"** at the bottom
- Review the settings
- Click **"Create"**
- ⏳ Wait 3-5 minutes for deployment

### 1.5 Create Database and Containers

Once deployment is complete:

1. Click **"Go to resource"**
2. In the left menu, find and click **"Data Explorer"**
3. Click **"New Database"** button (top area)
   - **Database id**: `aptus-mvp`
   - Click **"OK"**

Now create 3 containers:

**Container 1: jobs**
1. Click **"New Container"** button
2. **Database id**: Select "Use existing" → Choose `aptus-mvp`
3. **Container id**: `jobs`
4. **Partition key**: `/id`
5. Click **"OK"**

**Container 2: candidates**
1. Click **"New Container"** again
2. **Database id**: Select "Use existing" → Choose `aptus-mvp`
3. **Container id**: `candidates`
4. **Partition key**: `/jobId`
5. Click **"OK"**

**Container 3: skillEmbeddingsCache**
1. Click **"New Container"** again
2. **Database id**: Select "Use existing" → Choose `aptus-mvp`
3. **Container id**: `skillEmbeddingsCache`
4. **Partition key**: `/skill`
5. Click **"OK"**

### 1.6 Get Connection Information

1. In the left menu, find **"Keys"** (under Settings section)
2. Copy and save these values (paste them in a notepad temporarily):
   - **URI** (looks like: `https://aptus-cosmos-yourname.documents.azure.com:443/`)
   - **PRIMARY KEY** (long string of characters)

✅ **Cosmos DB is done!**

---

## Step 2: Create Blob Storage (8 minutes)

### 2.1 Create Storage Account

1. In Azure Portal, click the **home icon** (top left) or search bar
2. Click **"Create a resource"**
3. Search for **"Storage account"**
4. Click **"Storage account"** from results
5. Click **"Create"**

### 2.2 Fill in Basic Information

**Project Details:**
- **Subscription**: Your free subscription
- **Resource Group**: Select **`aptus-mvp-rg`** (the one you created earlier)

**Instance Details:**
- **Storage account name**: **`aptusstorageXXXX`** (replace XXXX with random numbers, must be lowercase, no special characters)
  - Example: `aptusstorage2024`
  - ⚠️ Must be globally unique, all lowercase, 3-24 characters
- **Region**: **"South Africa North"** (same as Cosmos DB)
- **Performance**: **"Standard"**
- **Redundancy**: **"Locally-redundant storage (LRS)"** (cheapest option, $0 in free tier)

**Advanced, Networking, Data Protection, Encryption, Tags:**
- Leave all defaults

### 2.3 Create

- Click **"Review + create"**
- Click **"Create"**
- ⏳ Wait 2-3 minutes

### 2.4 Create Blob Containers

Once deployed:

1. Click **"Go to resource"**
2. In the left menu, find **"Containers"** (under Data storage section)
3. Click **"+ Container"** button (top)

**Container 1: cvs**
- **Name**: `cvs`
- **Public access level**: **"Private (no anonymous access)"**
- Click **"Create"**

**Container 2: cover-letters**
- Click **"+ Container"** again
- **Name**: `cover-letters`
- **Public access level**: **"Private (no anonymous access)"**
- Click **"Create"**

### 2.5 Get Connection Information

1. In the left menu, find **"Access keys"** (under Security + networking)
2. Click **"Show"** next to "Connection string" for key1
3. Copy and save these values:
   - **Storage account name** (from the top of the page)
   - **Key1** (the long string under "key1")
   - **Connection string** (the entire connection string under key1)

✅ **Blob Storage is done!**

---

## Step 3: Create Azure Functions (5 minutes)

### 3.1 Create Function App

1. In Azure Portal, click **"Create a resource"**
2. Search for **"Function App"**
3. Click **"Function App"**
4. Click **"Create"**

### 3.2 Fill in Basic Information

**Project Details:**
- **Subscription**: Your free subscription
- **Resource Group**: Select **`aptus-mvp-rg`**

**Instance Details:**
- **Function App name**: **`aptus-functions-[yourname]`**
  - Example: `aptus-functions-ismail`
- **Publish**: **"Code"**
- **Runtime stack**: **"Node.js"**
- **Version**: **"18 LTS"** (or latest available)
- **Region**: **"South Africa North"**

**Operating System:**
- Select **"Windows"** (default is fine)

**Hosting:**
- **Storage account**: Select the storage account you just created
- **Plan type**: **"Consumption (Serverless)"** ✅ (This is FREE - 1M executions/month)

### 3.3 Create

- Click **"Review + create"**
- Click **"Create"**
- ⏳ Wait 3-5 minutes

### 3.4 Get Function URL

Once deployed:
1. Click **"Go to resource"**
2. In the **Overview** page, copy the **URL** (looks like: `https://aptus-functions-yourname.azurewebsites.net`)

✅ **Azure Functions is done!**

---

## Step 4: Create SignalR Service (5 minutes)

### 4.1 Create SignalR

1. In Azure Portal, click **"Create a resource"**
2. Search for **"SignalR Service"**
3. Click **"SignalR Service"**
4. Click **"Create"**

### 4.2 Fill in Information

**Project Details:**
- **Subscription**: Your free subscription
- **Resource Group**: Select **`aptus-mvp-rg`**

**Instance Details:**
- **Resource name**: **`aptus-signalr-[yourname]`**
  - Example: `aptus-signalr-ismail`
- **Region**: **"South Africa North"**
- **Pricing tier**: **"Free"** ✅ (20 concurrent connections, 20K messages/day)
- **Service Mode**: **"Serverless"** (for use with Azure Functions)

### 4.3 Create

- Click **"Review + create"**
- Click **"Create"**
- ⏳ Wait 2-3 minutes

### 4.4 Get Connection String

Once deployed:
1. Click **"Go to resource"**
2. In the left menu, find **"Keys"** (under Settings)
3. Copy the **"Connection string"** (Primary key)

✅ **SignalR is done!**

---

## Step 5: Get OpenAI API Key (2 minutes)

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in (or create account)
3. Click **"Create new secret key"**
4. Name it **"Aptus MVP"**
5. Copy the key (starts with `sk-`)
6. ⚠️ Save it immediately - you won't see it again!

---

## ✅ Summary - What You Should Have

By now, you should have copied these values:

**From Cosmos DB:**
- ✅ URI (endpoint)
- ✅ Primary Key

**From Blob Storage:**
- ✅ Storage account name
- ✅ Key
- ✅ Connection string

**From Azure Functions:**
- ✅ Function App URL

**From SignalR:**
- ✅ Connection string

**From OpenAI:**
- ✅ API Key

---

## Next Step

Once you have all these values, tell me **"I have all the connection strings"** and I'll help you:
1. Create the `.env` file
2. Fill in your credentials
3. Install dependencies
4. Test the connection

---

## Troubleshooting

**"Resource name already taken"**
- Add random numbers to make it unique (e.g., `aptus-cosmos-ismail2024`)

**"Can't find Serverless option in Cosmos DB"**
- Choose "Provisioned throughput" and check "Apply Free Tier Discount" ✅

**"Storage account name invalid"**
- Must be all lowercase
- No spaces or special characters
- 3-24 characters only

**Need help?**
- Take a screenshot and describe the issue
- I'll help you troubleshoot
