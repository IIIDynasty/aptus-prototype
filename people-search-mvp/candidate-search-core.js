import './style.css';

// Tech & Engineering keywords for sorting skills by role relevance
const TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'golang', 'rust',
  'swift', 'kotlin', 'sql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'redis', 'html', 'css', 'html5',
  'react', 'react native', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
  'codeigniter', 'api development', 'rest apis', 'graphql', 'back end web development', 'front end development',
  'web development', 'full stack', 'mobile development', 'android', 'ios', 'flutter', 'cloud', 'aws',
  'azure', 'google cloud platform', 'docker', 'kubernetes', 'devops', 'ci/cd', 'git', 'github', 'gitlab',
  'agile', 'scrum', 'software engineering', 'computer science', 'data structures', 'algorithms',
  'microservices', 'object-oriented programming', 'linux', 'unix', 'bash'
];

// Helper to sort candidate skills putting role-relevant & software engineering skills FIRST
const sortSkillsByRelevance = (skills, role) => {
  if (!skills || !Array.isArray(skills)) return ['Software Engineering'];
  const roleTerms = role ? role.toLowerCase().split(/\s+/).filter(w => w.length > 2) : [];

  return [...skills].sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    let aScore = 0;
    let bScore = 0;

    // High priority for tech keywords
    TECH_KEYWORDS.forEach(kw => {
      if (aLower.includes(kw)) aScore += 10;
      if (bLower.includes(kw)) bScore += 10;
    });

    // High priority for searched role terms
    roleTerms.forEach(term => {
      if (aLower.includes(term)) aScore += 20;
      if (bLower.includes(term)) bScore += 20;
    });

    // De-prioritize non-dev design/media skills (e.g. photoshop, premiere, after effects)
    if (/photoshop|premiere|after effects|video editing|graphic design|motion graphics/i.test(aLower)) aScore -= 20;
    if (/photoshop|premiere|after effects|video editing|graphic design|motion graphics/i.test(bLower)) bScore -= 20;

    return bScore - aScore;
  });
};

// Capitalization helper
const capitalizeWords = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

// Helper to format clean location string prioritizing company location and searched city over plain 'Nigeria'
const formatLocation = (profile, searchedLocation) => {
  // 1. Check job_company_location_name if valid string with city
  if (typeof profile.job_company_location_name === 'string' && profile.job_company_location_name && profile.job_company_location_name.toLowerCase() !== 'nigeria') {
    return capitalizeWords(profile.job_company_location_name);
  }

  // 2. Check profile locality/region
  const parts = [];
  if (typeof profile.location_locality === 'string' && profile.location_locality && profile.location_locality !== 'true') {
    parts.push(profile.location_locality);
  }
  if (typeof profile.location_region === 'string' && profile.location_region && profile.location_region !== 'true') {
    parts.push(profile.location_region);
  }
  if (typeof profile.location_country === 'string' && profile.location_country && profile.location_country !== 'true') {
    parts.push(profile.location_country);
  }
  if (parts.length > 0 && parts.join(', ').toLowerCase() !== 'nigeria') {
    return capitalizeWords(parts.join(', '));
  }

  if (typeof profile.location_name === 'string' && profile.location_name && profile.location_name !== 'true' && profile.location_name.toLowerCase() !== 'nigeria') {
    return capitalizeWords(profile.location_name);
  }

  // 3. Fallback: If user searched for a location (e.g. "abuja"), format as "Abuja, Nigeria"
  if (searchedLocation && typeof searchedLocation === 'string') {
    const cleanSearchLoc = searchedLocation.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (cleanSearchLoc && cleanSearchLoc.toLowerCase() !== 'nigeria') {
      return `${capitalizeWords(cleanSearchLoc)}, Nigeria`;
    }
  }

  return 'Nigeria';
};

// Helper to calculate total career experience from positions array
const calculateExperienceYears = (experienceArray) => {
  if (!experienceArray || experienceArray.length === 0) return null;
  const intervals = [];
  experienceArray.forEach(exp => {
    if (!exp.start_date) return;
    const start = new Date(exp.start_date + '-01');
    const end = exp.end_date ? new Date(exp.end_date + '-01') : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    intervals.push({ start, end });
  });

  if (intervals.length === 0) return null;
  intervals.sort((a, b) => a.start - b.start);

  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];
    if (current.start <= lastMerged.end) {
      if (current.end > lastMerged.end) lastMerged.end = current.end;
    } else {
      merged.push(current);
    }
  }

  let totalMs = 0;
  merged.forEach(interval => { totalMs += (interval.end - interval.start); });
  const years = totalMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(years * 10) / 10;
};

// Helper to calculate experience specifically matching the target role keywords
const calculateRoleExperience = (experienceArray, targetRole) => {
  if (!experienceArray || experienceArray.length === 0 || !targetRole) return null;
  const roleTerms = targetRole.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (roleTerms.length === 0) return null;

  const matchingPositions = experienceArray.filter(exp => {
    const title = (exp.title?.name || '').toLowerCase();
    return roleTerms.some(term => title.includes(term));
  });

  if (matchingPositions.length === 0) return null;
  return calculateExperienceYears(matchingPositions);
};

// Enhanced NLP Parser with strict experience bounding
const parseQuery = (query) => {
  const result = {
    role: null,
    location: null,
    minExperience: 0,
    maxExperience: 0
  };

  const lowerQuery = query.toLowerCase().trim();

  // Check if user specified "more than X years" or "X+ years" vs exact "X years"
  const isPlus = /more\s+than|\+|\bat\s+least/.test(lowerQuery);
  const expMatch = lowerQuery.match(/(\d+)\+?\s*years?/);

  if (expMatch) {
    const baseYears = parseInt(expMatch[1], 10);
    result.minExperience = baseYears;
    if (isPlus) {
      // "more than 2 years" -> min:2, max:4 (bounded pool)
      result.maxExperience = baseYears + 2;
    } else {
      // exact "2 years of experience" -> min:2, max:3 (strict target pool)
      result.maxExperience = baseYears + 1;
    }
  }

  // Extract Location (e.g., "in Abuja", "in Lagos State")
  const locMatch = lowerQuery.match(/\bin\s+([a-zA-Z\s]+)/);
  if (locMatch) {
    let rawLoc = locMatch[1];
    rawLoc = rawLoc.replace(/\b(with|having|who|that|for|years?|exp|experience|of)\b.*$/i, '').trim();
    if (rawLoc) {
      result.location = rawLoc;
    }
  }

  // Extract Role
  let roleText = lowerQuery;
  if (result.location) {
    roleText = roleText.replace(new RegExp(`\\bin\\s+${result.location}.*`, 'i'), '');
  }
  roleText = roleText.replace(/\d+\+?\s*years?.*/i, '');
  roleText = roleText.replace(/\b(with|in|having|for|more than)\s*$/i, '');
  
  result.role = roleText.trim() || query;

  return result;
};

const renderCandidates = (candidates, parsed, fallbackNotice = null) => {
  const grid = document.getElementById('results-grid');
  const meta = document.getElementById('results-meta');
  
  if (candidates.length === 0) {
    meta.textContent = "No candidates found matching your criteria.";
    grid.innerHTML = '';
    return;
  }

  meta.innerHTML = `Found <span class="accent">${candidates.length}</span> targeted candidate match (1 Credit Max per search).`;

  // Determine experience match badge for each card
  const getExpBadge = (c) => {
    if (!parsed.minExperience) return '';
    const rawExp = c.rawExperience;
    const isExact = rawExp !== null && rawExp >= parsed.minExperience && rawExp <= (parsed.maxExperience || parsed.minExperience + 1);
    if (isExact) {
      return `<span class="exp-badge exp-badge--exact" title="Matches requested experience range">✓ Exact Match</span>`;
    }
    return `<span class="exp-badge exp-badge--broad" title="No exact match found – showing closest available">~ Best Available</span>`;
  };

  grid.innerHTML = candidates.map(c => `
    <div class="candidate-card">
      <div class="card-header">
        <div class="header-top">
          <h3 class="candidate-name">${c.name}</h3>
          ${getExpBadge(c)}
        </div>
        <span class="candidate-role">${c.role}</span>
      </div>
      
      <div class="card-body">
        <div class="data-row">
          <span class="data-label">Experience in Role</span>
          <span class="data-value">${c.experience}</span>
        </div>
        
        <div class="data-row">
          <span class="data-label">Location</span>
          <span class="data-value">${c.location}</span>
        </div>

        <div class="data-row">
          <span class="data-label">Current Company</span>
          <span class="data-value">${c.currentCompany}</span>
        </div>
        
        <div class="data-row">
          <span class="data-label">Past & Recent Work History</span>
          <span class="data-value">${c.pastCompanies.length > 0 ? c.pastCompanies.join(', ') : 'None listed'}</span>
        </div>

        <div class="data-row">
          <span class="data-label">Skills (${c.totalSkillsCount} total in profile)</span>
          <div class="skills-container">
            ${c.displaySkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            ${c.extraSkillsCount > 0 ? `<span class="skill-tag skill-more">+${c.extraSkillsCount} more</span>` : ''}
          </div>
        </div>
      </div>

      <div class="card-footer">
        <a href="${c.linkedin}" target="_blank" class="link-linkedin">LinkedIn Profile</a>
        <button class="btn-reveal" disabled title="Apollo integration pending">Reveal Email</button>
      </div>
    </div>
  `).join('');

  // Show fallback notice below card if needed
  if (fallbackNotice) {
    const notice = document.createElement('div');
    notice.className = 'fallback-notice';
    notice.innerHTML = `<span>ℹ️ ${fallbackNotice}</span>`;
    grid.appendChild(notice);
  }
};

const handleSearch = async () => {
  const query = document.getElementById('search-input').value.trim();
  if (!query) return;

  const grid = document.getElementById('results-grid');
  const meta = document.getElementById('results-meta');
  
  meta.textContent = "Searching database...";
  grid.innerHTML = '<div class="loading-spinner">Searching...</div>';

  try {
    const parsed = parseQuery(query);
    console.log("[Search Log] Raw Input:", query);
    console.log("[Search Log] Parsed Criteria:", parsed);
    
    const response = await fetch('/api/people-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parsed)
    });

    const json = await response.json();
    console.log("[Search Log] API Response:", json);
    if (json.debug?.executedSql) {
      console.log("[Search Log] Executed PDL SQL:", json.debug.executedSql);
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${json.details?.message || json.error || 'Request failed'}`);
    }

    if (json.data && json.data.length > 0) {
      const formattedResults = json.data.map(profile => {
        // Total career experience
        let totalExpVal = profile.inferred_years_experience;
        if (!totalExpVal || typeof totalExpVal !== 'number') {
          totalExpVal = calculateExperienceYears(profile.experience);
        }

        // Role-specific experience
        const roleExpVal = calculateRoleExperience(profile.experience, parsed.role || profile.job_title);

        let expDisplay = '';
        if (roleExpVal && roleExpVal > 0) {
          expDisplay = `${roleExpVal} years in role (${totalExpVal || 'N/A'} yrs total career)`;
        } else if (totalExpVal) {
          expDisplay = `${totalExpVal} years`;
        } else {
          expDisplay = `${parsed.minExperience || 2} years`;
        }

        // Clean Location formatting
        const locDisplay = formatLocation(profile, parsed.location);

        // Sort skills putting dev/engineering skills FIRST
        const sortedSkills = sortSkillsByRelevance(profile.skills, parsed.role || profile.job_title);
        const displaySkills = sortedSkills.slice(0, 8);
        const extraSkillsCount = Math.max(0, sortedSkills.length - displaySkills.length);

        // Companies mapping
        const currentCompany = capitalizeWords(profile.job_company_name) || 'N/A';
        const rawCompanies = (profile.experience && profile.experience.length > 0)
          ? profile.experience.map(e => e.company?.name).filter(Boolean)
          : [];
        const pastCompanies = [...new Set(rawCompanies)]
          .filter(cName => cName.toLowerCase() !== currentCompany.toLowerCase())
          .map(capitalizeWords)
          .slice(0, 4);

        return {
          id: profile.id,
          name: capitalizeWords(profile.full_name) || 'N/A',
          role: capitalizeWords(profile.job_title) || 'Software Developer',
          experience: expDisplay,
          rawExperience: totalExpVal, // raw number for badge comparison
          location: locDisplay,
          currentCompany: currentCompany,
          pastCompanies: pastCompanies,
          displaySkills: displaySkills,
          extraSkillsCount: extraSkillsCount,
          totalSkillsCount: sortedSkills.length,
          linkedin: (profile.profiles && profile.profiles.find(p => p.network === 'linkedin')) 
                    ? profile.profiles.find(p => p.network === 'linkedin').url 
                    : (profile.linkedin_url ? `https://${profile.linkedin_url}` : '#')
        };
      });
      renderCandidates(formattedResults, parsed, json.notice);
    } else {
      meta.textContent = json.notice || "No candidates found matching exact criteria.";
      grid.innerHTML = `<div style="padding: 20px; color: #666; font-size: 14px;">No candidates matched your exact query filters. Try searching for broader terms like "software developer" or "mobile engineer".</div>`;
    }
  } catch (error) {
    meta.textContent = "Error occurred while searching.";
    grid.innerHTML = `<div style="color:red; font-weight: bold; padding: 10px;">${error.message}</div>`;
    console.error("[Search Error]", error);
  }
};

document.getElementById('search-btn').addEventListener('click', handleSearch);
document.getElementById('search-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});
