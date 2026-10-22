/**
 * Bright Data - Nigeria Talent Search Test
 * 
 * Two-step pipeline:
 * Step 1: Search LinkedIn for Nigerian professionals by role keyword
 * Step 2: Enrich the top result URL with full profile data (skills, experience, job title)
 * 
 * Usage: node brightdata_test/test_nigeria_search.js
 * Replace BRIGHT_DATA_API_KEY below with your actual key.
 */

import https from 'https';
import fs from 'fs';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_KEY = '1e1904f2-a52a-4f0f-b5a9-bdd3da0c3b17'; // <-- paste your key here

// Bright Data Config
const DATASET_PROFILE = 'gd_l1viktl72bvl7bjuj0'; // LinkedIn people profiles (full data)
const SERP_ZONE = 'serp_test'; // Your SERP API zone name

// What role to search for
const ROLE = 'software developer';
const LOCATION = 'Nigeria';
// ─────────────────────────────────────────────────────────────────────────────


/**
 * Makes an HTTPS POST request to the Bright Data API
 */
const brightDataPost = (datasetId, inputArray) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ input: inputArray });

    const options = {
      hostname: 'api.brightdata.com',
      port: 443,
      path: `/datasets/v3/scrape?dataset_id=${datasetId}&notify=false&include_errors=true`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};


/**
 * STEP 1: Search Google via SERP API for LinkedIn profiles
 */
const searchSerp = async (role, location) => {
  console.log('\n========================================');
  console.log(`STEP 1: X-Ray searching Google for "${role}" in ${location}...`);
  console.log('========================================');

  const query = `site:linkedin.com/in/ "${role}" "${location}"`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`;

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      zone: SERP_ZONE,
      url: googleSearchUrl,
      format: 'raw',
      data_format: 'html'
    });

    const options = {
      hostname: 'api.brightdata.com',
      port: 443,
      path: `/request`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('[SERP API Status]:', res.statusCode);
          
          if (res.statusCode >= 400) {
            console.error('[ERROR] SERP Search failed:', parsed);
            return resolve(null);
          }

          // Save full SERP response to file for inspection
          fs.writeFileSync('brightdata_test/serp_response.json', JSON.stringify(parsed, null, 2));
          console.log('[DEBUG] Saved full SERP JSON to brightdata_test/serp_response.json');

          // Extract LinkedIn URLs from organic search results
          const organicResults = parsed.organic || parsed.results || [];
          const profileUrls = organicResults
            .map(r => r.link || r.url)
            .filter(link => link && link.includes('linkedin.com/in/'));
            
          console.log(`[Results] Found ${profileUrls.length} LinkedIn profile URLs from search`);
          profileUrls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
          
          resolve(profileUrls);
        } catch (e) {
          console.error('[ERROR] Failed to parse SERP response:', data);
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};


/**
 * STEP 2: Enrich a LinkedIn profile URL with full data
 * Uses the LinkedIn people profiles endpoint — returns skills, full experience, job title, etc.
 */
const enrichProfile = async (profileUrl) => {
  console.log('\n========================================');
  console.log('STEP 2: Enriching profile with full data...');
  console.log('URL:', profileUrl);
  console.log('========================================');

  const response = await brightDataPost(DATASET_PROFILE, [
    { url: profileUrl }
  ]);

  console.log('[API Status]:', response.statusCode);

  if (!response.data || response.statusCode >= 400) {
    console.error('[ERROR] Profile enrichment failed:', response.data);
    return null;
  }

  const profiles = Array.isArray(response.data) ? response.data : [response.data];
  const profile = profiles[0];

  if (!profile) {
    console.log('[No Data] No profile data returned.');
    return null;
  }

  console.log('\n[FULL PROFILE DATA]');
  console.log('  Name:      ', profile.name || profile.full_name || 'N/A');
  console.log('  Job Title: ', profile.position || profile.job_title || profile.headline || 'N/A');
  console.log('  Location:  ', profile.location || profile.city || 'N/A');
  console.log('  Summary:   ', profile.about || profile.summary || 'N/A');

  if (profile.experience && Array.isArray(profile.experience)) {
    console.log('\n  Experience:');
    profile.experience.slice(0, 3).forEach(exp => {
      console.log(`    - ${exp.title || exp.position || 'N/A'} @ ${exp.company || exp.company_name || 'N/A'} (${exp.start_date || '?'} - ${exp.end_date || 'present'})`);
    });
  }

  if (profile.skills && Array.isArray(profile.skills)) {
    console.log('\n  Skills:', profile.skills.slice(0, 10).join(', '));
  }

  console.log('\n[RAW JSON DUMP - first result]:');
  console.log(JSON.stringify(profile, null, 2));

  return profile;
};


/**
 * MAIN: Run the two-step pipeline
 */
const main = async () => {
  console.log('\n Bright Data Nigeria Talent Search - Pipeline Test');
  console.log('API Key:', !API_KEY || API_KEY === 'YOUR_BRIGHT_DATA_API_KEY_HERE' ? 'NOT SET - please add your key!' : 'Set OK');

  if (!API_KEY || API_KEY === 'YOUR_BRIGHT_DATA_API_KEY_HERE') {
    console.log('\nPlease open this file and replace YOUR_BRIGHT_DATA_API_KEY_HERE with your actual Bright Data API key.');
    process.exit(1);
  }

  // Step 1: Search via SERP API
  const profileUrls = await searchSerp(ROLE, LOCATION);

  if (!profileUrls || profileUrls.length === 0) {
    console.log('\nStep 1 returned no profile URLs.');
    return;
  }

  // Step 2: Enrich the first result with full profile data
  const firstProfileUrl = profileUrls[0];
  if (firstProfileUrl) {
    await enrichProfile(firstProfileUrl);
  } else {
    console.log('\nNo profile URL returned from search to enrich.');
  }

  console.log('\nPipeline test complete!');
};

main().catch(console.error);
