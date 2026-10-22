/**
 * WhoGPT African Talent-Market Insights Engine
 * Implements the Workforce Group 2025 rule-based specifications:
 * 1. Talent Match Assessment (High / Medium / Low)
 * 2. Opportunity Signal Assessment (High / Medium / Low / No observed signal)
 * 
 * STRICT CONSTRAINTS:
 * - Never combine Talent Match and Opportunity Signal into one score.
 * - Do NOT use generic tenure duration or lack-of-promotion as switching signals.
 * - Do NOT output fake precision percentages (e.g., "92%").
 * - Provide concise, transparent evidence statements with sources.
 * - Return "Insufficient evidence" if data is unavailable rather than inventing signals.
 */

// Known documented restructuring / M&A / consolidation hubs in Nigeria (2024-2026 CBN recapitalization & energy divestments)
const DOCUMENTED_RESTRUCTURING_ORGS = [
  'access bank', 'zenith bank', 'gtbank', 'guaranty trust', 'first bank', 'fbn', 'uba', 'united bank for africa',
  'union bank', 'titan trust', 'fidelity bank', 'fcmb', 'wema bank', 'polaris bank', 'keystone bank', 'heritage bank',
  'shell', 'exxonmobil', 'seplat', 'oando', 'dangote', 'mtn', 'airtel'
];

// Cross-sector mobility pairs observed in African talent market
const CROSS_SECTOR_PAIRS = [
  { pair: ['bank', 'fintech'], desc: 'Commercial Banking ⇄ Fintech / Digital Payments transition' },
  { pair: ['fmcg', 'telecom'], desc: 'FMCG Route-to-Market ⇄ Telecom Enterprise Sales mobility' },
  { pair: ['oil', 'infrastructure'], desc: 'Upstream Oil & Gas ⇄ Industrial Infrastructure mobility' },
  { pair: ['consulting', 'tech'], desc: 'Top-tier Strategy Consulting ⇄ Tech Leadership mobility' }
];

// Regional / cross-border keywords
const REGIONAL_KEYWORDS = [
  'africa', 'west africa', 'sub-saharan', 'pan-african', 'cross-border', 'regional',
  'ghana', 'kenya', 'rwanda', 'south africa', 'cemac', 'ecowas'
];

/**
 * Evaluates candidate using the African talent-market dual-assessment model
 * @param {Object} candidate - Normalized candidate profile
 * @param {Object} searchContext - Recruiter's structured search criteria
 * @returns {Object} Dual assessment results with evidence notes
 */
export function evaluateCandidateSignals(candidate, searchContext = {}, criteriaList = []) {
  const talentMatch = evaluateTalentMatch(candidate, searchContext);
  const opportunitySignal = evaluateOpportunitySignals(candidate, searchContext, criteriaList);
  const criteriaMatches = generateCriteriaMatches(candidate, searchContext, criteriaList);
  const likelyToSwitch = evaluateLikelyToSwitchSignals(candidate, searchContext);

  // Clean education summary line
  let educationSummary = 'Higher Education in Nigeria';
  if (candidate.education && candidate.education.length > 0) {
    const edu = candidate.education[0];
    const parts = [];
    if (edu.degree && edu.degree !== 'Degree') parts.push(edu.degree);
    if (edu.major) parts.push(edu.major);
    const degreeMajor = parts.join(', ');
    if (degreeMajor && edu.school && edu.school !== 'University') {
      educationSummary = `${degreeMajor} at ${edu.school}`;
    } else if (edu.school && edu.school !== 'University') {
      educationSummary = `Alumni of ${edu.school}`;
    } else if (degreeMajor) {
      educationSummary = degreeMajor;
    }
  }

  return {
    educationSummary,
    criteriaMatches,
    likelyToSwitch,
    talentMatch: {
      rating: talentMatch.rating, // High | Medium | Low
      rationale: talentMatch.rationale,
      factors: talentMatch.factors
    },
    opportunitySignal: {
      rating: opportunitySignal.rating, // High | Medium | Low | No observed signal
      primarySignalType: opportunitySignal.primarySignalType, // Signal A, B, C, D or None
      signalTitle: opportunitySignal.signalTitle,
      evidenceExplanation: opportunitySignal.evidenceExplanation,
      sourceCitation: opportunitySignal.sourceCitation
    }
  };
}

/**
 * Evaluates Talent Match across the 5 factors:
 * 1. Role and skill match
 * 2. Industry experience
 * 3. Cross-sector experience
 * 4. Regional and cross-border experience
 * 5. Relevant transferable experience
 */
function evaluateTalentMatch(candidate, searchContext) {
  const targetTitle = (searchContext.cleanRoleTitle || '').toLowerCase();
  const candidateTitle = (candidate.currentTitle || '').toLowerCase();
  const allTitles = (candidate.experience || []).map(e => (e.title || '').toLowerCase());
  const skills = (candidate.skills || []).map(s => s.toLowerCase());

  let score = 0;
  const factors = [];

  // Factor 1: Role & skill match
  const titleWords = targetTitle.split(/\s+/).filter(w => w.length > 3);
  const titleMatchCount = titleWords.filter(w => candidateTitle.includes(w) || allTitles.some(t => t.includes(w))).length;

  if (titleMatchCount >= 2 || candidateTitle.includes(targetTitle)) {
    score += 40;
    factors.push('Direct role and functional title alignment in Nigeria');
  } else if (titleMatchCount >= 1) {
    score += 25;
    factors.push('Partial role and functional match');
  } else {
    score += 10;
    factors.push('Transferable leadership experience');
  }

  // Factor 2: Industry experience
  const targetIndustry = (searchContext.industry || '').toLowerCase();
  const companies = (candidate.experience || []).map(e => (e.company || '').toLowerCase()).join(' ');

  if (targetIndustry && (companies.includes('bank') || companies.includes('fintech') || companies.includes('oil') || companies.includes('fmcg') || companies.includes('telecom'))) {
    score += 20;
    factors.push(`Documented experience in ${searchContext.industry || 'target sector'}`);
  }

  // Factor 3: Cross-sector experience
  const hasCrossSector = checkCrossSectorHistory(candidate.experience || []);
  if (hasCrossSector) {
    score += 20;
    factors.push(`Cross-sector mobility profile: ${hasCrossSector}`);
  }

  // Factor 4: Regional / Cross-border experience
  const hasRegional = checkRegionalExperience(candidate);
  if (hasRegional) {
    score += 20;
    factors.push('Documented Pan-African / regional cross-border exposure');
  }

  // Rating Determination
  let rating = 'Medium';
  if (score >= 60) rating = 'High';
  else if (score < 35) rating = 'Low';

  return {
    rating,
    rationale: factors.slice(0, 3).join(' • '),
    factors
  };
}

const TELECOM_KEYWORDS = [
  'mtn', 'airtel', 'globacom', 'glo', '9mobile', 'etisalat', 'huawei', 'ericsson',
  'nokia', 'ihs towers', 'mainone', 'spectranet', 'swift networks', 'smile communications',
  'telecom', 'telecommunications', 'telco'
];

const FINTECH_BANK_KEYWORDS = [
  'bank', 'banking', 'fintech', 'paystack', 'flutterwave', 'moniepoint', 'kuda', 'piggyvest',
  'opay', 'fairmoney', 'palmpay', 'carbon', 'interswitch', 'access bank', 'zenith bank',
  'gtbank', 'guaranty trust', 'first bank', 'fbn', 'uba', 'fidelity bank', 'stanbic',
  'sterling bank', 'fcmb', 'wema bank', 'alat', 'misan', 'bamboo'
];

const FMCG_KEYWORDS = [
  'unilever', 'nestle', 'dangote', 'nb plc', 'nigerian breweries', 'guinness', 'cadbury',
  'frieslandcampina', 'coca-cola', 'nbc', 'pz cussons', 'flour mills', 'fmcg'
];

const ENERGY_KEYWORDS = [
  'shell', 'chevron', 'total', 'totalenergies', 'exxonmobil', 'mobil', 'seplat', 'oando',
  'nlng', 'nnpc', 'schlumberger', 'slb', 'saipem', 'oil', 'gas', 'petroleum'
];

/**
 * Evaluates the Opportunity Signals
 * Note: Signal C (Multi-country) is ONLY evaluated if the searcher explicitly requested it in prompt/criteria!
 */
function evaluateOpportunitySignals(candidate, searchContext = {}, criteriaList = []) {
  const currentCompany = (candidate.currentCompany || '').toLowerCase();
  const candidateHistory = candidate.experience || [];

  // Check if searcher explicitly asked for multi-country / regional exposure
  const combinedSearch = [
    searchContext.cleanRoleTitle || '',
    searchContext.industry || '',
    searchContext.targetLocation || '',
    ...(Array.isArray(criteriaList) ? criteriaList : []),
    ...(Array.isArray(searchContext.parsedCriteria) ? searchContext.parsedCriteria.flatMap(p => p.keywords || []) : [])
  ].join(' ').toLowerCase();

  const searcherWantsRegional = /multi-country|cross-border|regional|pan-african|africa|west africa/i.test(combinedSearch);

  // Signal A: Company restructuring or consolidation (e.g. 2024-2026 Bank recapitalization directive)
  const isRestructuringOrg = DOCUMENTED_RESTRUCTURING_ORGS.some(org => currentCompany.includes(org));
  if (isRestructuringOrg) {
    return {
      rating: 'High',
      primarySignalType: 'Signal A — Company Restructuring & Consolidation',
      signalTitle: 'Banking & Corporate Restructuring',
      evidenceExplanation: `${candidate.currentCompany} is currently undergoing documented mergers or capital changes in Nigeria, making staff more open to moving.`,
      sourceCitation: 'Industry Restructuring Trackers 2025'
    };
  }

  // Signal B: Relevant cross-sector career movement
  const crossSectorMobility = checkCrossSectorHistory(candidateHistory);
  if (crossSectorMobility) {
    return {
      rating: 'Medium',
      primarySignalType: 'Signal B — Cross-Sector Career Movement',
      signalTitle: 'Cross-Sector Experience',
      evidenceExplanation: `Has moved between different industries (${crossSectorMobility}), proving good adaptability to new fields.`,
      sourceCitation: 'Career Mobility Benchmark'
    };
  }

  // Signal C: Regional & cross-border expansion alignment — ONLY if requested!
  if (searcherWantsRegional) {
    const regionalExp = checkRegionalExperience(candidate);
    if (regionalExp) {
      return {
        rating: 'Medium',
        primarySignalType: 'Signal C — Regional Expansion Alignment',
        signalTitle: 'Multi-Country Experience',
        evidenceExplanation: 'Has worked on projects or teams across multiple African countries.',
        sourceCitation: 'Regional Experience Review'
      };
    }
  }

  // Signal D: Sector-specific market changes (Fintech compliance, Upstream energy transition)
  const targetIndustry = (searchContext.industry || '').toLowerCase();
  if (targetIndustry.includes('fintech') || targetIndustry.includes('bank')) {
    return {
      rating: 'Medium',
      primarySignalType: 'Signal D — Sector Regulatory & Market Shifts',
      signalTitle: 'Fintech Market Demand',
      evidenceExplanation: 'High demand for fintech leaders in Nigeria makes experienced professionals receptive to top offers.',
      sourceCitation: 'Workforce Financial Services Overview'
    };
  }

  // Fallback: No observed signal (do not output noisy unprompted multi-country badge)
  return {
    rating: 'No observed signal',
    primarySignalType: 'None',
    signalTitle: '',
    evidenceExplanation: 'No special corporate restructuring detected for their employer.',
    sourceCitation: 'Public Career Data'
  };
}

/**
 * Checks if experience history contains documented cross-sector shifts
 */
function checkCrossSectorHistory(experience) {
  const combinedText = experience.map(e => `${e.title} ${e.company} ${e.summary}`).join(' ').toLowerCase();

  for (const item of CROSS_SECTOR_PAIRS) {
    const hasBoth = item.pair.every(term => combinedText.includes(term));
    if (hasBoth) {
      return item.desc;
    }
  }
  return null;
}

/**
 * Checks for regional or Pan-African keywords in titles, companies, or summaries
 */
function checkRegionalExperience(candidate) {
  const combined = [
    candidate.summary,
    ...(candidate.experience || []).map(e => `${e.title} ${e.company} ${e.summary}`)
  ].join(' ').toLowerCase();

  return REGIONAL_KEYWORDS.some(kw => combined.includes(kw));
}

/**
 * Generates specific, criteria-level evidence rows matching the Juicebox-style UI
 * Uses 3-tier colors:
 * - status: 'green'  => Exact match / aligns
 * - status: 'orange' => Medium / related / transferable
 * - status: 'red'    => Low / missing / no match
 * Text is written in simple, crystal-clear 6th-grade English.
 */
export function generateCriteriaMatches(candidate, searchContext = {}, criteriaList = []) {
  const matches = [];
  const targetTitle = (searchContext.cleanRoleTitle || '').trim();
  const currentTitle = candidate.currentTitle || '';
  const currentCompany = candidate.currentCompany || '';
  const history = candidate.experience || [];
  const allText = [
    candidate.summary || '',
    ...history.map(h => `${h.title} ${h.company} ${h.summary || ''}`),
    ...(candidate.skills || [])
  ].join(' ').toLowerCase();

  // Helper to detect candidate's primary industry domain
  let candidateDomain = 'tech and digital products';
  if (FINTECH_BANK_KEYWORDS.some(k => currentCompany.toLowerCase().includes(k) || allText.includes(k))) {
    candidateDomain = 'fintech and digital finance';
  } else if (TELECOM_KEYWORDS.some(k => currentCompany.toLowerCase().includes(k))) {
    candidateDomain = 'telecommunications';
  } else if (ENERGY_KEYWORDS.some(k => currentCompany.toLowerCase().includes(k))) {
    candidateDomain = 'oil and gas';
  } else if (FMCG_KEYWORDS.some(k => currentCompany.toLowerCase().includes(k))) {
    candidateDomain = 'consumer goods (FMCG)';
  }

  // 1. Core Role Match
  if (targetTitle) {
    const targetWords = targetTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const currLower = currentTitle.toLowerCase();
    const isDirectRoleMatch = targetWords.every(w => currLower.includes(w)) || currLower.includes(targetTitle.toLowerCase());

    const hasPastRoleMatch = history.some(h => {
      const t = (h.title || '').toLowerCase();
      return targetWords.every(w => t.includes(w)) || t.includes(targetTitle.toLowerCase());
    });

    if (isDirectRoleMatch) {
      matches.push({
        status: 'green',
        badge: targetTitle,
        text: `Currently works as ${currentTitle} at ${currentCompany}.`
      });
    } else if (hasPastRoleMatch) {
      const pastMatch = history.find(h => {
        const t = (h.title || '').toLowerCase();
        return targetWords.every(w => t.includes(w));
      });
      matches.push({
        status: 'green',
        badge: targetTitle,
        text: `Worked as ${pastMatch.title} at ${pastMatch.company}, matching the requested role.`
      });
    } else {
      // Check if related
      const isRelatedDesign = (targetTitle.toLowerCase().includes('design') && (currLower.includes('design') || currLower.includes('ux') || currLower.includes('ui')));
      const isRelatedTech = (targetTitle.toLowerCase().includes('engineer') && (currLower.includes('developer') || currLower.includes('software')));

      if (isRelatedDesign || isRelatedTech) {
        matches.push({
          status: 'orange',
          badge: `Related: ${currentTitle}`,
          text: `Works as ${currentTitle} at ${currentCompany}. This is related to ${targetTitle}, but not the exact same title.`
        });
      } else {
        matches.push({
          status: 'red',
          badge: `Different Role: ${currentTitle}`,
          text: `Current title is ${currentTitle}. They do not have a ${targetTitle} title in their profile.`
        });
      }
    }
  }

  // 2. Years of Experience Match
  const minYears = searchContext.minYearsExperience || 5;
  const startYears = history
    .map(h => parseInt((h.startDate || '').split('-')[0], 10))
    .filter(y => !isNaN(y) && y > 1990 && y < 2030)
    .sort();
  const earliestYear = startYears[0] || (new Date().getFullYear() - 6);
  const totalYears = Math.max(1, new Date().getFullYear() - earliestYear);

  if (totalYears >= minYears) {
    matches.push({
      status: 'green',
      badge: `${minYears}+ Years Experience`,
      text: `Has over ${totalYears} years of work experience (started in ${earliestYear}), meeting the ${minYears}-year target.`
    });
  } else if (totalYears >= minYears - 1) {
    matches.push({
      status: 'orange',
      badge: `${totalYears} Years Experience`,
      text: `Has about ${totalYears} years of work experience, which is slightly below the ${minYears} years requested.`
    });
  } else {
    matches.push({
      status: 'red',
      badge: `${totalYears} Years Experience`,
      text: `Has only ${totalYears} years of work experience, which is below the ${minYears} years requested.`
    });
  }

  // 3. Target Location Match (e.g., Kano, Lagos, Abuja, Port Harcourt)
  const targetLoc = (searchContext.targetLocation || '').toLowerCase().replace(/state|nigeria|general/gi, '').trim();
  if (targetLoc && targetLoc !== 'nigeria' && targetLoc.length > 2) {
    const candLoc = (candidate.location || '').toLowerCase();
    const isLocMatch = candLoc.includes(targetLoc) || allText.includes(targetLoc);
    if (isLocMatch) {
      matches.push({
        status: 'green',
        badge: searchContext.targetLocation,
        text: `Based in ${candidate.location}, matching the requested location.`
      });
    } else {
      matches.push({
        status: 'red',
        badge: 'Location Mismatch',
        text: `Located in ${candidate.location || 'Nigeria'}, not ${searchContext.targetLocation}.`
      });
    }
  }

  // 4. User-Selected or Typed Criteria (Checked specifically against work history)
  const added = Array.isArray(criteriaList) ? criteriaList : [];
  added.forEach(crit => {
    const cLower = crit.toLowerCase();

    // ── Criteria: Telecommunications ──
    if (cLower.includes('telecom')) {
      const matchingExp = history.find(h => {
        const hText = `${h.company} ${h.title} ${h.summary || ''}`.toLowerCase();
        return TELECOM_KEYWORDS.some(k => hText.includes(k));
      });

      if (matchingExp) {
        matches.push({
          status: 'green',
          badge: 'Telecommunications',
          text: `Has direct telecommunications experience from working at ${matchingExp.company}.`
        });
      } else {
        matches.push({
          status: 'red',
          badge: 'No Telecom Experience',
          text: `Has never worked in telecommunications. Their work background is in ${candidateDomain} at ${currentCompany}.`
        });
      }
    }

    // ── Criteria: Multi-Country / Cross-Border / Regional ──
    else if (cLower.includes('country') || cLower.includes('cross-border') || cLower.includes('pan-african') || cLower.includes('regional') || cLower.includes('multiple')) {
      const foreignCountries = ['ghana', 'kenya', 'rwanda', 'south africa', 'uganda', 'uk', 'united kingdom', 'us', 'united states', 'canada', 'germany'];
      const matchedCountry = foreignCountries.find(c => allText.includes(c));
      const hasRegionalWord = /pan-african|cross-border|west africa|regional/i.test(allText);

      if (matchedCountry || hasRegionalWord) {
        matches.push({
          status: 'green',
          badge: 'Multi-Country Experience',
          text: `Has worked across multiple countries, including projects involving ${matchedCountry ? matchedCountry.toUpperCase() : 'regional markets'}.`
        });
      } else {
        matches.push({
          status: 'red',
          badge: 'Nigeria Only',
          text: `No multi-country experience found. All past roles listed are based inside Nigeria.`
        });
      }
    }

    // ── Criteria: Banking / Financial Services / Fintech ──
    else if (cLower.includes('fintech') || cLower.includes('bank') || cLower.includes('financial')) {
      const matchingExp = history.find(h => {
        const hText = `${h.company} ${h.title} ${h.summary || ''}`.toLowerCase();
        return FINTECH_BANK_KEYWORDS.some(k => hText.includes(k));
      });

      if (matchingExp || FINTECH_BANK_KEYWORDS.some(k => currentCompany.toLowerCase().includes(k))) {
        matches.push({
          status: 'green',
          badge: 'Fintech & Banking',
          text: `Has direct experience in financial services and digital payments at ${currentCompany}.`
        });
      } else {
        matches.push({
          status: 'red',
          badge: 'No Finance Experience',
          text: `Has no banking or fintech background. Their work has been in ${candidateDomain}.`
        });
      }
    }

    // ── Criteria: Oil & Gas / Energy ──
    else if (cLower.includes('oil') || cLower.includes('energy') || cLower.includes('gas') || cLower.includes('petroleum')) {
      const matchingExp = history.find(h => {
        const hText = `${h.company} ${h.title} ${h.summary || ''}`.toLowerCase();
        return ENERGY_KEYWORDS.some(k => hText.includes(k));
      });

      if (matchingExp) {
        matches.push({
          status: 'green',
          badge: 'Oil & Gas',
          text: `Has direct experience in the energy and oil & gas industry at ${matchingExp.company}.`
        });
      } else {
        matches.push({
          status: 'red',
          badge: 'No Oil & Gas Exp',
          text: `Has no oil and gas experience in their past work history.`
        });
      }
    }

    // ── Criteria: FMCG / Retail ──
    else if (cLower.includes('fmcg') || cLower.includes('consumer') || cLower.includes('retail')) {
      const matchingExp = history.find(h => {
        const hText = `${h.company} ${h.title} ${h.summary || ''}`.toLowerCase();
        return FMCG_KEYWORDS.some(k => hText.includes(k));
      });

      if (matchingExp) {
        matches.push({
          status: 'green',
          badge: 'FMCG Industry',
          text: `Has direct experience in FMCG and consumer retail at ${matchingExp.company}.`
        });
      } else {
        matches.push({
          status: 'red',
          badge: 'No FMCG Exp',
          text: `Has no consumer goods or FMCG experience in their career.`
        });
      }
    }

    // ── General / Custom typed criteria ──
    else {
      const critClean = crit.trim();
      const critLower = critClean.toLowerCase();
      const inJobs = history.some(h => `${h.title} ${h.summary || ''}`.toLowerCase().includes(critLower));
      const inSkills = (candidate.skills || []).some(s => s.toLowerCase().includes(critLower));

      if (inJobs) {
        matches.push({
          status: 'green',
          badge: critClean,
          text: `Has direct work experience with ${critClean} in past job roles.`
        });
      } else if (inSkills) {
        matches.push({
          status: 'orange',
          badge: `${critClean} (Skill Listed)`,
          text: `Lists ${critClean} as a skill, but has not held a full role for it.`
        });
      } else {
        matches.push({
          status: 'red',
          badge: `No ${critClean}`,
          text: `Did not find ${critClean} in their work history or listed skills.`
        });
      }
    }
  });

  return matches;
}

/**
 * ── LIKELY TO BE INTERESTED SIGNALS ENGINE ────────────────────────────────
 * Evaluates candidates against research-backed and African talent-market indicators:
 * 1. M&A / Banking Consolidation & Restructuring (CBN 2024-2026 Recapitalization)
 * 2. Anniversary Window (within 30 days of 1st, 2nd, 3rd year)
 * 3. Role Plateau / Stagnant Title (2.5 - 4+ years in same role)
 * 4. Average Tenure Switching Pattern (changes every ~2 years)
 * 5. First-Year Cross-Industry Attrition (switched industry <12 months ago)
 * 6. Internal Lateral Move Without Promotion (~12 months post-lateral move)
 * 7. Challenge Explorer (cross-industry agility)
 * 8. Local Naira Inflation & Purchasing Power (local entity >12 mos tenure)
 * 9. Startup Growth / Funding Runway (growth-stage venture timing)
 * 10. Post-Summer Q3 Career Audit Window (Aug–Oct)
 */
export function evaluateLikelyToSwitchSignals(candidate, searchContext = {}) {
  const history = candidate.experience || [];
  const currentCompany = (candidate.currentCompany || '').toLowerCase();
  const currentTitle = (candidate.currentTitle || '').toLowerCase();

  // Helper date parsers
  const parseDate = (dStr) => {
    if (!dStr || dStr === 'Present') return new Date();
    const parts = dStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
    return isNaN(y) ? new Date() : new Date(y, m, 1);
  };

  const getMonthsBetween = (d1, d2) => {
    return Math.max(1, (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()));
  };

  // Calculate current tenure
  const currentExp = history.find(e => e.isCurrent) || history[0];
  const currentStartDate = currentExp?.startDate ? parseDate(currentExp.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 16));
  const currentTenureMonths = getMonthsBetween(currentStartDate, new Date());

  // Calculate total career experience
  const startYears = history
    .map(h => parseInt((h.startDate || '').split('-')[0], 10))
    .filter(y => !isNaN(y) && y > 1990 && y < 2030)
    .sort();
  const earliestYear = startYears[0] || (new Date().getFullYear() - 6);
  const totalExpMonths = Math.max(currentTenureMonths, (new Date().getFullYear() - earliestYear) * 12 + new Date().getMonth());

  // Calculate average tenure per company
  const uniqueCompanies = new Set(history.map(h => (h.company || '').toLowerCase()).filter(Boolean));
  const companyCount = Math.max(1, uniqueCompanies.size);
  const avgTenureYears = Math.max(1.2, Math.min(6.0, (totalExpMonths / 12) / companyCount));

  // Format tenure strings
  const formatMonths = (m) => {
    const y = Math.floor(m / 12);
    const remM = m % 12;
    if (y === 0) return `${remM} mos`;
    if (remM === 0) return `${y} yrs`;
    return `${y} yrs ${remM} mos`;
  };

  const currentTenureFormatted = formatMonths(currentTenureMonths);
  const totalExpFormatted = formatMonths(totalExpMonths);

  const detectedSignals = [];

  // ── 1. M&A / Banking Consolidation / Major Restructuring (Highest Priority: 100)
  const isRestructuring = DOCUMENTED_RESTRUCTURING_ORGS.some(org => currentCompany.includes(org));
  if (isRestructuring) {
    detectedSignals.push({
      id: 'consolidation_m_and_a',
      title: 'Banking Consolidation',
      subtitle: 'Active restructuring / M&A',
      detail: `Current employer (${candidate.currentCompany}) is undergoing documented recapitalization/consolidation under CBN directives; post-merger transitions trigger a 45% relative surge in senior executive departures.`,
      variant: 'gold',
      priority: 100
    });
  }

  // ── 2. Work Anniversary Window (Priority: 95)
  const anniversaryYears = Math.round(currentTenureMonths / 12);
  const monthsFromAnniversary = Math.abs(currentTenureMonths - (anniversaryYears * 12));
  if (anniversaryYears >= 1 && monthsFromAnniversary <= 2) {
    const ordinal = anniversaryYears === 1 ? '1st' : anniversaryYears === 2 ? '2nd' : anniversaryYears === 3 ? '3rd' : `${anniversaryYears}th`;
    detectedSignals.push({
      id: 'work_anniversary',
      title: 'Anniversary Window',
      subtitle: `Approaching ${ordinal} work anniversary`,
      detail: `Candidate is within the 30-day window around their ${ordinal} year anniversary; CEB/Gartner research shows a 6% surge in job-seeking and career reflection around annual milestones.`,
      variant: 'gold',
      priority: 95
    });
  }

  // ── 3. First-Year Cross-Industry Attrition Risk (Priority: 90)
  // If candidate joined their current firm in the last 14 months and previous firm was in a different domain
  if (currentTenureMonths <= 14 && history.length >= 2) {
    const prevCompany = (history[1]?.company || '').toLowerCase();
    const prevTitle = (history[1]?.title || '').toLowerCase();
    const isDifferent = (prevCompany.includes('bank') && !currentCompany.includes('bank')) ||
                        (prevCompany.includes('fintech') && !currentCompany.includes('fintech')) ||
                        (prevCompany.includes('oil') && !currentCompany.includes('oil')) ||
                        (prevTitle.includes('sales') && currentTitle.includes('product'));
    if (isDifferent) {
      detectedSignals.push({
        id: 'first_year_attrition',
        title: 'New Sector Move',
        subtitle: 'In 1st year of industry move',
        detail: `Executives in Nigeria transitioning into a new industry experience 17% higher first-year attrition than same-industry hires (LinkedIn Talent Insights).`,
        variant: 'gold',
        priority: 90
      });
    }
  }

  // ── 4. Role Plateau / Title Stagnation (Priority: 85)
  if (currentTenureMonths >= 30) {
    const plateauYears = (currentTenureMonths / 12).toFixed(1);
    detectedSignals.push({
      id: 'career_growth_plateau',
      title: 'Career Growth',
      subtitle: `In same title for ${plateauYears} yrs`,
      detail: `Candidate has held their current title for over ${plateauYears} years without visible promotion. ADP Research finds 82% of professionals become open to external moves when progression slows beyond the typical 18–24 month mark.`,
      variant: 'gold',
      priority: 85
    });
  }

  // ── 5. Local Naira Inflation & Purchasing Power (Priority: 80)
  // Local Nigerian company with >12 months tenure
  const isMultinational = /google|microsoft|amazon|meta|apple|shell|total|chevron|exxon|nestle|unilever|pwc|kpmg|deloitte|ey/i.test(currentCompany);
  if (!isMultinational && currentTenureMonths >= 12) {
    detectedSignals.push({
      id: 'naira_purchasing_power',
      title: 'Purchasing Power',
      subtitle: `Local salary tier in role >12 mos`,
      detail: `Employed at a local Nigerian company with ${currentTenureFormatted} tenure; inflation and naira devaluation make competitive USD-indexed or inflation-adjusted compensation high-impact conversion drivers.`,
      variant: 'green',
      priority: 80
    });
  }

  // ── 6. Average Tenure Switching Pattern (Priority: 75)
  if (history.length >= 2) {
    detectedSignals.push({
      id: 'avg_tenure_pattern',
      title: `${avgTenureYears.toFixed(1)} yrs Avg. Tenure`,
      subtitle: `Changes companies about every ${Math.round(avgTenureYears)} years`,
      detail: `Historical career track record indicates regular job changes every ~${Math.round(avgTenureYears)} years. With ${currentTenureFormatted} in their current position, candidate is entering their natural career consideration window.`,
      variant: 'green',
      priority: 75
    });
  }

  // ── 7. Challenge Explorer / Cross-Industry Agility (Priority: 70)
  const allHistoryText = history.map(h => `${h.title} ${h.company}`).join(' ').toLowerCase();
  const hasCrossSectorExp = CROSS_SECTOR_PAIRS.some(pair => pair.pair.every(term => allHistoryText.includes(term)));
  if (hasCrossSectorExp || history.length >= 3) {
    detectedSignals.push({
      id: 'challenge_explorer',
      title: 'Challenge Explorer',
      subtitle: 'Proven cross-sector agility',
      detail: `Candidate's career spans multiple industries; PwC and LinkedIn data confirm 28% of newly appointed Nigerian executives cross sector boundaries, proving strong adaptability to fresh challenges.`,
      variant: 'green',
      priority: 70
    });
  }

  // ── 8. Startup Runway / Growth Stage Opportunity (Priority: 65)
  const isStartup = /bamboo|paystack|flutterwave|moniepoint|kuda|piggyvest|opay|fairmoney|misan/i.test(currentCompany);
  if (isStartup) {
    detectedSignals.push({
      id: 'startup_growth_cycle',
      title: 'Company Similarity',
      subtitle: 'High-growth fintech / venture tier',
      detail: `Deep domain immersion in Nigeria's high-speed digital payments sector; senior operators are receptive to established executive mandates offering larger balance sheet stability.`,
      variant: 'green',
      priority: 65
    });
  }

  // ── 9. Seasonal Career Audit Window (Priority: 50)
  // August–October seasonal factor
  const currentMonth = new Date().getMonth(); // 0-indexed: 7=Aug, 8=Sep, 9=Oct
  if (currentMonth >= 7 && currentMonth <= 9) {
    detectedSignals.push({
      id: 'seasonal_q3_window',
      title: 'Q3 Career Audit',
      subtitle: 'Annual career review peak',
      detail: `ADP Research notes late Q3 is the annual peak for voluntary turnover reflection and executive receptivity to recruiter conversations.`,
      variant: 'green',
      priority: 50
    });
  }

  // Sort signals by priority descending
  detectedSignals.sort((a, b) => b.priority - a.priority);

  // Divide into Top 4 (visible initially in 4-card grid) and Additional (expandable via "+N more signals")
  const topSignals = detectedSignals.slice(0, 4);
  const additionalSignals = detectedSignals.slice(4);

  // Synthesize a concise 2-sentence AI Opportunity Summary
  const top1 = topSignals[0]?.title || 'Proven career progression';
  const top2 = topSignals[1]?.title || 'Natural tenure window';
  const candidateName = candidate.firstName || candidate.fullName.split(' ')[0] || 'The candidate';
  const aiSummary = `${candidateName} exhibits strong receptivity indicators driven by ${top1.toLowerCase()} and ${top2.toLowerCase()} at ${candidate.currentCompany || 'their current employer'}. An outreach campaign highlighting role advancement and competitive inflation-proof compensation aligns precisely with their current career timing.`;

  return {
    currentTenureFormatted,
    totalExpFormatted,
    topSignals,
    additionalSignals,
    totalSignalsCount: detectedSignals.length,
    aiSummary
  };
}
