import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

/**
 * Discovers candidate email using Hunter.io Email Finder API
 * Only triggered on explicit recruiter request to preserve monthly credits.
 * @param {string} firstName - Candidate's first name
 * @param {string} lastName - Candidate's last name
 * @param {string} domain - Candidate's company domain (e.g. interswitchgroup.com)
 * @param {string} companyName - Company name fallback
 * @returns {Promise<Object>} Found email details and verification confidence
 */
export async function findCandidateEmail({ firstName, lastName, domain, companyName }) {
  if (!HUNTER_API_KEY) {
    throw new Error('HUNTER_API_KEY is not configured in .env');
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
    api_key: HUNTER_API_KEY
  });

  if (cleanDomain && cleanDomain !== 'company.com') {
    queryParams.append('domain', cleanDomain);
  } else if (companyName) {
    queryParams.append('company', companyName.trim());
  }

  const url = `https://api.hunter.io/v2/email-finder?${queryParams.toString()}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`[Hunter.io Status]: ${res.statusCode} for ${firstName} ${lastName} @ ${cleanDomain}`);

          if (res.statusCode === 200 && parsed.data && parsed.data.email) {
            return resolve({
              status: 'found',
              email: parsed.data.email,
              score: parsed.data.score || 85,
              verificationStatus: parsed.data.verification?.status || 'deliverable',
              domain: cleanDomain,
              sourcesCount: (parsed.data.sources || []).length
            });
          }

          if (res.statusCode === 404 || (parsed.data && !parsed.data.email)) {
            return resolve({
              status: 'not_found',
              email: null,
              message: `No public email address found on ${cleanDomain || 'company domain'}.`,
              domain: cleanDomain
            });
          }

          if (parsed.errors && parsed.errors.length > 0) {
            return resolve({
              status: 'error',
              email: null,
              message: parsed.errors[0].details || 'Contact lookup unavailable.',
              domain: cleanDomain
            });
          }

          resolve({
            status: 'not_found',
            email: null,
            message: 'Unable to retrieve contact details at this time.',
            domain: cleanDomain
          });
        } catch (e) {
          reject(new Error(`Failed to parse Hunter.io response: ${e.message}`));
        }
      });
    }).on('error', (err) => reject(err));
  });
}
