# Firebase Setup Instructions for Aptus MVP

This document provides step-by-step instructions to set up Firebase for the Aptus MVP platform.

## Prerequisites

- Node.js (v16 or higher) installed
- npm or yarn package manager
- A Google account for Firebase Console access

## Step 1: Create Firebase Project in Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: **aptus-mvp-core**
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

## Step 2: Enable Firebase Services

### Enable Realtime Database

1. In Firebase Console, navigate to **Build > Realtime Database**
2. Click "Create Database"
3. Choose location closest to your users (e.g., **us-central1**)
4. Start in **Test mode** (we'll deploy production rules later)
5. Click "Enable"

### Enable Firebase Storage

1. Navigate to **Build > Storage**
2. Click "Get started"
3. Start in **Test mode** (we'll deploy production rules later)
4. Choose storage location (same as database location)
5. Click "Done"

### Enable Firebase Functions

1. Navigate to **Build > Functions**
2. Click "Get started"
3. Upgrade to **Blaze (pay-as-you-go)** plan (required for Functions)
4. Set billing alerts to avoid unexpected charges

### Enable Firebase Hosting

1. Navigate to **Build > Hosting**
2. Click "Get started"
3. Follow the installation prompts (we'll use CLI)

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** > **Project settings**
2. Scroll to "Your apps" section
3. Click the **Web** icon (`</>`) to add a web app
4. Register app with nickname: **Aptus Web App**
5. Copy the `firebaseConfig` object shown

## Step 4: Update Firebase Configuration in Code

1. Open `firebase-config.js` in your project
2. Replace the `firebaseConfig` object with your actual configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "aptus-mvp-core.firebaseapp.com",
  databaseURL: "https://aptus-mvp-core-default-rtdb.firebaseio.com",
  projectId: "aptus-mvp-core",
  storageBucket: "aptus-mvp-core.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

## Step 5: Install Dependencies

Run the following command in your project directory:

```bash
npm install
```

This will install:
- `firebase` - Firebase JavaScript SDK
- `firebase-admin` - Firebase Admin SDK (for Functions)
- `firebase-functions` - Cloud Functions SDK
- `openai` - OpenAI API client
- `pdf-parse` - PDF text extraction library
- `mammoth` - DOCX text extraction library
- `firebase-tools` - Firebase CLI (dev dependency)

## Step 6: Install Firebase CLI Globally

```bash
npm install -g firebase-tools
```

## Step 7: Login to Firebase CLI

```bash
firebase login
```

This will open your browser for Google authentication.

## Step 8: Initialize Firebase in Project

From your project directory, run:

```bash
firebase init
```

Select the following services:
- ✅ Realtime Database
- ✅ Functions
- ✅ Hosting
- ✅ Storage

Follow the prompts:
- **Use existing project**: Select `aptus-mvp-core`
- **Database rules file**: `database.rules.json` (already created)
- **Functions language**: JavaScript
- **ESLint**: Yes
- **Install dependencies**: Yes
- **Public directory**: `.` (current directory)
- **Single-page app**: Yes
- **Storage rules file**: `storage.rules` (already created)

## Step 9: Deploy Security Rules

Deploy the database and storage security rules:

```bash
firebase deploy --only database,storage
```

## Step 10: Test Locally with Emulators (Optional)

To test the application locally with Firebase Emulators:

```bash
firebase emulators:start
```

This starts:
- Realtime Database Emulator on port 9000
- Functions Emulator on port 5001
- Storage Emulator on port 9199
- Hosting Emulator on port 5000
- Emulator UI on port 4000

Access the application at: `http://localhost:5000`

## Step 11: Deploy to Firebase Hosting

When ready to deploy to production:

```bash
firebase deploy
```

Or deploy only hosting:

```bash
npm run deploy:hosting
```

## Database Schema Structure

The Firebase Realtime Database is structured as follows:

```
/
├─ jobs/
│  ├─ {job-id}/
│  │  ├─ metadata/
│  │  │  ├─ id
│  │  │  ├─ title
│  │  │  ├─ department
│  │  │  ├─ location
│  │  │  ├─ experienceLevel
│  │  │  ├─ description
│  │  │  ├─ skills[]
│  │  │  ├─ qualifications
│  │  │  ├─ createdAt
│  │  │  ├─ applicationLink
│  │  │  ├─ adminLink
│  │  │  └─ selectedCommunities[]
│  │  ├─ candidates/
│  │  │  └─ {candidate-id}/
│  │  │     ├─ personalInfo/
│  │  │     ├─ experience/
│  │  │     ├─ files/
│  │  │     ├─ source
│  │  │     ├─ scores/
│  │  │     ├─ status
│  │  │     ├─ appliedAt
│  │  │     └─ statusHistory[]
│  │  └─ statistics/
│  │     ├─ applicantCount
│  │  
   ├─ shortlistedCount
│  │     ├─ rejectedCount
│  │     └─ avgMatchScore
└─ skillEmbeddingsCache/
   └─ {skill-name}: [embedding-vector]
```

## Storage Structure

Firebase Storage buckets are organized as:

```
/
├─ cvs/
│  └─ {job-id}/
│     └─ {candidate-id}.{pdf|docx}
└─ cover-letters/
   └─ {job-id}/
      └─ {candidate-id}.{pdf|docx}
```

## Environment Variables for OpenAI

For Firebase Functions to work with OpenAI API, set the API key:

```bash
firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"
```

To view current config:

```bash
firebase functions:config:get
```

## Troubleshooting

### Error: "Permission denied"
- Check that security rules are deployed: `firebase deploy --only database,storage`
- Verify database rules allow the operation you're attempting

### Error: "Firebase initialization failed"
- Check that `firebase-config.js` has the correct configuration values
- Verify your Firebase project exists and services are enabled
- Check browser console for detailed error messages

### Error: "Module not found"
- Run `npm install` to ensure all dependencies are installed
- Check that `firebase-config.js` is in the project root

### Storage Upload Fails
- Check file size is ≤ 5MB
- Verify file extension is `.pdf` or `.docx`
- Check storage rules are deployed

## Next Steps

After completing Firebase setup:

1. **Task 2**: Implement Firebase security rules (more restrictive for production)
2. **Task 3**: Implement Job Posting Manager module
3. **Task 6**: Implement Candidate Application Processor module

## Useful Commands

```bash
# Serve locally
npm run serve

# Deploy everything
npm run deploy

# Deploy only hosting
npm run deploy:hosting

# Deploy only functions
npm run deploy:functions

# Deploy only rules
npm run deploy:database

# Start emulators
npm run emulators:start

# View logs
firebase functions:log
```

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Realtime Database Guide](https://firebase.google.com/docs/database)
- [Firebase Storage Guide](https://firebase.google.com/docs/storage)
- [Firebase Functions Guide](https://firebase.google.com/docs/functions)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

**Note**: This setup uses Firebase's test mode initially. Before deploying to production, ensure you've implemented proper security rules in `database.rules.json` and `storage.rules` (covered in Task 2).
