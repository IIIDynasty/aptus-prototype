import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Parses freeform recruiter search query and optional criteria into structured search parameters using Groq
 * @param {string} prompt - Recruiter's conversational description of the ideal candidate
 * @param {Array<string>} [criteria=[]] - Optional additional criteria tags selected or typed by recruiter
 * @returns {Promise<Object>} Structured search params and PDL SQL query
 */
export async function parseRecruiterQuery(prompt, criteria = []) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Search prompt cannot be empty');
  }

  const cleanCriteria = Array.isArray(criteria) ? criteria.filter(c => typeof c === 'string' && c.trim().length > 0) : [];

  const systemInstructions = `You are the AI query parser for WhoGPT Agents, an African talent sourcing platform.
Your task is to analyze a recruiter's natural language request and any optional criteria to extract structured parameters for discovering candidates in Nigeria.

The platform focuses on 5 core industries in Nigeria:
1. Financial Services & Fintech
2. Technology
3. Oil & Gas / Energy
4. FMCG
5. Telecommunications

CRITICAL REQUIREMENTS FOR ROLE TITLE & SYNONYMS:
- DO NOT generate short 2-3 letter abbreviations or acronyms (e.g., "cro", "pm", "vp", "hr", "it", "coo", "ceo", "cto", "cmo", "cfo", "swe", "qa") in roleSynonyms or mandatoryKeywords. Short acronyms cause catastrophic substring collisions in database search (e.g. 'cro' matches 'microbiology', 'pm' matches 'equipment').
- roleSynonyms MUST ALWAYS be full, multi-word or descriptive job titles (e.g., for "Chief Risk Officer": ["head of risk", "director of risk management", "enterprise risk manager", "chief risk management officer"]; for "VP of Supply Chain": ["head of supply chain", "director of supply chain", "supply chain director"]).
- Do NOT split compound titles into loose OR single-word keywords (e.g., "product designer" must NEVER match just "product" or just "production").
- Identify mandatory keywords that MUST appear in the role title (e.g. for "Product Designer", "designer" is mandatory).

Return ONLY a valid JSON object matching this schema without any markdown formatting:
{
  "cleanRoleTitle": "Primary job title (e.g. Product Designer, Engineering Manager)",
  "mandatoryKeywords": ["mandatory_keyword1"],
  "roleSynonyms": ["synonym 1", "synonym 2"],
  "skills": ["Skill 1", "Skill 2"],
  "minYearsExperience": 5 or null,
  "industry": "One of: Financial Services & Fintech | Technology | Oil & Gas | FMCG | Telecommunications | General",
  "seniority": "One of: Senior | Lead | Director | VP | Executive | C-Suite",
  "targetLocation": "Specific Nigerian state or city (e.g. Kano, Lagos, Abuja, Port Harcourt, Ibadan, Enugu, Kaduna, etc.) or Nigeria if nationwide",
  "parsedCriteria": [
    {
      "label": "Short criterion name",
      "type": "industry | skill | cross_border | experience | company",
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}`;

  const userPromptText = `Recruiter Prompt: "${prompt.trim()}"` +
    (cleanCriteria.length > 0 ? `\nAdditional Criteria: ${JSON.stringify(cleanCriteria)}` : '');

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: userPromptText }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const parsedJson = JSON.parse(chatCompletion.choices[0].message.content);
    const sqlQuery = buildPdlSql(parsedJson, cleanCriteria);

    return {
      structuredParams: parsedJson,
      sqlQuery
    };
  } catch (error) {
    console.warn('[Groq Parser Warning] Falling back to rule-based parser:', error.message);
    return fallbackRuleParser(prompt, cleanCriteria);
  }
}

// Comprehensive Nigerian state and major city mappings
export const NIGERIAN_LOCATION_MAP = {
  'kano': { city: 'kano', state: 'kano' },
  'lagos': { city: 'lagos', state: 'lagos' },
  'abuja': { city: 'abuja', state: 'fct' },
  'fct': { city: 'abuja', state: 'fct' },
  'federal capital territory': { city: 'abuja', state: 'fct' },
  'port harcourt': { city: 'port harcourt', state: 'rivers' },
  'rivers': { city: 'port harcourt', state: 'rivers' },
  'ibadan': { city: 'ibadan', state: 'oyo' },
  'oyo': { city: 'ibadan', state: 'oyo' },
  'kaduna': { city: 'kaduna', state: 'kaduna' },
  'enugu': { city: 'enugu', state: 'enugu' },
  'benin': { city: 'benin city', state: 'edo' },
  'benin city': { city: 'benin city', state: 'edo' },
  'edo': { city: 'benin city', state: 'edo' },
  'asaba': { city: 'asaba', state: 'delta' },
  'warri': { city: 'warri', state: 'delta' },
  'delta': { city: 'asaba', state: 'delta' },
  'abeokuta': { city: 'abeokuta', state: 'ogun' },
  'ogun': { city: 'abeokuta', state: 'ogun' },
  'jos': { city: 'jos', state: 'plateau' },
  'plateau': { city: 'jos', state: 'plateau' },
  'ilorin': { city: 'ilorin', state: 'kwara' },
  'kwara': { city: 'ilorin', state: 'kwara' },
  'calabar': { city: 'calabar', state: 'cross river' },
  'cross river': { city: 'calabar', state: 'cross river' },
  'uyo': { city: 'uyo', state: 'akwa ibom' },
  'akwa ibom': { city: 'uyo', state: 'akwa ibom' },
  'owerri': { city: 'owerri', state: 'imo' },
  'imo': { city: 'owerri', state: 'imo' },
  'awka': { city: 'awka', state: 'anambra' },
  'onitsha': { city: 'onitsha', state: 'anambra' },
  'anambra': { city: 'awka', state: 'anambra' },
  'akure': { city: 'akure', state: 'ondo' },
  'ondo': { city: 'akure', state: 'ondo' },
  'osogbo': { city: 'osogbo', state: 'osun' },
  'osun': { city: 'osogbo', state: 'osun' },
  'aba': { city: 'aba', state: 'abia' },
  'umuahia': { city: 'umuahia', state: 'abia' },
  'abia': { city: 'umuahia', state: 'abia' },
  'sokoto': { city: 'sokoto', state: 'sokoto' },
  'maiduguri': { city: 'maiduguri', state: 'borno' },
  'borno': { city: 'maiduguri', state: 'borno' },
  'katsina': { city: 'katsina', state: 'katsina' },
  'minna': { city: 'minna', state: 'niger' },
  'niger': { city: 'minna', state: 'niger' },
  'makurdi': { city: 'makurdi', state: 'benue' },
  'benue': { city: 'makurdi', state: 'benue' },
  'lafia': { city: 'lafia', state: 'nasarawa' },
  'nasarawa': { city: 'lafia', state: 'nasarawa' },
  'yola': { city: 'yola', state: 'adamawa' },
  'adamawa': { city: 'yola', state: 'adamawa' },
  'gombe': { city: 'gombe', state: 'gombe' },
  'bauchi': { city: 'bauchi', state: 'bauchi' },
  'jalingo': { city: 'jalingo', state: 'taraba' },
  'taraba': { city: 'jalingo', state: 'taraba' },
  'damaturu': { city: 'damaturu', state: 'yobe' },
  'yobe': { city: 'damaturu', state: 'yobe' },
  'dutse': { city: 'dutse', state: 'jigawa' },
  'jigawa': { city: 'dutse', state: 'jigawa' },
  'birnin kebbi': { city: 'birnin kebbi', state: 'kebbi' },
  'kebbi': { city: 'birnin kebbi', state: 'kebbi' },
  'gusau': { city: 'gusau', state: 'zamfara' },
  'zamfara': { city: 'gusau', state: 'zamfara' },
  'lokoja': { city: 'lokoja', state: 'kogi' },
  'kogi': { city: 'lokoja', state: 'kogi' },
  'ado-ekiti': { city: 'ado-ekiti', state: 'ekiti' },
  'ekiti': { city: 'ado-ekiti', state: 'ekiti' },
  'yenagoa': { city: 'yenagoa', state: 'bayelsa' },
  'bayelsa': { city: 'yenagoa', state: 'bayelsa' },
  'abakaliki': { city: 'abakaliki', state: 'ebonyi' },
  'ebonyi': { city: 'abakaliki', state: 'ebonyi' }
};

/**
 * Builds high-precision, strict location SQL clause for any Nigerian state or city
 */
export function buildLocationClause(targetLocation, rawPrompt = '') {
  let locationClause = `location_country = 'nigeria'`;
  const combined = `${targetLocation || ''} ${rawPrompt || ''}`.toLowerCase();

  // Find matching Nigerian city or state
  let matchedKey = null;
  const keys = Object.keys(NIGERIAN_LOCATION_MAP).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const regex = new RegExp(`\\b${k}\\b`, 'i');
    if (regex.test(combined)) {
      matchedKey = k;
      break;
    }
  }

  if (matchedKey) {
    const mapped = NIGERIAN_LOCATION_MAP[matchedKey];
    if (mapped.city === mapped.state) {
      locationClause += ` AND (location_locality = '${mapped.city}' OR location_region = '${mapped.city}' OR location_name LIKE '%${mapped.city}%')`;
    } else {
      locationClause += ` AND (location_locality = '${mapped.city}' OR location_region = '${mapped.state}' OR location_name LIKE '%${mapped.city}%' OR location_name LIKE '%${mapped.state}%')`;
    }
  } else {
    const clean = (targetLocation || '').toLowerCase().replace(/state|nigeria|general/gi, '').trim();
    if (clean && clean.length > 2) {
      locationClause += ` AND (location_locality = '${clean}' OR location_region = '${clean}' OR location_name LIKE '%${clean}%')`;
    }
  }

  return locationClause;
}

/**
 * Constructs a high-precision, strict PDL SQL string targeting Nigeria
 * Avoids false-positive keywords like 'product' matching 'production manager'.
 */
export function buildPdlSql(params, criteria = []) {
  const locationClause = buildLocationClause(params.targetLocation);

  const roleTitle = (params.cleanRoleTitle || '').toLowerCase().trim();
  const rawSynonyms = Array.isArray(params.roleSynonyms) ? params.roleSynonyms.map(s => s.toLowerCase().trim()).filter(Boolean) : [];
  
  // Filter out dangerous short acronyms (< 4 letters like cro, pm, vp, hr, it, etc.) that match arbitrary substrings
  const safeSynonyms = rawSynonyms.filter(syn => {
    if (!syn || syn.length <= 3) return false;
    const badAcronyms = ['cro', 'pm', 'vp', 'hr', 'it', 'coo', 'ceo', 'cto', 'cmo', 'cfo', 'swe', 'qa', 'dev'];
    return !badAcronyms.includes(syn);
  });

  let titleConditions = [];

  // 1. Exact phrase match on role title
  if (roleTitle) {
    titleConditions.push(`job_title LIKE '%${roleTitle}%'`);
  }

  // 2. Add high-confidence synonyms (max 2)
  safeSynonyms.slice(0, 2).forEach(syn => {
    if (syn !== roleTitle && !titleConditions.includes(`job_title LIKE '%${syn}%'`)) {
      titleConditions.push(`job_title LIKE '%${syn}%'`);
    }
  });

  // 4. Special cases for common modern tech roles
  if (roleTitle.includes('product designer') || roleTitle.includes('ux designer') || roleTitle.includes('ui designer')) {
    if (!titleConditions.some(c => c.includes('ui/ux'))) {
      titleConditions.push(`job_title LIKE '%ui%ux%'`);
      titleConditions.push(`job_title LIKE '%ux designer%'`);
    }
  }

  // Deduplicate conditions
  titleConditions = Array.from(new Set(titleConditions));

  let titleClause = '';
  if (titleConditions.length > 0) {
    titleClause = ` AND (${titleConditions.join(' OR ')})`;
  } else if (params.mandatoryKeywords && params.mandatoryKeywords.length > 0) {
    const safeKw = params.mandatoryKeywords.filter(k => k && k.length > 3);
    if (safeKw.length > 0) {
      titleClause = ` AND job_title LIKE '%${safeKw[0]}%'`;
    }
  }

  // 5. Industry / Sector filtering if specified in prompt or criteria
  const combinedContext = [
    params.industry || '',
    ...(Array.isArray(criteria) ? criteria : []),
    ...(Array.isArray(params.parsedCriteria) ? params.parsedCriteria.flatMap(p => p.keywords || []) : []),
    ...(Array.isArray(params.skills) ? params.skills : [])
  ].join(' ').toLowerCase();

  let industryConditions = [];
  if (/telecom|telco|mobile network/i.test(combinedContext)) {
    industryConditions.push(`job_company_industry = 'telecommunications' OR job_company_name LIKE '%mtn%' OR job_company_name LIKE '%airtel%' OR job_company_name LIKE '%glo%' OR job_company_name LIKE '%9mobile%' OR job_company_name LIKE '%telecom%'`);
  } else if (/fintech|banking|financial services|payment/i.test(combinedContext)) {
    if (/payment/i.test(combinedContext)) {
      industryConditions.push(`job_company_industry = 'financial services' OR job_company_industry = 'banking' OR job_company_industry = 'fintech' OR job_company_name LIKE '%flutterwave%' OR job_company_name LIKE '%paystack%' OR job_company_name LIKE '%interswitch%' OR skills LIKE '%payment%' OR summary LIKE '%payment%'`);
    } else {
      industryConditions.push(`job_company_industry = 'financial services' OR job_company_industry = 'banking' OR job_company_industry = 'fintech' OR job_company_name LIKE '%flutterwave%' OR job_company_name LIKE '%paystack%' OR job_company_name LIKE '%interswitch%' OR job_company_name LIKE '%bank%'`);
    }
  } else if (/oil|gas|petroleum|energy/i.test(combinedContext)) {
    industryConditions.push(`job_company_industry = 'oil & energy' OR job_company_industry = 'petroleum' OR job_company_name LIKE '%shell%' OR job_company_name LIKE '%seplat%' OR job_company_name LIKE '%oando%' OR job_company_name LIKE '%chevron%'`);
  } else if (/fmcg|consumer goods/i.test(combinedContext)) {
    industryConditions.push(`job_company_industry = 'consumer goods' OR job_company_name LIKE '%nestle%' OR job_company_name LIKE '%unilever%' OR job_company_name LIKE '%dangote%'`);
  }

  let industryClause = '';
  if (industryConditions.length > 0) {
    industryClause = ` AND (${industryConditions.join(' OR ')})`;
  }

  return `SELECT * FROM person WHERE ${locationClause}${titleClause}${industryClause};`;
}

/**
 * Fallback parser in case Groq is unavailable
 */
function fallbackRuleParser(prompt, criteria = []) {
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();

  let targetLocation = 'Nigeria';
  for (const k of Object.keys(NIGERIAN_LOCATION_MAP)) {
    if (new RegExp(`\\b${k}\\b`, 'i').test(lower)) {
      targetLocation = k.charAt(0).toUpperCase() + k.slice(1);
      break;
    }
  }

  let industry = 'Technology';
  if (/bank|fintech|risk|aml|compliance|credit|payments/i.test(lower)) industry = 'Financial Services & Fintech';
  else if (/oil|gas|petroleum|drilling|subsurface|upstream/i.test(lower)) industry = 'Oil & Gas';
  else if (/fmcg|sales|supply chain|logistics|consumer/i.test(lower)) industry = 'FMCG';
  else if (/telecom|telco|network|oss|bss|transmission/i.test(lower)) industry = 'Telecommunications';

  let cleanRoleTitle = cleanPrompt
    .replace(/(in\s+[a-z\s]+state|in\s+[a-z\s]+nigeria|in\s+lagos|in\s+abuja|in\s+kano|in\s+nigeria|with\s+\d+\s+years?(\s+of)?\s+experience|with\s+\d+\+\s*yrs?\s+exp)/gi, '')
    .trim();

  if (/product designer/i.test(lower)) cleanRoleTitle = 'Product Designer';
  else if (/engineering manager/i.test(lower)) cleanRoleTitle = 'Engineering Manager';
  else if (/frontend/i.test(lower)) cleanRoleTitle = 'Frontend Engineer';
  else if (/backend/i.test(lower)) cleanRoleTitle = 'Backend Engineer';

  const structuredParams = {
    cleanRoleTitle,
    mandatoryKeywords: cleanRoleTitle.split(' ').filter(w => w.length > 3),
    roleSynonyms: [cleanRoleTitle],
    skills: [],
    industry,
    seniority: /head|director|vp|chief|lead|senior/i.test(lower) ? 'Senior' : 'Senior',
    targetLocation,
    parsedCriteria: criteria.map(c => ({
      label: c,
      type: 'custom',
      keywords: c.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    }))
  };

  return {
    structuredParams,
    sqlQuery: buildPdlSql(structuredParams, criteria)
  };
}
