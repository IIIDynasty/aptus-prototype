import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { parseRecruiterQuery, buildLocationClause } from './services/groqParser.js';
import { searchCandidates } from './services/pdlService.js';
import { evaluateCandidateSignals, evaluateLikelyToSwitchSignals } from './services/marketInsightsEngine.js';
import { getSalaryBenchmark } from './services/salaryBenchmarkService.js';
import { findCandidateEmail } from './services/hunterService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'WhoGPT Agents',
    version: '1.0.0-mvp',
    services: {
      groq: Boolean(process.env.GROQ_API_KEY),
      pdl: Boolean(process.env.PEOPLE_DATA_LABS_API_KEY),
      hunter: Boolean(process.env.HUNTER_API_KEY)
    }
  });
});

/**
 * POST /api/search
 * Core conversational talent search endpoint
 * 1. Parses recruiter prompt with Groq
 * 2. Fetches up to 3 candidates from PDL (credit guardrail)
 * 3. Applies African Talent-Market Dual Assessment (Talent Match + Opportunity Signal)
 * 4. Attaches transparent NGN monthly salary benchmarks with provenance
 */
app.post('/api/search', async (req, res) => {
  const { prompt, criteria } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Search prompt cannot be empty' });
  }

  const criteriaList = Array.isArray(criteria) ? criteria : [];

  console.log(`\n========================================`);
  console.log(`[WhoGPT Search Request]: "${prompt}"`);
  if (criteriaList.length > 0) {
    console.log(`[Added Criteria]: ${JSON.stringify(criteriaList)}`);
  }
  console.log(`========================================`);

  try {
    // Step 1: Interpret conversational prompt & criteria using Groq AI
    const { structuredParams, sqlQuery } = await parseRecruiterQuery(prompt, criteriaList);
    console.log('[Structured Params]:', JSON.stringify(structuredParams));
    console.log('[Generated PDL SQL]:', sqlQuery);

    // Step 2: Fetch candidates from PDL or targeted talent pool (credit guardrail: 1 profile)
    let candidates = [];
    try {
      candidates = await searchCandidates(sqlQuery, structuredParams, prompt);
    } catch (sqlErr) {
      console.warn('[Initial Query Failed]:', sqlErr.message);
    }

    // If query with strict criteria yielded 0, fall back to matching the role title and location in Nigeria
    if (candidates.length === 0 && structuredParams.cleanRoleTitle) {
      console.log('[Notice] Retrying with core role title and target location in Nigeria...');
      const role = structuredParams.cleanRoleTitle.toLowerCase().trim();
      const locClause = buildLocationClause(structuredParams.targetLocation, prompt);
      const fallbackSql = `SELECT * FROM person WHERE ${locClause} AND (job_title LIKE '%${role}%');`;
      try {
        candidates = await searchCandidates(fallbackSql, structuredParams, prompt);
      } catch (fbErr) {
        console.warn('[Fallback Query Failed]:', fbErr.message);
      }
    }

    // Step 3: Fast card evaluation (role, experience depth, criteria matches)
    const enrichedCandidates = candidates.map(candidate => {
      const evaluations = evaluateCandidateSignals(candidate, structuredParams, criteriaList);
      const salaryBenchmark = getSalaryBenchmark(structuredParams.industry, candidate.currentTitle);

      return {
        ...candidate,
        evaluations: {
          ...evaluations,
          likelyToSwitch: null // On-demand: processed only when recruiter clicks to inspect full profile
        },
        salaryBenchmark
      };
    });

    console.log(`[Results Returned]: ${enrichedCandidates.length} candidate(s) evaluated.`);

    return res.json({
      success: true,
      query: prompt,
      structuredParams,
      totalReturned: enrichedCandidates.length,
      candidates: enrichedCandidates
    });
  } catch (error) {
    console.error('[WhoGPT Search Error]:', error);
    return res.status(500).json({
      error: 'Failed to complete search query',
      details: error.message
    });
  }
});

/**
 * POST /api/candidate-signals
 * On-demand processing: Only evaluates the 9 Likely-to-Switch signals & AI Opportunity Briefing
 * when the recruiter opens the candidate profile drawer.
 */
app.post('/api/candidate-signals', (req, res) => {
  const { candidate, searchContext } = req.body;
  if (!candidate) {
    return res.status(400).json({ error: 'Candidate profile is required' });
  }

  try {
    const likelyToSwitch = evaluateLikelyToSwitchSignals(candidate, searchContext || {});
    return res.json({ success: true, likelyToSwitch });
  } catch (err) {
    console.error('[Signals Error]:', err);
    return res.status(500).json({ error: 'Failed to evaluate candidate signals', details: err.message });
  }
});

/**
 * POST /api/reveal-contact
 * On-demand email reveal using Hunter.io
 * Only consumes 1 credit when explicitly requested by recruiter
 */
app.post('/api/reveal-contact', async (req, res) => {
  const { firstName, lastName, domain, companyName } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'firstName and lastName are required' });
  }

  console.log(`[Hunter.io Request]: Lookup email for ${firstName} ${lastName} @ ${domain || companyName}`);

  try {
    const contactData = await findCandidateEmail({ firstName, lastName, domain, companyName });
    return res.json({
      success: true,
      contact: contactData
    });
  } catch (error) {
    console.error('[Hunter.io Error]:', error);
    return res.status(500).json({
      error: 'Failed to retrieve contact information',
      details: error.message
    });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n🚀 WhoGPT Backend Server running on http://localhost:${PORT}`);
  console.log(`⚡ Groq AI Parser: Active`);
  console.log(`🔎 PDL Search (Max 3 candidates): Active`);
  console.log(`🎯 Hunter.io Email Reveal: Active (On-Demand)\n`);
});
