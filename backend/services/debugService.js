import { getAgentLLM } from '../agents/shared/llm.js';

/**
 * Wrong Submission AI Debugger Service
 * Analyzes failed compiler/judge submissions dynamically.
 */
export async function analyzeFailedSubmission({
  problemTitle,
  problemDescription,
  constraints,
  userCode,
  language,
  verdict,
  errorLog,
  expectedOutput,
  actualOutput,
  testcaseInfo,
  provideCodeFix = false
}) {
  const categories = [
    "Syntax Error",
    "Compilation Error",
    "Runtime Exception",
    "Incorrect Logic",
    "Wrong Algorithm",
    "Unhandled Edge Case",
    "Boundary Condition Failure",
    "Incorrect Loop Condition",
    "Data Structure Misuse",
    "Integer Overflow / Type Mismatch",
    "Recursion Stack Overflow",
    "Incorrect Initialization",
    "Duplicate Handling Flaw",
    "Flawed Sorting Assumption",
    "Indexing Error (Off-by-One)",
    "Time Limit Exceeded (TLE)",
    "Memory Limit Exceeded"
  ];

  const prompt = `You are a Senior Debugging Engineer analyzing a FAILED submission on an Online Judge.

PROBLEM TITLE: ${problemTitle || 'Coding Problem'}
PROBLEM DESCRIPTION:
${problemDescription || ''}

CONSTRAINTS:
${constraints || 'N/A'}

SUBMISSION VERDICT: ${verdict || 'Wrong Answer'}
LANGUAGE: ${language || 'python'}
COMPILER/RUNTIME LOG:
${errorLog || 'None'}

FAILED TESTCASE INFO:
${JSON.stringify(testcaseInfo || {})}

EXPECTED OUTPUT: ${expectedOutput || 'N/A'}
ACTUAL OUTPUT: ${actualOutput || 'N/A'}

SUBMITTED USER CODE:
\`\`\`${language || 'python'}
${userCode}
\`\`\`

INSTRUCTIONS:
1. Analyze the user's ACTUAL code line-by-line against the compiler/judge error and testcase failure.
2. Select the EXACT matching category from this list: ${JSON.stringify(categories)}.
3. Fill out the structured analysis JSON:
{
  "category": "<One of the 17 categories listed>",
  "where": "<Specific line number or function block where the bug occurs>",
  "why": "<Technical explanation of why it failed>",
  "currentBehavior": "<What the current code is doing>",
  "expectedBehavior": "<What the code SHOULD be doing>",
  "progressiveHint": "<Constructive guidance to help fix the bug without giving full code>",
  "correctedLogic": ${provideCodeFix ? '"<Corrected code snippet with explanation>"' : 'null'}
}`;

  const llm = getAgentLLM({ temperature: 0.3, maxTokens: 500 });
  const completion = await llm.invoke([
    { role: 'system', content: 'You are an AI code debugger. Output clean JSON matching the schema.' },
    { role: 'user', content: prompt }
  ]);

  let text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
  let parsed;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    parsed = {
      category: "Incorrect Logic",
      where: "Main logic loop",
      why: "The output produced by the code does not match the judge's expected testcase results.",
      currentBehavior: "Executing code with current logic.",
      expectedBehavior: "Handling edge cases and array bounds properly.",
      progressiveHint: "Check your loop bounds and comparison operators for potential off-by-one errors.",
      correctedLogic: null
    };
  }

  return parsed;
}
