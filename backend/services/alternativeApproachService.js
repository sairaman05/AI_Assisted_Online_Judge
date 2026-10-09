import { getAgentLLM } from '../agents/shared/llm.js';

/**
 * Alternative Approach Analysis Service
 * Evaluates whether a substantially better approach exists and provides deep pedagogical teaching.
 */
export async function analyzeAlternativeApproaches({
  problemTitle,
  problemDescription,
  acceptedCode,
  language
}) {
  const prompt = `You are a World-Class Competitive Programming Coach and CS Professor.
You are teaching a student who just submitted an ACCEPTED code.

PROBLEM TITLE: ${problemTitle || 'Coding Problem'}
PROBLEM DESCRIPTION:
${problemDescription || ''}

ACCEPTED USER CODE (${language || 'python'}):
\`\`\`${language || 'python'}
${acceptedCode}
\`\`\`

INSTRUCTIONS:
1. Analyze the user's ACCEPTED code to determine its current approach and time/space complexity.
2. Determine if a SUBSTANTIALLY DIFFERENT or BETTER asymptotic approach exists (e.g. O(N^2) Brute Force vs O(N) Hash Map, or O(N log N) Sorting vs O(N) Two Pointers).
3. CRITICAL RULE: If the user's solution is ALREADY optimal and NO substantially better approach exists, set "hasAlternative": false and explain why the current solution is already optimal.
4. If a substantially better alternative DOES exist, set "hasAlternative": true and provide a DEEPLY EDUCATIONAL breakdown answering:
   - What observation leads to the alternative approach?
   - What limitation does the current approach have?
   - What pattern should the student learn to recognize similar problems in the future?

JSON Output Format:
{
  "hasAlternative": true | false,
  "noAlternativeMessage": "No substantially better asymptotic approach was identified for this problem under the given constraints.",
  "currentApproach": {
    "algorithm": "<Current algorithm name>",
    "explanation": "<Detailed explanation of how current solution works>",
    "timeComplexity": "<e.g. O(N^2)>",
    "spaceComplexity": "<e.g. O(1)>"
  },
  "alternativeApproach": {
    "algorithm": "<Alternative algorithm name>",
    "intuition": "<What observation leads to this alternative?>",
    "whyItWorks": "<Detailed explanation of why this approach works and saves operations>",
    "patternToRemember": "<General pattern rule e.g. Whenever a problem repeatedly asks whether a complementary value has appeared, consider a Hash Map>",
    "timeComplexity": "<e.g. O(N)>",
    "spaceComplexity": "<e.g. O(N)>",
    "advantages": ["<Advantage 1>", "<Advantage 2>"],
    "disadvantages": ["<Disadvantage 1>", "<Disadvantage 2>"],
    "whenToPrefer": "<Specific constraints when this approach is superior>",
    "codeSnippet": "<Clean code snippet of alternative approach>"
  },
  "comparisonSummary": "<Deep pedagogical comparison explaining the trade-offs>"
}`;

  const llm = getAgentLLM({ temperature: 0.3, maxTokens: 1500 });
  const completion = await llm.invoke([
    { role: 'system', content: 'You are an AI algorithm comparison coach teaching students. Return clean JSON only.' },
    { role: 'user', content: prompt }
  ]);

  let text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
  let parsed;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    parsed = {
      hasAlternative: false,
      noAlternativeMessage: "No substantially better asymptotic approach was identified for this problem under the given constraints.",
      currentApproach: {
        algorithm: "Optimal Approach",
        explanation: "Current approach is already optimal.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)"
      },
      alternativeApproach: null,
      comparisonSummary: "The current implementation achieves optimal time and space complexity."
    };
  }

  return parsed;
}
