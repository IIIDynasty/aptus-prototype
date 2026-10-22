/**
 * Discovers candidate email using Hunter.io Email Finder API
 * Only triggered on explicit recruiter request to preserve monthly credits.
 * Compatible with Cloudflare Workers/Pages Functions and Node.js
 * @param {string} firstName - Candidate's first name
 * @param {string} lastName - Candidate's last name
 * @param {string} domain - Candidate's company domain (e.g. interswitchgroup.com)
 * @param {string} companyName - Company name fallback
 * @param {string} [customApiKey=null] - Optional Hunter API key from env
 * @returns {Promise<Object>} Found email details and verification confidence
 */
export async function findCandidateEmail({ firstName, lastName, domain, companyName }, customApiKey = null) {
  const apiKey = customApiKey || (typeof process !== 'undefined' ? process.env?.HUNTER_API_KEY : '');

  if (!apiKey) {
    throw new Error('HUNTER_API_KEY is not configured');
  }

  if (!firstName || !lastName) {
    throw new Error('First name and last name are required for contact discovery');
  }

  // Clean domain
  let cleanDomain = (domain || '')
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .trim();

  // If domain is generic or missing, try deriving from company name
  if (!cleanDomain || cleanDomain.includes('linkedin') || cleanDomain === 'company.com') {
    if (companyName) {
      cleanDomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    }
  }

  const queryParams = new URLSearchParams({
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    api_key: apiKey
  });

  if (cleanDomain && cleanDomain !== 'company.com') {
    queryParams.append('domain', cleanDomain);
  } else if (companyName) {
    queryParams.append('company', companyName.trim());
  }

  const url = `https://api.hunter.io/v2/email-finder?${queryParams.toString()}`;

  try {
    const res = await fetch(url);
    const parsed = await res.json();
    console.log(`[Hunter.io Status]: ${res.status} for ${firstName} ${lastName} @ ${cleanDomain}`);

    if (res.status === 200 && parsed.data && parsed.data.email) {
      return {
        status: 'found',
        email: parsed.data.email,
        score: parsed.data.score || 85,
        verificationStatus: parsed.data.verification?.status || 'deliverable',
        domain: cleanDomain,
        sourcesCount: (parsed.data.sources || []).length
      };
    }

    if (res.status === 404 || (parsed.data && !parsed.data.email)) {
      return {
        status: 'not_found',
        email: null,
        message: `No public email address found on ${cleanDomain || 'company domain'}.`,
        domain: cleanDomain
      };
    }

    if (parsed.errors && parsed.errors.length > 0) {
      return {
        status: 'error',
        email: null,
        message: parsed.errors[0].details || 'Contact lookup unavailable.',
        domain: cleanDomain
      };
    }

    return {
      status: 'not_found',
      email: null,
      message: 'Unable to retrieve contact details at this time.',
      domain: cleanDomain
    };
  } catch (e) {
    throw new Error(`Failed to parse Hunter.io response: ${e.message}`);
  }
}
