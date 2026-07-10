/* ============================================
   APTUS — AI Scoring Engine
   ============================================ */

const { Configuration, OpenAIApi } = require('openai');
const { getContainer } = require('../azure-config');

// OpenAI Configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Experience level mapping (years)
const EXPERIENCE_LEVELS = {
  'Entry': 1,
  'Mid': 3,
  'Senior': 5,
  'Lead': 8,
  'Executive': 12
};

/**
 * Get or create embedding for a skill
 * Uses caching to reduce API calls
 * 
 * @param {string} skill - Skill name
 * @returns {Promise<Array<number>>} Embedding vector
 */
async function getSkillEmbedding(skill) {
  const normalizedSkill = skill.toLowerCase().trim();
  
  // Check cache first
  try {
    const container = getContainer('skillEmbeddingsCache');
    const { resource: cached } = await container.item(normalizedSkill, normalizedSkill).read();
    
    if (cached && cached.embedding) {
      console.log(`✅ Cache hit for skill: ${skill}`);
      return cached.embedding;
    }
  } catch (error) {
    // Cache miss, continue to generate
  }
  
  // Generate embedding
  try {
    const response = await openai.createEmbedding({
      model: 'text-embedding-3-small',
      input: normalizedSkill
    });
    
    const embedding = response.data.data[0].embedding;
    
    // Cache the embedding
    try {
      const container = getContainer('skillEmbeddingsCache');
      await container.items.create({
        id: normalizedSkill,
        skill: normalizedSkill,
        embedding: embedding,
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Cached embedding for skill: ${skill}`);
    } catch (cacheError) {
      console.error('Failed to cache embedding:', cacheError.message);
    }
    
    return embedding;
    
  } catch (error) {
    console.error(`❌ Failed to generate embedding for "${skill}":`, error.message);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate skills match score (40% weight)
 * Uses exact match (50%) + semantic match (50%)
 * 
 * @param {Array<string>} candidateSkills - Candidate's skills
 * @param {Array<string>} jobSkills - Required job skills
 * @returns {Promise<number>} Skills match score (0-100)
 */
async function calculateSkillsMatch(candidateSkills, jobSkills) {
  if (jobSkills.length === 0) return 100;
  if (candidateSkills.length === 0) return 0;
  
  // 1. Exact match (50%)
  const exactMatches = jobSkills.filter(jobSkill =>
    candidateSkills.some(candSkill => 
      candSkill.toLowerCase() === jobSkill.toLowerCase()
    )
  );
  const exactScore = (exactMatches.length / jobSkills.length) * 100;
  
  // 2. Semantic match (50%)
  try {
    // Get embeddings for all skills (with caching)
    const jobEmbeddings = await Promise.all(
      jobSkills.map(skill => getSkillEmbedding(skill))
    );
    const candidateEmbeddings = await Promise.all(
      candidateSkills.map(skill => getSkillEmbedding(skill))
    );
    
    // Calculate average embedding for each set
    const avgJobEmbedding = averageEmbedding(jobEmbeddings);
    const avgCandidateEmbedding = averageEmbedding(candidateEmbeddings);
    
    // Calculate similarity
    const similarity = cosineSimilarity(avgJobEmbedding, avgCandidateEmbedding);
    const semanticScore = Math.max(0, Math.min(100, similarity * 100));
    
    // Combined score
    const combinedScore = Math.round((exactScore * 0.5) + (semanticScore * 0.5));
    
    console.log(`Skills match: ${exactMatches.length}/${jobSkills.length} exact, semantic similarity: ${similarity.toFixed(2)}`);
    
    return combinedScore;
    
  } catch (error) {
    console.error('Semantic matching failed, using exact match only:', error.message);
    return Math.round(exactScore);
  }
}

/**
 * Calculate average embedding from multiple embeddings
 */
function averageEmbedding(embeddings) {
  if (embeddings.length === 0) return [];
  
  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);
  
  for (const embedding of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += embedding[i];
    }
  }
  
  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }
  
  return avg;
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
 * Assess application quality using GPT-3.5-turbo (10% weight)
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

Return only a number between 0-100.`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter evaluating application quality. Return only a number.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    const content = response.data.choices[0].message.content.trim();
    const score = parseInt(content);
    
    if (isNaN(score) || score < 0 || score > 100) {
      return 50; // Fallback
    }
    
    console.log(`✅ Application quality assessed: ${score}/100`);
    return score;
    
  } catch (error) {
    console.error('❌ Quality assessment failed:', error.message);
    // Fallback: check for numbers/metrics
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
  
  // Extract short key from full experience level string
  // e.g. "Senior Level (5+ years)" → "Senior"
  const levelMatch = (job.experienceLevel || '').match(/^(Entry|Mid|Senior|Lead|Executive)/i);
  const levelKey = levelMatch ? levelMatch[1].charAt(0).toUpperCase() + levelMatch[1].slice(1).toLowerCase() : 'Mid';
  // Capitalise correctly for the map: Entry, Mid, Senior, Lead, Executive
  const normalisedLevel = Object.keys(EXPERIENCE_LEVELS).find(k => k.toLowerCase() === levelKey.toLowerCase()) || 'Mid';

  try {
    // Calculate each component
    const skillsScore = await calculateSkillsMatch(candidate.skills, job.skills);
    const experienceScore = calculateExperienceMatch(
      candidate.yearsOfExperience,
      normalisedLevel          // ← fixed: pass short key, not full string
    );
    const qualificationsScore = calculateQualificationsScore(
      candidate.qualifications || '',
      candidate.cvEducation || [],
      candidate.cvCertifications || []
    );
    const qualityScore = await assessApplicationQuality(candidate.achievements);
    
    // Weighted total (Skills 40%, Experience 30%, Qualifications 20%, Quality 10%)
    const total = Math.round(
      (skillsScore * 0.4) +
      (experienceScore * 0.3) +
      (qualificationsScore * 0.2) +
      (qualityScore * 0.1)
    );
    
    console.log(`✅ Match score calculated: ${total}/100 (skills:${skillsScore} exp:${experienceScore} qual:${qualificationsScore} quality:${qualityScore})`);
    
    return {
      skills: skillsScore,
      experience: experienceScore,
      qualifications: qualificationsScore,
      quality: qualityScore,
      total: total
    };
    
  } catch (error) {
    console.error('❌ AI scoring failed, falling back to local calculation:', error.message);
    
    // LOCAL FALLBACK — no OpenAI needed
    const candidateSkills = candidate.skills || [];
    const jobSkills = job.skills || [];
    
    // Skills: exact match only
    const exactMatches = jobSkills.filter(js =>
      candidateSkills.some(cs => cs.toLowerCase().trim() === js.toLowerCase().trim())
    );
    const skillsScore = jobSkills.length > 0
      ? Math.round((exactMatches.length / jobSkills.length) * 100)
      : 50;
    
    // Experience: use normalised level key (already extracted above)
    const experienceScore = calculateExperienceMatch(candidate.yearsOfExperience || 0, normalisedLevel);
    
    // Qualifications: keyword check (sync, no OpenAI)
    const qualificationsScore = calculateQualificationsScore(
      candidate.qualifications || '',
      candidate.cvEducation || [],
      candidate.cvCertifications || []
    );
    
    // Quality: simple heuristic — does the text contain numbers/metrics?
    const achievements = candidate.achievements || '';
    const hasMetrics = /\d+/.test(achievements);
    const hasLength = achievements.length > 100;
    const qualityScore = hasMetrics && hasLength ? 80 : hasMetrics ? 65 : hasLength ? 55 : 40;
    
    const total = Math.round(
      (skillsScore * 0.4) +
      (experienceScore * 0.3) +
      (qualificationsScore * 0.2) +
      (qualityScore * 0.1)
    );
    
    console.log(`⚠️  Local fallback score: ${total}/100 (skills:${skillsScore} exp:${experienceScore} qual:${qualificationsScore} quality:${qualityScore})`);
    
    return {
      skills: skillsScore,
      experience: experienceScore,
      qualifications: qualificationsScore,
      quality: qualityScore,
      total: total
    };
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
  assessApplicationQuality,
  getSkillEmbedding,
  prewarmCache
};
