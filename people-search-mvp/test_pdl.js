import { matchTalentPoolCandidates, NIGERIAN_TALENT_POOL, searchCandidates } from './services/pdlService.js';
import { parseRecruiterQuery } from './services/groqParser.js';

async function testQuery(prompt) {
  console.log(`\n========================================`);
  console.log(`Testing query: "${prompt}"`);
  const { structuredParams, sqlQuery } = await parseRecruiterQuery(prompt, []);
  console.log(`Role extracted: "${structuredParams.cleanRoleTitle}"`);
  const results = await searchCandidates(sqlQuery, structuredParams, prompt);
  if (results.length > 0) {
    const c = results[0];
    console.log(`-> MATCHED CANDIDATE: ${c.fullName} | ${c.currentTitle} @ ${c.currentCompany} (${c.location})`);
  } else {
    console.log(`-> NO CANDIDATE MATCHED`);
  }
}

async function run() {
  await testQuery("senior software engineer with payment system experience");
  await testQuery("product designer with 5 years of experience in Lagos");
  await testQuery("product manager in Lagos");
  await testQuery("telecommunications engineer");
}

run().catch(console.error);
