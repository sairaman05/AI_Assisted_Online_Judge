import { getAgentLLM } from '../agents/shared/llm.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Job Description (JD) PDF & Text Analysis Service
 * Sanitizes input, extracts PDF text, and analyzes tech stack & requirements.
 */

export async function parseJDPdfBuffer(pdfBuffer) {
  try {
    const parsed = await pdfParse(pdfBuffer);
    return parsed.text || '';
  } catch (err) {
    console.error('PDF parsing error:', err.message);
    throw new Error('Failed to parse uploaded PDF document: ' + err.message);
  }
}

export function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  // Basic prompt injection & control character sanitization
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\[system\s*prompt\]/gi, '')
    .replace(/ignore\s*previous\s*instructions/gi, '')
    .trim();
}

export async function analyzeJobDescription({ company, role, jdText }) {
  const cleanJD = sanitizeInput(jdText);

  const prompt = `You are a Technical Recruiting Specialist & Senior Engineering Manager. Analyze the following Job Description (JD) for the role of "${role || 'Software Engineer'}" at "${company || 'Target Company'}".

JOB DESCRIPTION TEXT:
${cleanJD || 'Standard Software Engineering Position requiring Data Structures, Algorithms, System Design, and Modern Software Engineering practices.'}

INSTRUCTIONS:
1. Extract the key technical requirements, programming languages, frameworks, databases, cloud platforms, AI/ML skills, DSA expectations, system design expectations, and behavioral skills.
2. DO NOT invent skills not mentioned in or implied by the JD.

JSON Output Format:
{
  "jobTitle": "${role || 'Software Engineer'}",
  "company": "${company || 'Target Company'}",
  "programmingLanguages": ["<Lang 1>", "<Lang 2>"],
  "frameworks": ["<Framework 1>"],
  "databases": ["<DB 1>"],
  "cloudAndDevOps": ["<Cloud 1>"],
  "dsaExpectations": ["<e.g. Arrays, Trees, Graphs, DP>"],
  "systemDesignExpectations": ["<e.g. Microservices, Caching, Rate Limiting>"],
  "behavioralSkills": ["<e.g. Leadership, Cross-functional communication>"],
  "experienceLevel": "<Senior / Mid-Level / Entry-Level>",
  "keyHighlights": ["<Highlight 1>", "<Highlight 2>"]
}`;

  const llm = getAgentLLM({ temperature: 0.3, maxTokens: 550 });
  const completion = await llm.invoke([
    { role: 'system', content: 'You are an AI recruiting analyst. Return clean JSON.' },
    { role: 'user', content: prompt }
  ]);

  let text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
  let parsed;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    parsed = {
      jobTitle: role || 'Software Engineer',
      company: company || 'Target Company',
      programmingLanguages: ['Python', 'Java', 'JavaScript'],
      frameworks: ['React', 'Node.js'],
      databases: ['PostgreSQL', 'MongoDB'],
      cloudAndDevOps: ['Docker', 'AWS'],
      dsaExpectations: ['Arrays', 'Strings', 'Dynamic Programming', 'Trees'],
      systemDesignExpectations: ['REST APIs', 'Database Indexing'],
      behavioralSkills: ['Problem Solving', 'Team Collaboration'],
      experienceLevel: 'Mid-Level',
      keyHighlights: ['Strong algorithmic foundation required', 'Full-stack development experience']
    };
  }

  return parsed;
}
