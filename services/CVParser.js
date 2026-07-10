/* ============================================
   APTUS — CV Parser Service
   ============================================ */

const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { Configuration, OpenAIApi } = require('openai');

// OpenAI Configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

/**
 * Extract text from PDF file
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction failed:', error.message);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from DOCX file
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction failed:', error.message);
    throw new Error('Failed to extract text from DOCX');
  }
}

/**
 * Extract text from file based on extension
 * @param {Buffer} buffer - File buffer
 * @param {string} extension - File extension ('pdf' or 'docx')
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromFile(buffer, extension) {
  if (extension === 'pdf') {
    return await extractTextFromPDF(buffer);
  } else if (extension === 'docx') {
    return await extractTextFromDOCX(buffer);
  } else {
    throw new Error(`Unsupported file format: ${extension}`);
  }
}

/**
 * Truncate text to maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxChars - Maximum characters (default 8000)
 * @returns {string} Truncated text
 */
function truncateText(text, maxChars = 8000) {
  if (text.length <= maxChars) {
    return text;
  }
  return text.substring(0, maxChars) + '... [truncated]';
}

/**
 * Parse CV using OpenAI GPT-3.5-turbo
 * Extracts structured data: skills, certifications, education, experience
 * 
 * @param {string} cvText - Extracted CV text
 * @returns {Promise<object>} Parsed CV data
 */
async function parseCVWithAI(cvText) {
  try {
    // Truncate to 8000 characters
    const truncatedText = truncateText(cvText, 8000);

    const prompt = `Extract the following information from this CV/resume:

1. Skills (technical and soft skills)
2. Certifications (e.g., AWS, PMP, Google, Cisco)
3. Education (degrees like BSc, MSc, HND, PhD)
4. Years of experience (estimate from work history)

CV Text:
${truncatedText}

Return a JSON object with this structure:
{
  "skills": ["skill1", "skill2", ...],
  "certifications": ["cert1", "cert2", ...],
  "education": ["degree1", "degree2", ...],
  "estimatedYearsOfExperience": number
}`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a CV parser that extracts structured information from resumes. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.data.choices[0].message.content;
    const parsed = JSON.parse(content);

    console.log('✅ CV parsed successfully with AI');
    return {
      skills: parsed.skills || [],
      certifications: parsed.certifications || [],
      education: parsed.education || [],
      estimatedYearsOfExperience: parsed.estimatedYearsOfExperience || 0
    };

  } catch (error) {
    console.error('❌ AI CV parsing failed:', error.message);
    
    // Fallback: basic keyword extraction
    return fallbackParsing(cvText);
  }
}

/**
 * Fallback CV parsing using keyword detection
 * Used when AI parsing fails
 */
function fallbackParsing(cvText) {
  const text = cvText.toLowerCase();
  
  // Extract common skills
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'azure',
    'docker', 'kubernetes', 'git', 'agile', 'scrum', 'leadership', 'management'
  ];
  const skills = commonSkills.filter(skill => text.includes(skill));
  
  // Detect certifications
  const certKeywords = ['certified', 'certification', 'aws', 'pmp', 'google', 'cisco', 'microsoft'];
  const certifications = certKeywords.filter(keyword => text.includes(keyword));
  
  // Detect education
  const eduKeywords = ['bsc', 'msc', 'phd', 'hnd', 'bachelor', 'master', 'doctorate'];
  const education = eduKeywords.filter(keyword => text.includes(keyword));
  
  // Estimate years (very rough)
  const yearMatches = text.match(/\d{4}/g) || [];
  const years = yearMatches.map(y => parseInt(y)).filter(y => y >= 2000 && y <= new Date().getFullYear());
  const estimatedYears = years.length > 0 ? Math.max(0, new Date().getFullYear() - Math.min(...years)) : 0;
  
  return { skills, certifications, education, estimatedYearsOfExperience: Math.min(estimatedYears, 30) };
}

/**
 * Merge CV-extracted skills with form-submitted skills
 * Performs case-insensitive deduplication
 * 
 * @param {Array<string>} formSkills - Skills from application form
 * @param {Array<string>} cvSkills - Skills extracted from CV
 * @returns {Array<string>} Merged and deduplicated skills
 */
function mergeSkills(formSkills, cvSkills) {
  const merged = [...formSkills];
  
  cvSkills.forEach(cvSkill => {
    const exists = merged.some(formSkill => 
      formSkill.toLowerCase() === cvSkill.toLowerCase()
    );
    
    if (!exists) {
      merged.push(cvSkill);
    }
  });
  
  return merged;
}

/**
 * Complete CV processing pipeline
 * Downloads blob, extracts text, parses with AI, merges skills
 * 
 * @param {object} blobClient - Azure Blob client
 * @param {Array<string>} formSkills - Skills from form
 * @param {string} fileExtension - File extension
 * @returns {Promise<object>} Parsed CV data with merged skills
 */
async function processCVFile(blobClient, formSkills, fileExtension) {
  try {
    // Download blob
    const downloadResponse = await blobClient.download(0);
    const buffer = await streamToBuffer(downloadResponse.readableStreamBody);
    
    // Extract text
    const text = await extractTextFromFile(buffer, fileExtension);
    
    // Parse with AI
    const parsed = await parseCVWithAI(text);
    
    // Merge skills
    const mergedSkills = mergeSkills(formSkills, parsed.skills);
    
    return {
      ...parsed,
      skills: mergedSkills,
      extractedText: truncateText(text, 1000) // Store truncated version
    };
    
  } catch (error) {
    console.error('❌ CV processing failed:', error.message);
    throw error;
  }
}

/**
 * Convert stream to buffer
 */
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

module.exports = {
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromFile,
  parseCVWithAI,
  mergeSkills,
  processCVFile,
  truncateText
};
