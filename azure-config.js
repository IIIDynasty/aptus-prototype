/* ============================================
   APTUS — Azure Configuration
   ============================================ */

require('dotenv').config();

const { CosmosClient } = require('@azure/cosmos');
const { BlobServiceClient, generateBlobSASQueryParameters, StorageSharedKeyCredential, BlobSASPermissions } = require('@azure/storage-blob');

// ============================================
// CONFIGURATION
// ============================================

const config = {
  // Azure Cosmos DB Configuration
  cosmosDb: {
    endpoint: process.env.COSMOS_DB_ENDPOINT || 'https://YOUR_COSMOS_ACCOUNT.documents.azure.com:443/',
    key: process.env.COSMOS_DB_KEY || 'YOUR_COSMOS_DB_PRIMARY_KEY',
    databaseId: 'aptus-mvp',
    containers: {
      jobs: 'jobs',
      candidates: 'candidates',
      skillEmbeddingsCache: 'skillEmbeddingsCache'
    }
  },

  // Azure Blob Storage Configuration
  blobStorage: {
    accountName: process.env.BLOB_STORAGE_ACCOUNT_NAME || 'YOUR_STORAGE_ACCOUNT_NAME',
    accountKey: process.env.BLOB_STORAGE_ACCOUNT_KEY || 'YOUR_STORAGE_ACCOUNT_KEY',
    connectionString: process.env.BLOB_STORAGE_CONNECTION_STRING || 
      'DefaultEndpointsProtocol=https;AccountName=YOUR_STORAGE_ACCOUNT_NAME;AccountKey=YOUR_STORAGE_ACCOUNT_KEY;EndpointSuffix=core.windows.net',
    containers: {
      cvs: 'cvs',
      coverLetters: 'cover-letters'
    }
  },

  // Azure SignalR Service Configuration
  signalR: {
    connectionString: process.env.SIGNALR_CONNECTION_STRING || 'Endpoint=https://YOUR_SIGNALR_NAME.service.signalr.net;AccessKey=YOUR_ACCESS_KEY;Version=1.0;'
  },

  // Azure Functions Configuration
  functions: {
    baseUrl: process.env.AZURE_FUNCTIONS_URL || 'https://YOUR_FUNCTION_APP.azurewebsites.net'
  },

  // Groq AI Configuration
  groq: {
    apiKey: process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY'
  }
};

// ============================================
// COSMOS DB CLIENT INITIALIZATION
// ============================================

let cosmosClient = null;
let database = null;
let containers = {};

/**
 * Initialize Cosmos DB client and database connection
 */
async function initializeCosmosDb() {
  try {
    cosmosClient = new CosmosClient({
      endpoint: config.cosmosDb.endpoint,
      key: config.cosmosDb.key
    });

    // Get database reference
    database = cosmosClient.database(config.cosmosDb.databaseId);

    // Get container references
    containers.jobs = database.container(config.cosmosDb.containers.jobs);
    containers.candidates = database.container(config.cosmosDb.containers.candidates);
    containers.skillEmbeddingsCache = database.container(config.cosmosDb.containers.skillEmbeddingsCache);

    console.log('✅ Azure Cosmos DB initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Cosmos DB:', error.message);
    return false;
  }
}

/**
 * Get Cosmos DB container by name
 * @param {string} containerName - Name of the container
 * @returns {Object} Container reference
 */
function getContainer(containerName) {
  if (!containers[containerName]) {
    throw new Error(`Container ${containerName} not initialized`);
  }
  return containers[containerName];
}

// ============================================
// BLOB STORAGE CLIENT INITIALIZATION
// ============================================

let blobServiceClient = null;
let sharedKeyCredential = null;

/**
 * Initialize Blob Storage client
 */
async function initializeBlobStorage() {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(
      config.blobStorage.connectionString
    );

    // Create shared key credential for SAS token generation
    sharedKeyCredential = new StorageSharedKeyCredential(
      config.blobStorage.accountName,
      config.blobStorage.accountKey
    );

    console.log('✅ Azure Blob Storage initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Blob Storage:', error.message);
    return false;
  }
}

/**
 * Get Blob container client
 * @param {string} containerName - Name of the container ('cvs' or 'cover-letters')
 * @returns {Object} Container client
 */
function getBlobContainerClient(containerName) {
  if (!blobServiceClient) {
    throw new Error('Blob Storage not initialized');
  }
  return blobServiceClient.getContainerClient(containerName);
}

/**
 * Generate SAS token URL for a blob
 * @param {string} containerName - Container name
 * @param {string} blobName - Blob name (path)
 * @param {number} expiryDays - Expiry in days (default 7)
 * @returns {string} Secure URL with SAS token
 */
function generateBlobSasUrl(containerName, blobName, expiryDays = 7) {
  const containerClient = getBlobContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  // Set expiry time
  const expiresOn = new Date();
  expiresOn.setDate(expiresOn.getDate() + expiryDays);

  // Generate SAS token (read-only)
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: containerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('r'), // Use BlobSASPermissions object, not raw string
      expiresOn: expiresOn
    },
    sharedKeyCredential
  ).toString();

  return `${blobClient.url}?${sasToken}`;
}

// ============================================
// INITIALIZATION FUNCTION
// ============================================

/**
 * Initialize all Azure services
 * Call this at application startup
 */
async function initializeAzureServices() {
  console.log('🚀 Initializing Azure services...');
  
  const cosmosInitialized = await initializeCosmosDb();
  const blobInitialized = await initializeBlobStorage();

  if (cosmosInitialized && blobInitialized) {
    console.log('✅ All Azure services initialized successfully');
    return true;
  } else {
    console.error('❌ Some Azure services failed to initialize');
    return false;
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  config,
  initializeAzureServices,
  
  // Cosmos DB
  cosmosClient: () => cosmosClient,
  database: () => database,
  getContainer,
  
  // Blob Storage
  blobServiceClient: () => blobServiceClient,
  getBlobContainerClient,
  generateBlobSasUrl
};
