import { getAgentLLM } from '../agents/shared/llm.js';

/**
 * Timed Progressive AI Hint Service (2 / 4 / 6 / 8 / 10 Minutes, Max 5 Hints)
 * Generates dynamic, non-repetitive hints based on cumulative session time thresholds and current user code.
 */
export async function generateTimedProgressiveHint({
  problemTitle,
  problemDescription,
  constraints,
  examples,
  userCode,
  language,
  hintLevel = 1,
  previousHints = []
}) {
  const levelGuides = {
    1: "Level 1 (2 Minutes): Give conceptual direction without revealing the algorithm completely.",
    2: "Level 2 (4 Minutes): Identify the relevant algorithmic pattern or key data structure.",
    3: "Level 3 (6 Minutes): Connect that pattern to the user's current code and logical reasoning.",
    4: "Level 4 (8 Minutes): Explain the key structural correction or algorithmic insight required.",
    5: "Level 5 (10 Minutes): Provide near-solution guidance or pseudocode without dumping the complete code."
  };

  const currentLevel = Math.min(Math.max(Number(hintLevel) || 1, 1), 5);

  const prompt = `You are an expert competitive programming mentor.

Analyze the actual problem and the user's current code.
You have access to previous hints already given to this user.

PROBLEM TITLE: ${problemTitle || 'Algorithmic Problem'}
PROBLEM DESCRIPTION:
${problemDescription || ''}

CONSTRAINTS:
${constraints || 'Standard constraints'}

USER LANGUAGE: ${language || 'python'}
CURRENT USER CODE:
\`\`\`${language || 'python'}
${userCode || '# No code written yet'}
\`\`\`

PREVIOUS HINTS GIVEN:
${JSON.stringify(previousHints)}

REQUESTED HINT LEVEL: Level ${currentLevel}
GUIDANCE FOR THIS LEVEL: ${levelGuides[currentLevel]}

CRITICAL INSTRUCTIONS:
1. Analyze the user's ACTUAL code against the problem requirements.
2. The new hint MUST add new information.
3. NEVER repeat or merely paraphrase a previous hint.
4. DO NOT provide generic advice such as "think carefully". Reference exact logic or constraints.
5. Every hint must be grounded in the actual problem and user's code.

JSON Output Format:
{
  "hintLevel": ${currentLevel},
  "title": "<Short Level Title e.g. Level ${currentLevel}: Conceptual Pattern>",
  "hint": "<Direct, constructive educational hint text>",
  "keyConcept": "<Key concept name e.g. Two Pointers / Dynamic Programming / Hash Map>"
}`;

  const llm = getAgentLLM({ temperature: 0.3, maxTokens: 500 });
  const completion = await llm.invoke([
    { role: 'system', content: 'You are an AI competitive programming tutor. Return clean JSON only.' },
    { role: 'user', content: prompt }
  ]);

  let text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
  let parsed;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    parsed = {
      hintLevel: currentLevel,
      title: `Level ${currentLevel} Hint`,
      hint: text.replace(/```json|```/g, '').trim() || "Consider using a Hash Table or Two Pointer approach to optimize time complexity.",
      keyConcept: "Algorithmic Reasoning"
    };
  }

  return parsed;
}
