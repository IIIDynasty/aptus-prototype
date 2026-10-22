import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const sql = "SELECT * FROM person WHERE location_country = 'nigeria' AND (location_locality = 'kano' OR location_region = 'kano' OR location_name LIKE '%kano%') AND (job_title LIKE '%software engineer%' OR job_title LIKE '%software developer%');";

const t0 = Date.now();
const req = https.request({
  hostname: 'api.peopledatalabs.com',
  port: 443,
  path: '/v5/person/search',
  method: 'POST',
  family: 4,
  headers: {
    'X-Api-Key': process.env.PEOPLE_DATA_LABS_API_KEY,
    'Content-Type': 'application/json'
  },
  timeout: 15000
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode, 'Time:', Date.now() - t0, 'ms');
    try {
      const j = JSON.parse(d);
      console.log('TOTAL IN KANO:', j.total);
      j.data?.slice(0, 3).forEach(p => {
        console.log('Person:', p.full_name, '| Title:', p.job_title, '| Company:', p.job_company_name, '| Loc:', p.location_name, p.location_locality, p.location_region);
      });
    } catch(e) {
      console.log('ERR:', e.message);
    }
  });
});

req.write(JSON.stringify({ sql, size: 3 }));
req.end();
