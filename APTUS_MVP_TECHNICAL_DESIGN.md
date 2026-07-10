# Aptus MVP - Technical Design & Architecture

## Executive Summary
This document outlines the technical architecture, AI strategy, cost analysis, and implementation roadmap for transforming Aptus from a prototype to a functional MVP.

---

## Table of Contents
1. [Authentication Strategy](#1-authentication-strategy)
2. [AI Ranking System](#2-ai-ranking-system)
3. [Platform Partner Integration](#3-platform-partner-integration)
4. [Real-Time Updates](#4-real-time-updates)
5. [Tech Stack Recommendations](#5-tech-stack-recommendations)
6. [Cost Analysis](#6-cost-analysis)
7. [Implementation Phases](#7-implementation-phases)

---

## 1. Authentication Strategy

### Decision Point: Login or No Login?

#### Option A: No Login (Recommended for MVP v1.0)
**Pros:**
- ✅ Faster time to market
- ✅ Lower friction for recruiters to try
- ✅ Simpler architecture
- ✅ Focus on core AI value proposition
- ✅ No password management overhead

**Cons:**
- ❌ No data persistence across sessions
- ❌ No user history/analytics per recruiter
- ❌ Limited ability to track recruiter behavior

**How it works:**
1. Recruiter visits landing page → Gets started immediately
2. Creates job posting → Gets unique job link + admin dashboard link
3. Bookmark/save links to return later
4. Each job has unique URL: `aptus.io/jobs/{job-id}/admin`
5. Candidates apply via: `aptus.io/jobs/{job-id}/apply`

#### Option B: Email-Only Magic Link (Recommended for MVP v1.5)
**Pros:**
- ✅ Simple authentication
- ✅ Data persistence
- ✅ Can track recruiter metrics
- ✅ Email notifications for applications
- ✅ No password to manage

**Implementation:**
1. Recruiter enters email
2. Receives magic link valid for 24 hours
3. Click link → Authenticated session
4. Can see all their job postings

**Tech:** Firebase Auth, Supabase Auth, or Auth0 (magic link feature)

#### Option C: Full Auth (Recommended for MVP v2.0+)
Full email/password or OAuth (Google, LinkedIn)

### **RECOMMENDATION FOR YOU:**
**Start with Option A (No Login), plan for Option B in Phase 2**

**Why?**
- Get recruiters testing the AI ranking immediately
- Collect feedback on core value (AI matching)
- Add auth once you validate demand
- Easier to iterate on UX without auth complexity

---

## 2. AI Ranking System

### Core Question: What Data Do We Analyze?

#### Recommended Approach: **Hybrid Analysis**

**Data Sources (in order of importance):**

1. **Structured Form Data (70% weight)**
   - Years of experience
   - Skills (exact match + semantic similarity)
   - Education/qualifications
   - Current role/title
   - Measurable achievements (extracted metrics)

2. **CV/Resume Document (30% weight)**
   - Extract additional context
   - Verify claimed experience
   - Identify unlisted skills
   - Detect keywords from job description

3. **Cover Letter (Optional bonus)**
   - Communication quality
   - Motivation alignment
   - Cultural fit indicators

### Why This Approach?

**Structured data is PRIMARY because:**
- ✅ More reliable/consistent
- ✅ Faster to process (no OCR/parsing)
- ✅ Easier to compare across candidates
- ✅ Lower AI costs (smaller input)
- ✅ Candidates can't "keyword stuff" as easily

**CV is SECONDARY because:**
- ✅ Validates structured claims
- ✅ Adds depth/context
- ✅ Catches things candidates forgot to mention
- ⚠️ More expensive to process
- ⚠️ Requires PDF parsing

### AI Ranking Algorithm

#### **Scoring Components (Total: 100%)**

```
TOTAL SCORE = Skills Match (40%) 
            + Experience Match (30%) 
            + Qualifications (20%) 
            + Application Quality (10%)
```

#### **1. Skills Match (40 points)**

**Exact Match (50% of skills score):**
- Count overlapping skills between job requirements and candidate
- Score = (Matched Skills / Required Skills) × 100

**Semantic Match (50% of skills score):**
- Use AI to find similar skills
- Example: "React" similar to "React.js", "ReactJS", "React Native"
- Example: "Project Management" similar to "Agile", "Scrum Master", "Team Leadership"

**AI Model:** OpenAI Embeddings or Sentence Transformers
- Convert skills to vectors
- Calculate cosine similarity
- Threshold: >0.75 = similar skill

#### **2. Experience Match (30 points)**

**Level Matching:**
- Entry Level (0–2 years): Required = 1 year
- Mid Level (2–5 years): Required = 3 years
- Senior Level (5+ years): Required = 5 years
- Lead/Manager: Required = 8 years
- Executive: Required = 12 years

**Scoring Logic:**
```
If candidate.years >= required + 2: score = 100
If candidate.years >= required: score = 85
If candidate.years >= required - 1: score = 60
Else: score = max(0, 40 - (required - candidate.years) × 10)
```

**No AI needed** - Simple arithmetic

#### **3. Qualifications (20 points)**

**Keyword Matching + AI Verification:**
- Check for degrees: BSc, MSc, HND, PhD
- Check for certifications: AWS, PMP, Google, etc.
- Use AI to verify from CV if uploaded

**Scoring:**
```
Has relevant degree + certification: 100
Has degree OR certification: 70
Neither but relevant experience: 40
```

**AI Model:** Simple keyword extraction or GPT-3.5-turbo for verification

#### **4. Application Quality (10 points)**

**Measurable Achievements Analysis:**
- Does summary contain numbers/percentages?
- Are achievements specific and quantified?
- Is writing clear and professional?

**AI Prompt to GPT:**
```
Analyze this candidate's achievements:
"{candidate.summary}"

Rate from 0-100 based on:
- Presence of specific metrics/numbers
- Clarity and professionalism
- Relevance to the role

Return only a number 0-100.
```

**Cost:** ~$0.0001 per candidate (very cheap with GPT-3.5-turbo)

### AI Model Recommendations

#### **Option 1: OpenAI GPT-3.5-turbo + Embeddings (Recommended)**

**Why?**
- ✅ Easy to implement
- ✅ Excellent semantic understanding
- ✅ Good documentation
- ✅ Reasonable cost
- ✅ Fast response times

**Cost per candidate:**
- Embeddings for skills: $0.0001
- GPT-3.5 for quality check: $0.0002
- GPT-3.5 for CV parsing (if needed): $0.001
- **Total: ~$0.0013 per candidate analyzed**

**For 100 candidates/month: ~$0.13**

**API Calls:**
```javascript
// 1. Skills semantic matching
const embedding1 = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: jobSkills.join(", ")
});

const embedding2 = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: candidateSkills.join(", ")
});

// Calculate cosine similarity
const similarity = cosineSimilarity(embedding1, embedding2);

// 2. Application quality assessment
const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{
    role: "system",
    content: "You are an expert recruiter evaluating candidate applications."
  }, {
    role: "user",
    content: `Rate this achievement summary from 0-100: "${candidate.summary}"`
  }],
  temperature: 0.3,
  max_tokens: 10
});

// 3. CV parsing (optional, if CV uploaded)
const cvAnalysis = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{
    role: "user",
    content: `Extract skills, experience, and qualifications from this CV: "${cvText}"`
  }],
  temperature: 0.1,
  max_tokens: 500
});
```

#### **Option 2: Anthropic Claude Sonnet (Alternative)**

**Cost per candidate:** ~$0.003
**Pros:** Better reasoning, higher quality
**Cons:** Slightly more expensive

#### **Option 3: Open Source (Llama 3 via Groq API)**

**Cost per candidate:** $0.0005
**Pros:** Cheaper, fast inference
**Cons:** May need more prompt engineering

### **RECOMMENDATION:**
**Use OpenAI GPT-3.5-turbo + Embeddings**
- Proven technology
- Excellent cost/performance
- Easy integration
- Can upgrade to GPT-4 for complex cases later

---

## 3. Platform Partner Integration

### The Platform Partner Challenge

You mentioned wanting to track which platforms bring the best candidates. This is crucial for ROI analysis.

### Solution: **UTM-Based Tracking + Unique Job Links**

#### How It Works:

1. **Base Job Link:**
   ```
   https://aptus.io/jobs/abc123/apply
   ```

2. **Platform-Specific Links:**
   ```
   https://aptus.io/jobs/abc123/apply?source=whatsapp-tech-professionals
   https://aptus.io/jobs/abc123/apply?source=telegram-nigerian-devs
   https://aptus.io/jobs/abc123/apply?source=facebook-engineering-hub
   https://aptus.io/jobs/abc123/apply?source=linkedin-organic
   https://aptus.io/jobs/abc123/apply?source=jobberman
   ```

3. **Tracking in Database:**
   ```javascript
   candidate: {
     id: "...",
     jobId: "abc123",
     source: "whatsapp-tech-professionals", // Captured from URL
     appliedAt: "2025-01-15T10:30:00Z",
     matchScore: 85,
     status: "shortlisted"
   }
   ```

4. **Analytics Dashboard for Recruiter:**
   ```
   Source Performance:
   ─────────────────────────────────────────────
   WhatsApp - Tech Professionals NG
     Applications: 12
     Avg Match Score: 78%
     Shortlisted: 5
     Quality Rating: ⭐⭐⭐⭐
   
   Telegram - Nigerian Developers
     Applications: 8
     Avg Match Score: 82%
     Shortlisted: 4
     Quality Rating: ⭐⭐⭐⭐⭐
   
   LinkedIn Organic
     Applications: 3
     Avg Match Score: 65%
     Shortlisted: 1
     Quality Rating: ⭐⭐⭐
   ```

### Job Posting Automation Strategy

#### **Manual Posting (MVP Phase 1)**

**Why start manual?**
- ✅ Validates which platforms actually work
- ✅ Builds relationships with community admins
- ✅ No API integration costs upfront
- ✅ Flexibility to test messaging

**Process:**
1. Recruiter creates job on Aptus
2. Gets shareable links with source tracking
3. Copy-paste job description + link to each platform
4. Track which platforms perform best

**Template for Community Posting:**
```
🎯 New Opportunity: Senior Software Engineer

We're hiring a Senior Software Engineer with 5+ years of experience in Python, Django, and AWS.

Location: Lagos (Hybrid)
Compensation: Competitive

Apply via Aptus: https://aptus.io/jobs/abc123/apply?source=whatsapp-tech-professionals

Aptus uses AI to match your skills with the role - you'll know your match score instantly! ✨
```

#### **Semi-Automated Posting (Phase 2)**

**Platforms with APIs:**
- LinkedIn Jobs API (paid)
- Indeed API (paid)
- Glassdoor (no easy API)
- **Nigerian platforms:** Jobberman (check for API)

**Platforms without APIs (most WhatsApp/Telegram/Facebook groups):**
- Remain manual
- Build relationships with admins
- Negotiate fixed-price or per-applicant deals

**Automation Priority:**
1. **LinkedIn** - High quality, has API
2. **Indeed** - High volume, has API
3. **Jobberman** - Local, check API availability
4. **Communities** - Manual (relationship-driven)

### Platform Partnership Model

#### **Revenue Share Model (Recommended):**

**For Community Admins/Owners:**
- They post your jobs to their groups
- You pay them per qualified applicant
- Qualified = Match score >70%

**Pricing Example:**
```
Per Qualified Applicant: ₦1,000 - ₦2,000
(Community gets paid, you get quality leads)

Alternative:
Per Shortlisted Candidate: ₦5,000 - ₦10,000
(Higher reward for better quality)
```

**Tracking:**
- Each community gets unique link
- Dashboard shows their performance
- Auto-calculate their earnings
- Monthly payout

---

## 4. Real-Time Updates

### Architecture: **Event-Driven Updates**

#### **Option 1: Firebase Realtime Database (Recommended for MVP)**

**Why Firebase?**
- ✅ True real-time updates
- ✅ Very easy to implement
- ✅ Handles scaling automatically
- ✅ Free tier: 10GB storage, 50K connections
- ✅ No backend code needed for basic features

**What Updates in Real-Time:**
1. ✅ New applicant appears instantly
2. ✅ Application count updates
3. ✅ Match scores calculated and displayed
4. ✅ Shortlist/reject updates across all connected recruiters

**Implementation:**
```javascript
// In recruiter dashboard
const jobRef = firebase.database().ref(`jobs/${jobId}`);

jobRef.on('value', (snapshot) => {
  const data = snapshot.val();
  
  // Update UI automatically
  document.getElementById('stat-applicants').textContent = data.applicantCount;
  document.getElementById('stat-shortlisted').textContent = data.shortlistedCount;
  
  // Refresh candidate table
  renderCandidates(data.candidates);
});

// When candidate applies
firebase.database().ref(`jobs/${jobId}/candidates`).push({
  name: "...",
  matchScore: 85,
  appliedAt: Date.now(),
  status: "pending"
});
// ↑ This triggers the 'value' event above automatically!
```

**Cost:**
- Free tier: Up to 100 concurrent connections
- Paid: $5/GB stored per month (very affordable)

#### **Option 2: Supabase Realtime (Alternative)**

- Built on PostgreSQL
- Real-time subscriptions
- More control than Firebase
- Similar ease of use

#### **Option 3: WebSockets + Node.js (More complex)**

- Custom backend needed
- More control but more work
- Only if you need very specific features

### **RECOMMENDATION:**
**Use Firebase Realtime Database for MVP**
- Get real-time working in 1-2 days
- Scale to 1000s of users easily
- Add custom backend later if needed

---

## 5. Tech Stack Recommendations

### **Frontend (No change needed)**
- HTML/CSS/JavaScript (current)
- Can migrate to React later if needed
- Keep it simple for MVP

### **Backend & Database**

#### **Recommended Stack: Firebase**

**Services you'll use:**
1. **Firebase Realtime Database** - Real-time data sync
2. **Firebase Storage** - CV/resume uploads
3. **Firebase Functions** - Serverless API endpoints
4. **Firebase Hosting** - Host your app

**Why Firebase?**
- ✅ All-in-one platform
- ✅ Real-time out of the box
- ✅ Generous free tier
- ✅ Scales automatically
- ✅ Easy to start, can migrate later

**Alternative Stack:**
- **Supabase** (open source Firebase alternative)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Hosting:** Vercel or Netlify

### **AI Integration**

**OpenAI API:**
```javascript
// Install: npm install openai

const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Your AI functions here
```

### **File Uploads (CV/Resume)**

**Firebase Storage:**
```javascript
const storageRef = firebase.storage().ref();
const cvRef = storageRef.child(`cvs/${candidateId}.pdf`);

// Upload
await cvRef.put(file);

// Get download URL
const url = await cvRef.getDownloadURL();
```

**Processing PDFs:**
- **Library:** pdf-parse (Node.js)
- **Extract text from PDF**
- **Send to OpenAI for analysis**

---

## 6. Cost Analysis

### Monthly Cost Breakdown (100 applications/month)

| Service | Usage | Cost |
|---------|-------|------|
| **Firebase** | | |
| Realtime Database | 1GB storage, 10K reads/day | Free tier |
| Storage | 5GB (CV files) | Free tier |
| Functions | 100K invocations | Free tier |
| Hosting | 10GB transfer | Free tier |
| **OpenAI** | | |
| GPT-3.5-turbo | 100 candidates × $0.0003 | $0.03 |
| Embeddings | 100 candidates × $0.0001 | $0.01 |
| CV parsing | 50 candidates × $0.001 | $0.05 |
| **Total** | | **$0.09/month** |

### Cost at Scale (1,000 applications/month)

| Service | Usage | Cost |
|---------|-------|------|
| Firebase | Exceeds free tier | ~$25 |
| OpenAI | 1000 candidates | ~$0.90 |
| **Total** | | **$25.90/month** |

### Cost at 10,000 applications/month

| Service | Usage | Cost |
|---------|-------|------|
| Firebase | | ~$100 |
| OpenAI | | ~$9 |
| **Total** | | **$109/month** |

**Extremely cost-effective!** 🎉

---

## 7. Implementation Phases

### **Phase 1: Core MVP (Weeks 1-3)**

**Goal:** Functional job posting + AI ranking

**Features:**
- ✅ Recruiter creates job posting
- ✅ Generates unique job link
- ✅ Candidate applies via form
- ✅ CV upload (optional)
- ✅ AI calculates match score (real-time)
- ✅ Ranked candidate list
- ✅ Shortlist/reject buttons
- ✅ Source tracking (UTM parameters)

**No Auth Yet** - Use unique URLs

**Tech:**
- Firebase Realtime Database
- Firebase Functions (AI processing)
- OpenAI API
- Current frontend

### **Phase 2: Real-Time + Analytics (Week 4)**

**Features:**
- ✅ Real-time applicant updates
- ✅ Platform performance dashboard
- ✅ Email notifications (recruiter)
- ✅ Application status emails (candidate)
- ✅ Export candidates to CSV

**Tech:**
- Firebase Realtime sync
- SendGrid or Firebase Email extension

### **Phase 3: Magic Link Auth (Week 5-6)**

**Features:**
- ✅ Recruiter enters email
- ✅ Magic link authentication
- ✅ View all job postings
- ✅ Historical data

**Tech:**
- Firebase Auth (magic link)

### **Phase 4: Platform Partnerships (Week 7-8)**

**Features:**
- ✅ Partner dashboard
- ✅ Revenue tracking
- ✅ Automated payouts (manual for MVP)
- ✅ API for partners

### **Phase 5: Advanced Features (Week 9+)**

- LinkedIn API integration
- Interview scheduling
- Recruiter collaboration
- Advanced analytics

---

## Key Decisions Summary

### ✅ **RECOMMENDED DECISIONS:**

1. **Authentication:** Start with NO LOGIN (unique URLs), add magic link in Phase 3
2. **AI Ranking:** Hybrid approach (70% structured form data, 30% CV analysis)
3. **AI Provider:** OpenAI GPT-3.5-turbo + Embeddings
4. **Database:** Firebase Realtime Database
5. **Platform Tracking:** UTM parameters + unique links per platform
6. **Job Distribution:** Manual posting initially, automate LinkedIn/Indeed in Phase 4
7. **Revenue Model:** Pay per qualified applicant to community partners

### 💰 **Cost Efficiency:**
- ~$0.09/month for 100 applications
- ~$26/month for 1,000 applications
- Extremely scalable

### 🚀 **Implementation:**
- Start with Phase 1 (Core MVP) - 3 weeks
- Add real-time in Phase 2 - 1 week
- Iterate based on feedback

---

## Next Steps

**Before writing code, let's confirm:**

1. ✅ Are you comfortable starting with NO LOGIN (unique URLs)?
2. ✅ Do you agree with the AI ranking approach (form data primary, CV secondary)?
3. ✅ Is Firebase + OpenAI the right tech stack for you?
4. ✅ Do you want to start with manual platform posting or build API integrations now?
5. ✅ Any specific concerns or changes to this design?

Let me know your thoughts and we can create a detailed implementation spec! 🎯
