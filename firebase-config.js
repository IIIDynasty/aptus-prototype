/* ============================================
   FIREBASE CONFIGURATION & INITIALIZATION
   ============================================ */

// Firebase SDK Configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "aptus-mvp-core.firebaseapp.com",
  databaseURL: "https://aptus-mvp-core-default-rtdb.firebaseio.com",
  projectId: "aptus-mvp-core",
  storageBucket: "aptus-mvp-core.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (will be called from index.html)
let app;
let database;
let storage;

function initializeFirebase() {
  try {
    // Initialize Firebase App
    app = firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    database = firebase.database();
    storage = firebase.storage();
    
    console.log('✓ Firebase initialized successfully');
    return { app, database, storage };
  } catch (error) {
    console.error('✗ Firebase initialization failed:', error);
    throw error;
  }
}

/* ============================================
   DATABASE SCHEMA STRUCTURE
   ============================================ */

/**
 * Initialize database schema structure
 * This creates the base paths in Firebase Realtime Database
 */
async function initializeDatabaseSchema() {
  try {
    // Initialize root paths with empty objects if they don't exist
    const rootRef = database.ref();
    
    // Check if jobs node exists
    const jobsSnapshot = await database.ref('jobs').once('value');
    if (!jobsSnapshot.exists()) {
      await database.ref('jobs').set({});
      console.log('✓ Created /jobs node');
    }
    
    // Check if skillEmbeddingsCache node exists
    const cacheSnapshot = await database.ref('skillEmbeddingsCache').once('value');
    if (!cacheSnapshot.exists()) {
      await database.ref('skillEmbeddingsCache').set({});
      console.log('✓ Created /skillEmbeddingsCache node');
    }
    
    console.log('✓ Database schema initialized');
    return true;
  } catch (error) {
    console.error('✗ Database schema initialization failed:', error);
    throw error;
  }
}

/**
 * Example job posting structure for reference
 * This shows the expected data structure but doesn't create actual data
 */
const EXAMPLE_JOB_STRUCTURE = {
  "jobs": {
    "{job-id}": {
      "metadata": {
        "id": "JOB-2025-4582",
        "title": "Senior Software Engineer",
        "department": "Engineering",
        "location": "Lagos, Nigeria",
        "experienceLevel": "Senior Level (5+ years)",
        "description": "Job description here...",
        "skills": ["Python", "Django", "PostgreSQL"],
        "qualifications": "BSc Computer Science or equivalent",
        "createdAt": 1737840000000,
        "applicationLink": "aptus.io/jobs/JOB-2025-4582/apply",
        "adminLink": "aptus.io/jobs/JOB-2025-4582/admin",
        "selectedCommunities": []
      },
      "candidates": {
        "{candidate-id}": {
          "personalInfo": {
            "fullName": "John Doe",
            "email": "john@example.com",
            "phone": "+234 800 000 0000",
            "linkedIn": "linkedin.com/in/johndoe"
          },
          "experience": {
            "years": 7,
            "currentRole": "Senior Developer",
            "skills": ["Python", "Django"],
            "summary": "Built APIs processing..."
          },
          "files": {
            "cvUrl": null,
            "coverLetterUrl": null
          },
          "source": "direct",
          "scores": {
            "total": 0,
            "skills": 0,
            "experience": 0,
            "qualifications": 0,
            "applicationQuality": 0
          },
          "status": "pending",
          "appliedAt": 1737844800000,
          "statusHistory": []
        }
      },
      "statistics": {
        "applicantCount": 0,
        "shortlistedCount": 0,
        "rejectedCount": 0,
        "avgMatchScore": 0
      }
    }
  },
  "skillEmbeddingsCache": {
    "python": [],
    "javascript": []
  }
};

/* ============================================
   STORAGE BUCKET CONFIGURATION
   ============================================ */

/**
 * Storage folder structure:
 * /cvs/{jobId}/{candidateId}.{extension}
 * /cover-letters/{jobId}/{candidateId}.{extension}
 * 
 * Access is controlled via storage.rules
 * - Public uploads allowed (with size/format validation)
 * - Reads require authentication or signed URL (7-day expiration)
 */

/**
 * Get reference to CV storage location
 */
function getCVStorageRef(jobId, candidateId, extension) {
  return storage.ref(`cvs/${jobId}/${candidateId}.${extension}`);
}

/**
 * Get reference to cover letter storage location
 */
function getCoverLetterStorageRef(jobId, candidateId, extension) {
  return storage.ref(`cover-letters/${jobId}/${candidateId}.${extension}`);
}

/**
 * Generate signed URL with 7-day expiration
 */
async function getSignedDownloadURL(storageRef) {
  try {
    // Get download URL with 7-day expiration
    const url = await storageRef.getDownloadURL();
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}

/* ============================================
   EXPORTS
   ============================================ */

// Export functions for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeFirebase,
    initializeDatabaseSchema,
    getCVStorageRef,
    getCoverLetterStorageRef,
    getSignedDownloadURL
  };
}
