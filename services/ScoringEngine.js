/* ============================================
   APTUS — AI Scoring Engine (Groq / LLaMA 3)
   ============================================ */

const Groq = require('groq-sdk');
const { getContainer } = require('../azure-config');

// Groq AI Configuration
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Experience level mapping (years)
const EXPERIENCE_LEVELS = {
  'Entry': 1,
  'Mid': 3,
  'Senior': 5,
  'Lead': 8,
  'Executive': 12
};

/**
 * Calculate skills match score (40% weight)
 * Uses exact match (60%) + fuzzy/partial match (40%)
 * No external API required — runs locally for free.
 *
 * @param {Array<string>} candidateSkills - Candidate's skills
 * @param {Array<string>} jobSkills - Required job skills
 * @returns {number} Skills match score (0-100)
 */
function calculateSkillsMatch(candidateSkills, jobSkills) {
  if (jobSkills.length === 0) return 100;
  if (candidateSkills.length === 0) return 0;

  const normalised = (s) => s.toLowerCase().trim();

  // 1. Exact match
  const exactMatches = jobSkills.filter(js =>
    candidateSkills.some(cs => normalised(cs) === normalised(js))
  );
  const exactScore = (exactMatches.length / jobSkills.length) * 100;

  // 2. Partial / fuzzy match (one skill contains the other)
  const fuzzyMatches = jobSkills.filter(js =>
    !candidateSkills.some(cs => normalised(cs) === normalised(js)) &&
    candidateSkills.some(cs =>
      normalised(cs).includes(normalised(js)) ||
      normalised(js).includes(normalised(cs))
    )
  );
  const fuzzyScore = fuzzyMatches.length > 0
    ? (fuzzyMatches.length / jobSkills.length) * 60  // partial credit
    : 0;

  const combinedScore = Math.min(100, Math.round((exactScore * 0.7) + (fuzzyScore * 0.3)));
  console.log(`Skills match: ${exactMatches.length}/${jobSkills.length} exact, ${fuzzyMatches.length} fuzzy → ${combinedScore}`);
  return combinedScore;
}

/**
 * Calculate experience match score (30% weight)
 * 
 * @param {number} candidateYears - Candidate's years of experience
 * @param {string} requiredLevel - Required experience level
 * @returns {number} Experience match score (0-100)
 */
function calculateExperienceMatch(candidateYears, requiredLevel) {
  const requiredYears = EXPERIENCE_LEVELS[requiredLevel] || 3;
  
  if (candidateYears >= requiredYears + 2) {
    return 100; // Exceeds requirement significantly
  } else if (candidateYears >= requiredYears) {
    return 85; // Meets requirement
  } else if (candidateYears >= requiredYears - 1) {
    return 60; // Close to requirement
  } else {
    // Below requirement
    const gap = requiredYears - candidateYears;
    return Math.max(0, 40 - (gap * 10));
  }
}

/**
 * Calculate qualifications score (20% weight)
 * Checks for degrees and certifications
 * 
 * @param {string} qualifications - Candidate's qualifications
 * @param {Array<string>} cvEducation - Education from CV
 * @param {Array<string>} cvCertifications - Certifications from CV
 * @returns {number} Qualifications score (0-100)
 */
function calculateQualificationsScore(qualifications, cvEducation = [], cvCertifications = []) {
  const qualStr = (qualifications || '').toLowerCase();
  const educationStr = cvEducation.join(' ').toLowerCase();
  const certStr = cvCertifications.join(' ').toLowerCase();
  
  const combinedStr = `${qualStr} ${educationStr} ${certStr}`;
  
  // Check for degrees
  const degreeKeywords = ['bsc', 'msc', 'hnd', 'phd', 'bachelor', 'master', 'chartered'];
  const hasDegree = degreeKeywords.some(keyword => combinedStr.includes(keyword));
  
  // Check for certifications
  const certKeywords = ['aws', 'pmp', 'google', 'cisco', 'certified', 'microsoft', 'comptia'];
  const hasCert = certKeywords.some(keyword => combinedStr.includes(keyword));
  
  if (hasDegree && hasCert) {
    return 100; // Has both
  } else if (hasDegree || hasCert) {
    return 70; // Has one
  } else {
    return 40; // Has neither
  }
}

/**
 * Assess application quality using Groq LLaMA 3 (10% weight)
 * Analyzes achievements for metrics, clarity, professionalism
 * 
 * @param {string} achievements - Candidate's achievements text
 * @returns {Promise<number>} Quality score (0-100)
 */
async function assessApplicationQuality(achievements) {
  if (!achievements || achievements.trim().length < 20) {
    return 30; // Very brief or missing
  }

  try {
    const prompt = `Rate this job application achievement statement on a scale of 0-100 based on:
1. Presence of specific metrics/numbers
2. Clarity and professionalism
3. Impact and relevance

Achievement statement:
"${achievements.substring(0, 500)}"

Return ONLY a number between 0-100. No explanation, just the number.`;

    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter evaluating application quality. Return only a single number between 0 and 100.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 10
    });

    const content = chatCompletion.choices[0].message.content.trim();
    const score = parseInt(content);

    if (isNaN(score) || score < 0 || score > 100) {
      return 50; // Fallback
    }

    console.log(`✅ Groq quality assessment: ${score}/100`);
    return score;

  } catch (error) {
    console.error('❌ Groq quality assessment failed:', error.message);
    // Fallback heuristic
    const hasMetrics = /\d+/.test(achievements);
    return hasMetrics ? 70 : 50;
  }
}

/**
 * Calculate total match score
 * Weighted combination of all components
 * 
 * @param {object} candidate - Candidate data
 * @param {object} job - Job data
 * @returns {Promise<object>} Score breakdown
 */
async function calculateMatchScore(candidate, job) {
  console.log(`🔍 Calculating match score for ${candidate.fullName} → ${job.title}`);

  const levelMatch = (job.experienceLevel || '').match(/^(Entry|Mid|Senior|Lead|Executive)/i);
  const levelKey = levelMatch ? levelMatch[1].charAt(0).toUpperCase() + levelMatch[1].slice(1).toLowerCase() : 'Mid';
  const normalisedLevel = Object.keys(EXPERIENCE_LEVELS).find(k => k.toLowerCase() === levelKey.toLowerCase()) || 'Mid';

  try {
    // Skills is now synchronous (local matching)
    const skillsScore = calculateSkillsMatch(candidate.skills, job.skills);
    const experienceScore = calculateExperienceMatch(candidate.yearsOfExperience, normalisedLevel);
    const qualificationsScore = calculateQualificationsScore(
      candidate.qualifications || '',
      candidate.cvEducation || [],
      candidate.cvCertifications || []
    );
    // Quality uses Groq (with local fallback built-in)
    const qualityScore = await assessApplicationQuality(candidate.achievements);

    const total = Math.round(
      (skillsScore * 0.4) +
      (experienceScore * 0.3) +
      (qualificationsScore * 0.2) +
      (qualityScore * 0.1)
    );

    console.log(`✅ Match score: ${total}/100 (skills:${skillsScore} exp:${experienceScore} qual:${qualificationsScore} quality:${qualityScore})`);

    return { skills: skillsScore, experience: experienceScore, qualifications: qualificationsScore, quality: qualityScore, total };

  } catch (error) {
    console.error('❌ Scoring failed, using full local fallback:', error.message);

    const candidateSkills = candidate.skills || [];
    const jobSkills = job.skills || [];
    const skillsScore = calculateSkillsMatch(candidateSkills, jobSkills);
    const experienceScore = calculateExperienceMatch(candidate.yearsOfExperience || 0, normalisedLevel);
    const qualificationsScore = calculateQualificationsScore(candidate.qualifications || '', [], []);
    const achievements = candidate.achievements || '';
    const hasMetrics = /\d+/.test(achievements);
    const hasLength = achievements.length > 100;
    const qualityScore = hasMetrics && hasLength ? 80 : hasMetrics ? 65 : hasLength ? 55 : 40;

    const total = Math.round(
      (skillsScore * 0.4) + (experienceScore * 0.3) + (qualificationsScore * 0.2) + (qualityScore * 0.1)
    );

    console.log(`⚠️  Local fallback score: ${total}/100`);
    return { skills: skillsScore, experience: experienceScore, qualifications: qualificationsScore, quality: qualityScore, total };
  }
}

/**
 * Pre-warm the embedding cache with common skills
 * Run this once to populate cache
 */
async function prewarmCache() {
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Azure',
    'Docker', 'Kubernetes', 'Git', 'Agile', 'Scrum', 'Leadership', 'Management',
    'Communication', 'Problem Solving', 'Teamwork', 'Project Management', 'Data Analysis',
    'HTML', 'CSS', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin'
  ];
  
  console.log('🔥 Pre-warming embedding cache...');
  
  for (const skill of commonSkills) {
    try {
      await getSkillEmbedding(skill);
    } catch (error) {
      console.error(`Failed to cache ${skill}:`, error.message);
    }
  }
  
  console.log('✅ Cache pre-warming complete');
}

module.exports = {
  calculateMatchScore,
  calculateSkillsMatch,
  calculateExperienceMatch,
  calculateQualificationsScore,
  assessApplicationQuality
};
