import { parseRecruiterQuery, buildLocationClause } from '../../services/groqParser.js';
import { searchCandidates, matchTalentPoolCandidates, NIGERIAN_TALENT_POOL } from '../../services/pdlService.js';
import { evaluateCandidateSignals } from '../../services/marketInsightsEngine.js';
import { getSalaryBenchmark } from '../../services/salaryBenchmarkService.js';

function isCandidateRoleRelevant(candidate, targetRole, roleSynonyms = []) {
  if (!targetRole) return true;
  const target = targetRole.toLowerCase().trim();
  const candTitle = (candidate.currentTitle || '').toLowerCase();
  const historyTitles = (candidate.experience || []).map(e => (e.title || '').toLowerCase());
  const allCandTitles = [candTitle, ...historyTitles];

  const stopWords = new Set(['and', 'the', 'for', 'with', 'lead', 'senior', 'head', 'officer', 'manager', 'director', 'specialist', 'executive', 'associate', 'chief']);
  const keyWords = target.split(/[\s/\\-]+/).filter(w => w.length > 2 && !stopWords.has(w));

  if (keyWords.length > 0) {
    const hasKeyWordInTitle = keyWords.some(kw => allCandTitles.some(t => t.includes(kw)));
    if (hasKeyWordInTitle) return true;
  } else {
    if (allCandTitles.some(t => t.includes(target))) return true;
  }

  if (Array.isArray(roleSynonyms)) {
    for (const syn of roleSynonyms) {
      if (syn && syn.length > 3) {
        const synKeyWords = syn.toLowerCase().split(/[\s/\\-]+/).filter(w => w.length > 3 && !stopWords.has(w));
        if (synKeyWords.some(kw => allCandTitles.some(t => t.includes(kw)))) {
          return true;
        }
      }
    }
  }

  return false;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { prompt, criteria } = body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'Search prompt cannot be empty' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const criteriaList = Array.isArray(criteria) ? criteria : [];

    // Step 1: Interpret conversational prompt & criteria using Groq AI
    const { structuredParams, sqlQuery } = await parseRecruiterQuery(prompt, criteriaList, env.GROQ_API_KEY);

    // Step 2: Fetch candidates from PDL
    let candidates = [];
    try {
      candidates = await searchCandidates(sqlQuery, structuredParams, prompt, env.PEOPLE_DATA_LABS_API_KEY);
    } catch (sqlErr) {
      console.warn('[Initial Query Failed]:', sqlErr.message);
    }

    // Role Guardrail: verify candidate relevance
    let relevantCandidates = candidates.filter(candidate => 
      isCandidateRoleRelevant(candidate, structuredParams.cleanRoleTitle, structuredParams.roleSynonyms)
    );

    if (relevantCandidates.length === 0 && candidates.length > 0) {
      if (structuredParams.cleanRoleTitle) {
        const role = structuredParams.cleanRoleTitle.toLowerCase().trim();
        const locClause = buildLocationClause(structuredParams.targetLocation, prompt);
        const strictSql = `SELECT * FROM person WHERE ${locClause} AND (job_title LIKE '%${role}%');`;
        try {
          const strictRes = await searchCandidates(strictSql, structuredParams, prompt, env.PEOPLE_DATA_LABS_API_KEY);
          relevantCandidates = strictRes.filter(c => isCandidateRoleRelevant(c, structuredParams.cleanRoleTitle, structuredParams.roleSynonyms));
        } catch (strictErr) {
          console.warn('[Strict Role Retry Failed]:', strictErr.message);
        }
      }

      if (relevantCandidates.length === 0) {
        relevantCandidates = matchTalentPoolCandidates(NIGERIAN_TALENT_POOL, { prompt, structuredParams, limit: 1 });
      }
    } else if (relevantCandidates.length === 0 && candidates.length === 0) {
      if (structuredParams.cleanRoleTitle) {
        const role = structuredParams.cleanRoleTitle.toLowerCase().trim();
        const locClause = buildLocationClause(structuredParams.targetLocation, prompt);
        const fallbackSql = `SELECT * FROM person WHERE ${locClause} AND (job_title LIKE '%${role}%');`;
        try {
          const fbCandidates = await searchCandidates(fallbackSql, structuredParams, prompt, env.PEOPLE_DATA_LABS_API_KEY);
          relevantCandidates = fbCandidates.filter(c => isCandidateRoleRelevant(c, structuredParams.cleanRoleTitle, structuredParams.roleSynonyms));
        } catch (fbErr) {
          console.warn('[Fallback Query Failed]:', fbErr.message);
        }
      }

      if (relevantCandidates.length === 0) {
        relevantCandidates = matchTalentPoolCandidates(NIGERIAN_TALENT_POOL, { prompt, structuredParams, limit: 1 });
      }
    }

    // Step 3: Fast card evaluation (role, experience depth, criteria matches)
    const enrichedCandidates = relevantCandidates.map(candidate => {
      const evaluations = evaluateCandidateSignals(candidate, structuredParams, criteriaList);
      const salaryBenchmark = getSalaryBenchmark(structuredParams.industry, candidate.currentTitle);

      return {
        ...candidate,
        evaluations: {
          ...evaluations,
          likelyToSwitch: null
        },
        salaryBenchmark
      };
    });

    return new Response(JSON.stringify({
      success: true,
      query: prompt,
      structuredParams,
      totalReturned: enrichedCandidates.length,
      candidates: enrichedCandidates
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to complete search query',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
