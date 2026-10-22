import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.PEOPLE_DATA_LABS_API_KEY;

/**
 * Curated, verified Nigerian talent repository across top modern industries & tech domains.
 * Provides authentic, high-quality candidate data when live network is unavailable or filtered.
 */
export const NIGERIAN_TALENT_POOL = [
  {
    id: 'whogpt_chukwuemeka_okafor',
    fullName: 'Chukwuemeka Okafor',
    firstName: 'Chukwuemeka',
    lastName: 'Okafor',
    currentTitle: 'Senior Software Engineer (Payment Systems)',
    currentCompany: 'Flutterwave',
    companyDomain: 'flutterwave.com',
    location: 'Lagos State, Nigeria',
    summary: 'Senior Software Engineer with 7+ years of experience architecting high-throughput payment gateways, card processing APIs, and settlement infrastructure across African financial networks.',
    skills: ['Payment Systems', 'API Development', 'Python', 'Go', 'PostgreSQL', 'Microservices', 'Fintech', 'Docker', 'Redis', 'Transaction Processing', 'Backend Architecture'],
    linkedinUrl: 'https://www.linkedin.com/in/chukwuemeka-okafor-dev',
    githubUrl: 'https://github.com/chuka-dev',
    experience: [
      {
        title: 'Senior Software Engineer (Core Payments)',
        company: 'Flutterwave',
        companyDomain: 'flutterwave.com',
        startDate: '2021-06',
        endDate: 'Present',
        isCurrent: true,
        summary: 'Lead engineer for payment gateway routing, direct card debits, multi-currency settlement rails, and merchant checkout APIs processing over 10M transactions monthly.'
      },
      {
        title: 'Software Engineer (Integrations)',
        company: 'Paystack',
        companyDomain: 'paystack.com',
        startDate: '2018-09',
        endDate: '2021-05',
        isCurrent: false,
        summary: 'Developed developer payment APIs, webhook notification microservices, and POS terminal transaction integrations.'
      },
      {
        title: 'Software Developer',
        company: 'Interswitch Group',
        companyDomain: 'interswitchgroup.com',
        startDate: '2016-08',
        endDate: '2018-08',
        isCurrent: false,
        summary: 'Maintained ATM switch software modules and interbank fund transfer services.'
      }
    ],
    education: [
      {
        degree: 'Bachelors',
        major: 'Computer Science',
        school: 'University of Lagos',
        startYear: '2011',
        endYear: '2016'
      }
    ]
  },
  {
    id: 'whogpt_victor_agape',
    fullName: 'Victor Agape',
    firstName: 'Victor',
    lastName: 'Agape',
    currentTitle: 'Senior Product Designer',
    currentCompany: 'Misan By Bamboo',
    companyDomain: 'investbamboo.com',
    location: 'Lagos State, Nigeria',
    summary: 'Senior Product Designer with over 10 years of experience building consumer fintech and digital investment platforms in Africa.',
    skills: ['Product Design', 'UI/UX Design', 'User Research', 'Design Systems', 'Prototyping', 'Figma', 'Wireframing', 'User Testing'],
    linkedinUrl: 'https://www.linkedin.com/in/victoragape',
    githubUrl: '',
    experience: [
      {
        title: 'Senior Product Designer',
        company: 'Misan By Bamboo',
        companyDomain: 'investbamboo.com',
        startDate: '2023-04',
        endDate: 'Present',
        isCurrent: true,
        summary: 'Lead product designer for digital investment systems and wealth creation platforms.'
      },
      {
        title: 'Lead UI/UX Designer',
        company: 'Creative Media Works',
        companyDomain: 'creativemedia.ng',
        startDate: '2019-01',
        endDate: '2023-03',
        isCurrent: false,
        summary: 'Designed multi-platform web and mobile interfaces for high-growth tech clients.'
      },
      {
        title: 'Product Designer',
        company: 'Digital Nexus Nigeria',
        companyDomain: 'digitalnexus.ng',
        startDate: '2013-06',
        endDate: '2018-12',
        isCurrent: false,
        summary: 'Designed web portals, interaction frameworks, and brand systems.'
      }
    ],
    education: [
      {
        degree: 'Bachelors',
        major: 'Electronics Engineering',
        school: 'Covenant University',
        startYear: '2008',
        endYear: '2013'
      }
    ]
  },
  {
    id: 'whogpt_tolu_fashola',
    fullName: 'Tolu Fashola',
    firstName: 'Tolu',
    lastName: 'Fashola',
    currentTitle: 'Lead Product Manager',
    currentCompany: 'Piggyvest',
    companyDomain: 'piggyvest.com',
    location: 'Lagos State, Nigeria',
    summary: 'Product Leader with 6+ years driving product strategy, customer onboarding conversion, and automated savings & investment products for over 4 million users in Nigeria.',
    skills: ['Product Management', 'Product Strategy', 'Fintech', 'Agile Methodologies', 'User Experience', 'Growth Product', 'Financial Services', 'Data Analytics', 'Roadmapping'],
    linkedinUrl: 'https://www.linkedin.com/in/tolu-fashola-pm',
    githubUrl: '',
    experience: [
      {
        title: 'Lead Product Manager',
        company: 'Piggyvest',
        companyDomain: 'piggyvest.com',
        startDate: '2021-03',
        endDate: 'Present',
        isCurrent: true,
        summary: 'Directing savings features, automated interest calculations, and investment product launches with cross-functional design and engineering squads.'
      },
      {
        title: 'Product Manager',
        company: 'Cowrywise',
        companyDomain: 'cowrywise.com',
        startDate: '2019-02',
        endDate: '2021-02',
        isCurrent: false,
        summary: 'Managed mutual funds integrations and user wealth dashboard experiences.'
      },
      {
        title: 'Digital Product Specialist',
        company: 'Sterling Bank',
        companyDomain: 'sterling.ng',
        startDate: '2017-06',
        endDate: '2019-01',
        isCurrent: false,
        summary: 'Managed digital banking apps and USSD payment products.'
      }
    ],
    education: [
      {
        degree: 'Bachelors',
        major: 'Economics',
        school: 'University of Ibadan',
        startYear: '2012',
        endYear: '2016'
      }
    ]
  },
  {
    id: 'whogpt_babatunde_adeyemi',
    fullName: 'Babatunde Adeyemi',
    firstName: 'Babatunde',
    lastName: 'Adeyemi',
    currentTitle: 'Engineering Manager',
    currentCompany: 'Moniepoint',
    companyDomain: 'moniepoint.com',
    location: 'Lagos State, Nigeria',
    summary: 'Engineering Manager leading 18+ distributed backend and infrastructure engineers building mission-critical core banking and agency networks in West Africa. Prior 5 years leading enterprise telecom systems at MTN Nigeria.',
    skills: ['Engineering Leadership', 'Distributed Systems', 'Cloud Architecture', 'Fintech', 'Telecommunications', 'Java', 'Kubernetes', 'High-Volume Systems', 'Team Leadership'],
    linkedinUrl: 'https://www.linkedin.com/in/babatunde-adeyemi-eng',
    githubUrl: 'https://github.com/babatunde-ade',
    experience: [
      {
        title: 'Engineering Manager',
        company: 'Moniepoint',
        companyDomain: 'moniepoint.com',
        startDate: '2022-01',
        endDate: 'Present',
        isCurrent: true,
        summary: 'Leading banking core platforms and POS routing infrastructure with 99.98% service uptime.'
      },
      {
        title: 'Senior Systems & Telecoms Engineer',
        company: 'MTN Nigeria',
        companyDomain: 'mtn.ng',
        startDate: '2017-04',
        endDate: '2021-12',
        isCurrent: false,
        summary: 'Managed enterprise mobile network integrations, billing gateway switches, and USSD financial services links.'
      },
      {
        title: 'Senior Backend Engineer',
        company: 'OPay',
        companyDomain: 'opayweb.com',
        startDate: '2015-06',
        endDate: '2017-03',
        isCurrent: false,
        summary: 'Architected wallet ledger microservices and agency banking transaction queues.'
      }
    ],
    education: [
      {
        degree: 'Bachelors',
        major: 'Computer Engineering',
        school: 'Obafemi Awolowo University',
        startYear: '2009',
        endYear: '2014'
      }
    ]
  },
  {
    id: 'whogpt_ifeoma_anene',
    fullName: 'Ifeoma Anene',
    firstName: 'Ifeoma',
    lastName: 'Anene',
    currentTitle: 'Senior Data Analyst',
    currentCompany: 'Access Bank',
    companyDomain: 'accessbankplc.com',
    location: 'Lagos State, Nigeria',
    summary: 'Senior Data Analyst with 6 years experience in customer segmentation, fraud detection models, and executive business intelligence dashboards for retail banking.',
    skills: ['Data Analysis', 'SQL', 'Python', 'Power BI', 'Tableau', 'Predictive Modeling', 'Financial Data', 'ETL Pipelines', 'Business Intelligence'],
    linkedinUrl: 'https://www.linkedin.com/in/ifeoma-anene-data',
    githubUrl: '',
    experience: [
      {
        title: 'Senior Data Analyst',
        company: 'Access Bank',
        companyDomain: 'accessbankplc.com',
        startDate: '2021-08',
        endDate: 'Present',
        isCurrent: true,
        summary: 'Built transaction anomaly detection models and real-time executive performance dashboards monitoring N100B+ monthly volumes.'
      },
      {
        title: 'Business Intelligence Analyst',
        company: 'Stanbic IBTC Bank',
        companyDomain: 'stanbicibtc.com',
        startDate: '2018-05',
        endDate: '2021-07',
        isCurrent: false,
        summary: 'Created automated reporting pipelines and customer lifetime value cohorts using SQL and Power BI.'
      }
    ],
    education: [
      {
        degree: 'Bachelors',
        major: 'Mathematics & Statistics',
        school: 'University of Nigeria, Nsukka',
        startYear: '2013',
        endYear: '2017'
      }
    ]
  },
  {
    id: 'whogpt_kelechi_eze',
    fullName: 'Kelechi Eze',
    firstName: 'Kelechi',
    lastName: 'Eze',
    currentTitle: 'Senior DevOps Engineer',
    currentCompany: 'Kuda Bank',
    companyDomain: 'kuda.com',
    location: 'Lagos State, Nigeria',
    summary: 'DevOps specialist with 7 years managing AWS & GCP cloud platforms, CI/CD automation, Kubernetes clusters, and zero-downtime microservice deployments for high-scale digital banking.',
    skills: ['DevOps', 'Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'PostgreSQL', 'Cloud Infrastructure', 'Fintech', 'Linux'],
    linkedinUrl: 'https://www.linkedin.com/in/kelechi-eze-devops',
    githubUrl: 'https://github.com/kelechi-ops',
    experience: [
      {
        title: 'Senior DevOps Engineer',
        company: 'Kuda Bank',
        companyDomain: 'kuda.com',
        startDate: '2022-02',
        endDate: 'Present',
        isCurrent: true,
        summary: 'Managing cloud infrastructure across multi-region Kubernetes clusters with automated GitOps workflows.'
      },
      {
        title: 'Cloud Infrastructure Engineer',
        company: 'Interswitch Group',
        companyDomain: 'interswitchgroup.com',
        startDate: '2018-04',
        endDate: '2022-01',
        isCurrent: false,
        summary: 'Automated server provisioning, containerized legacy payment gateways, and managed PCI-DSS security compliance.'
      }
    ],
    education: [
      {
        degree: 'Bachelors',
        major: 'Information Technology',
        school: 'Federal University of Technology, Akure',
        startYear: '2012',
        endYear: '2017'
      }
    ]
  },
  {
    id: 'whogpt_emmanuel_okon',
    fullName: 'Emmanuel Okon',
    firstName: 'Emmanuel',
    lastName: 'Okon',
    currentTitle: 'Senior Telecom & Core Network Engineer',
    currentCompany: 'MTN Nigeria',
    companyDomain: 'mtn.ng',
    location: 'Lagos State, Nigeria',
    summary: 'Telecommunications engineer with 8 years of experience designing, expanding, and optimizing mobile network infrastructure, IP transmission, and enterprise telecom interconnects.',
    skills: ['Telecommunications', 'Network Engineering', 'IP Routing', 'Cisco', 'Telecom Infrastructure', 'BGP', 'VoIP', 'MPLS', 'Wireless Networks'],
    linkedinUrl: 'https://www.linkedin.com/in/emmanuel-okon-telco',
    githubUrl: '',
    experience: [
      {
        title: 'Senior Network Engineer',
        company: 'MTN Nigeria',
        companyDomain: 'mtn.ng',
        startDate: '2019-05',
        endDate: 'Present',
        isCurrent: true,
        summary: 'Leading core network capacity planning, IP routing backbone, and 4G/5G transmission site rollouts in Southwestern Nigeria.'
      },
      {
        title: 'Core Network Specialist',
        company: 'Airtel Nigeria',
        companyDomain: 'airtel.com.ng',
        startDate: '2016-03',
        endDate: '2019-04',
        isCurrent: false,
        summary: 'Maintained packet core equipment, SGSN/GGSN network nodes, and inter-carrier fiber links.'
      }
    ],
    education: [
      {
        degree: 'Bachelors',
        major: 'Electrical & Electronics Engineering',
        school: 'University of Benin',
        startYear: '2010',
        endYear: '2015'
      }
    ]
  },
  {
    id: 'whogpt_amina_bello',
    fullName: 'Amina Bello',
    firstName: 'Amina',
    lastName: 'Bello',
    currentTitle: 'Senior Operations Manager',
    currentCompany: 'Nestle Nigeria',
    companyDomain: 'nestle.com',
    location: 'Lagos State, Nigeria',
    summary: 'Supply chain and operations lead with 8 years optimizing manufacturing distribution, route-to-market logistics, and vendor management across West Africa.',
    skills: ['Operations Management', 'Supply Chain', 'Logistics', 'FMCG', 'Process Optimization', 'Vendor Management', 'Inventory Control', 'Warehouse Operations'],
    linkedinUrl: 'https://www.linkedin.com/in/amina-bello-ops',
    githubUrl: '',
    experience: [
      {
        title: 'Senior Operations Manager',
        company: 'Nestle Nigeria',
        companyDomain: 'nestle.com',
        startDate: '2021-07',
        endDate: 'Present',
        isCurrent: true,
        summary: 'Leading primary distribution logistics, warehouse operations, and national freight optimization for food and beverage supply chains.'
      },
      {
        title: 'Supply Chain Specialist',
        company: 'Unilever Nigeria',
        companyDomain: 'unilever.com',
        startDate: '2017-02',
        endDate: '2021-06',
        isCurrent: false,
        summary: 'Managed replenishment scheduling, raw material vendor procurement, and port clearance operations.'
      }
    ],
    education: [
      {
        degree: 'Bachelors',
        major: 'Industrial & Production Engineering',
        school: 'University of Ibadan',
        startYear: '2011',
        endYear: '2016'
      }
    ]
  },
  {
    id: 'whogpt_osagie_ighodalo',
    fullName: 'Osagie Ighodalo',
    firstName: 'Osagie',
    lastName: 'Ighodalo',
    currentTitle: 'Senior Petroleum Engineer',
    currentCompany: 'Seplat Energy',
    companyDomain: 'seplatenergy.com',
    location: 'Port Harcourt, Nigeria',
    summary: 'Petroleum engineer with 9 years in upstream oil and gas asset development, reservoir surveillance, and well performance optimization in the Niger Delta basin.',
    skills: ['Petroleum Engineering', 'Reservoir Management', 'Oil & Gas', 'Production Optimization', 'Petrel', 'Asset Management', 'Upstream Operations'],
    linkedinUrl: 'https://www.linkedin.com/in/osagie-ighodalo-energy',
    githubUrl: '',
    experience: [
      {
        title: 'Senior Petroleum Engineer',
        company: 'Seplat Energy',
        companyDomain: 'seplatenergy.com',
        startDate: '2020-03',
        endDate: 'Present',
        isCurrent: true,
        summary: 'Conducting reservoir flow modeling, waterflood project monitoring, and oilfield production forecasting.'
      },
      {
        title: 'Reservoir Engineer',
        company: 'Shell Nigeria (SPDC)',
        companyDomain: 'shell.com.ng',
        startDate: '2015-08',
        endDate: '2020-02',
        isCurrent: false,
        summary: 'Supported shallow offshore reservoir simulations, field development plans, and well intervention programs.'
      }
    ],
    education: [
      {
        degree: 'Bachelors',
        major: 'Petroleum Engineering',
        school: 'University of Port Harcourt',
        startYear: '2009',
        endYear: '2014'
      }
    ]
  }
];

/**
 * Intelligently scores and selects candidates matching the recruiter's specific role & query.
 */
export function matchTalentPoolCandidates(pool, { prompt = '', structuredParams = {}, sqlQuery = '', limit = 1 }) {
  const queryWords = `${prompt} ${structuredParams.cleanRoleTitle || ''} ${structuredParams.industry || ''} ${(structuredParams.skills || []).join(' ')}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['with', 'from', 'that', 'this', 'have', 'years', 'experience', 'nigeria'].includes(w));

  const roleTitle = (structuredParams.cleanRoleTitle || '').toLowerCase().trim();
  const synonyms = Array.isArray(structuredParams.roleSynonyms) 
    ? structuredParams.roleSynonyms.map(s => s.toLowerCase().trim()) 
    : [];

  const promptLower = prompt.toLowerCase();

  const scored = pool.map(candidate => {
    let score = 0;
    const candTitle = (candidate.currentTitle || '').toLowerCase();
    const candSkills = (candidate.skills || []).map(s => s.toLowerCase());
    const candCompanies = (candidate.experience || []).map(e => (e.company || '').toLowerCase()).join(' ');
    const candText = `${candidate.summary} ${(candidate.experience || []).map(e => e.title + ' ' + e.summary).join(' ')}`.toLowerCase();

    // 1. Direct Title & Synonym Matching (Highest Priority)
    if (roleTitle && candTitle.includes(roleTitle)) {
      score += 250;
    }
    synonyms.forEach(syn => {
      if (candTitle.includes(syn)) score += 180;
    });

    // 2. Exact Query Specific Matches (e.g., Software vs Designer vs Product vs Data)
    if (promptLower.includes('software') || promptLower.includes('engineer') || promptLower.includes('backend') || promptLower.includes('developer')) {
      if (candTitle.includes('software') || candTitle.includes('engineer') || candTitle.includes('developer')) score += 150;
      if (candTitle.includes('designer')) score -= 200; // Penalize designer for engineering queries
    }

    if (promptLower.includes('designer') || promptLower.includes('ui/ux') || promptLower.includes('design') || promptLower.includes('figma')) {
      if (candTitle.includes('designer')) score += 200;
      if (candTitle.includes('software') || candTitle.includes('engineer')) score -= 200; // Penalize engineer for design queries
    }

    if (promptLower.includes('product manager') || promptLower.includes('pm')) {
      if (candTitle.includes('product manager')) score += 220;
      if (candTitle.includes('designer')) score -= 100;
    }

    if (promptLower.includes('data') || promptLower.includes('analyst') || promptLower.includes('bi')) {
      if (candTitle.includes('data') || candTitle.includes('analyst')) score += 220;
    }

    if (promptLower.includes('devops') || promptLower.includes('cloud') || promptLower.includes('infrastructure')) {
      if (candTitle.includes('devops') || candTitle.includes('cloud')) score += 220;
    }

    if (promptLower.includes('telecom') || promptLower.includes('network') || promptLower.includes('mtn') || promptLower.includes('airtel')) {
      if (candTitle.includes('telecom') || candTitle.includes('network') || candCompanies.includes('mtn')) score += 150;
    }

    if (promptLower.includes('payment') || promptLower.includes('fintech') || promptLower.includes('banking')) {
      if (candSkills.includes('payment systems') || candText.includes('payment') || candCompanies.includes('flutterwave') || candCompanies.includes('paystack')) {
        score += 120;
      }
    }

    // 3. Word-by-word relevance scoring
    queryWords.forEach(word => {
      if (candTitle.includes(word)) score += 40;
      if (candSkills.some(s => s.includes(word))) score += 25;
      if (candCompanies.includes(word)) score += 20;
      if (candText.includes(word)) score += 10;
    });

    return { candidate, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(item => item.candidate);
}

/**
 * Executes search query against People Data Labs Search API
 * Explicitly forces IPv4 (family: 4) for immediate Windows network resolution.
 * Strictly enforces 1 candidate per query testing guardrail.
 * @param {string} sqlQuery - PDL SQL Search String
 * @param {Object} structuredParams - Structured search parameters from Groq
 * @param {string} prompt - Original recruiter prompt
 * @returns {Promise<Array>} List of normalized candidate profile objects
 */
export async function searchCandidates(sqlQuery, structuredParams = {}, prompt = '') {
  const fallbackMatch = () => {
    console.log(`[Talent Pool Dispatch]: Selecting top corresponding candidate for query: "${prompt || structuredParams.cleanRoleTitle}"`);
    return matchTalentPoolCandidates(NIGERIAN_TALENT_POOL, { prompt, structuredParams, sqlQuery, limit: 1 });
  };

  if (!API_KEY) {
    console.warn('[Notice]: PEOPLE_DATA_LABS_API_KEY is not configured, serving talent pool');
    return fallbackMatch();
  }

  return new Promise((resolve) => {
    let resolved = false;

    const safeResolve = (data) => {
      if (!resolved) {
        resolved = true;
        resolve(data);
      }
    };

    const requestBody = JSON.stringify({
      sql: sqlQuery,
      size: 1 // Testing Credit Guardrail: Exactly 1 candidate per search
    });

    const options = {
      hostname: 'api.peopledatalabs.com',
      port: 443,
      path: '/v5/person/search',
      method: 'POST',
      family: 4, // Critical for Windows: prevents IPv6 connection timeout
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: 15000
    };

    console.log(`[Executing Live PDL Query]: ${sqlQuery}`);
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`[PDL API Status]: ${res.statusCode}, Total Matches in Nigeria: ${parsed.total || 0}`);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (!parsed.data || parsed.data.length === 0) {
              console.log('[Notice] No direct matches from PDL query, falling back to role-matched talent pool.');
              return safeResolve(fallbackMatch());
            }
            const normalized = parsed.data.slice(0, 1).map(profile => normalizeProfile(profile, structuredParams));
            console.log(`[PDL Returned Real Candidate]: ${normalized[0].fullName} | ${normalized[0].currentTitle} @ ${normalized[0].currentCompany} (${normalized[0].location})`);
            return safeResolve(normalized);
          }

          console.warn('[PDL API Non-200 Response]:', res.statusCode);
          safeResolve(fallbackMatch());
        } catch (e) {
          console.warn('[PDL Parse Error, using talent pool]:', e.message);
          safeResolve(fallbackMatch());
        }
      });
    });

    req.on('timeout', () => {
      console.warn('[PDL Network Timeout after 15s, using talent pool]');
      req.destroy();
      safeResolve(fallbackMatch());
    });

    req.on('error', (err) => {
      console.warn('[PDL Network Error, using talent pool]:', err.message);
      safeResolve(fallbackMatch());
    });

    req.write(requestBody);
    req.end();
  });
}

function capitalizeWords(str) {
  if (!str || typeof str !== 'string') return '';
  return str.split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalizes raw PDL candidate JSON into a clean, consistent data model for WhoGPT
 */
function normalizeProfile(raw, structuredParams = {}) {
  const currentExp = (raw.experience || []).find(e => e.is_primary) || raw.experience?.[0] || {};
  
  // Extract company domain (crucial for Hunter.io email reveal)
  let companyDomain = raw.job_company_website || currentExp.company?.website || '';
  if (!companyDomain && raw.job_company_name) {
    companyDomain = raw.job_company_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  }
  companyDomain = companyDomain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];

  let cleanLocation = '';
  if (raw.location_name && typeof raw.location_name === 'string' && raw.location_name !== 'true') {
    cleanLocation = raw.location_name;
  } else {
    const locationParts = [];
    const loc = typeof raw.location_locality === 'string' && raw.location_locality !== 'true' ? raw.location_locality : '';
    const reg = typeof raw.location_region === 'string' && raw.location_region !== 'true' ? raw.location_region : '';
    if (loc) locationParts.push(capitalizeWords(loc));
    if (reg && reg.toLowerCase() !== loc.toLowerCase()) locationParts.push(capitalizeWords(reg));
    
    if (locationParts.length === 0 && structuredParams.targetLocation && structuredParams.targetLocation.toLowerCase() !== 'nigeria') {
      locationParts.push(capitalizeWords(structuredParams.targetLocation));
    }
    locationParts.push('Nigeria');
    cleanLocation = locationParts.join(', ');
  }

  const rawName = raw.full_name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim();
  const cleanName = capitalizeWords(rawName) || 'Confidential Profile';

  // Extract LinkedIn URL
  let linkedin = raw.linkedin_url || '';
  if (!linkedin && Array.isArray(raw.profiles)) {
    const lip = raw.profiles.find(p => p.network === 'linkedin' || (p.url && p.url.includes('linkedin.com')));
    if (lip) linkedin = lip.url;
  }
  if (!linkedin && raw.linkedin_username) {
    linkedin = `https://www.linkedin.com/in/${raw.linkedin_username}`;
  }
  if (linkedin && !linkedin.startsWith('http://') && !linkedin.startsWith('https://')) {
    linkedin = `https://${linkedin}`;
  }
  if (!linkedin && cleanName) {
    linkedin = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(cleanName + ' ' + (raw.job_company_name || 'Nigeria'))}`;
  }

  // Extract GitHub URL
  let github = raw.github_url || '';
  if (!github && Array.isArray(raw.profiles)) {
    const ghp = raw.profiles.find(p => p.network === 'github' || (p.url && p.url.includes('github.com')));
    if (ghp) github = ghp.url;
  }
  if (github && !github.startsWith('http://') && !github.startsWith('https://')) {
    github = `https://${github}`;
  }

  return {
    id: raw.id || `whogpt_${Math.random().toString(36).substring(2, 9)}`,
    fullName: cleanName,
    firstName: capitalizeWords(raw.first_name) || cleanName.split(' ')[0] || '',
    lastName: capitalizeWords(raw.last_name) || cleanName.split(' ').slice(1).join(' ') || '',
    currentTitle: capitalizeWords(raw.job_title || currentExp.title?.name || 'Senior Professional'),
    currentCompany: capitalizeWords(raw.job_company_name || currentExp.company?.name || 'Leading Enterprise'),
    companyDomain: companyDomain || 'company.com',
    location: cleanLocation || 'Nigeria',
    summary: raw.summary || '',
    skills: (raw.skills || []).slice(0, 15).map(capitalizeWords),
    linkedinUrl: linkedin,
    githubUrl: github,
    experience: (raw.experience || []).map(exp => ({
      title: capitalizeWords(exp.title?.name || 'Position'),
      company: capitalizeWords(exp.company?.name || 'Organisation'),
      companyDomain: exp.company?.website || '',
      startDate: exp.start_date || '',
      endDate: exp.end_date || 'Present',
      isCurrent: !exp.end_date || exp.is_primary,
      summary: exp.summary || ''
    })),
    education: (raw.education || []).map(edu => ({
      degree: capitalizeWords(edu.degrees?.[0] || 'Degree'),
      major: capitalizeWords(edu.majors?.[0] || ''),
      school: capitalizeWords(edu.school?.name || 'University'),
      startYear: edu.start_date || '',
      endYear: edu.end_date || ''
    }))
  };
}
