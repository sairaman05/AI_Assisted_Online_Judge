/**
 * Prompts for the Autonomous Code Debugging Agent
 */

export const DEBUG_SYSTEM_PROMPT = `You are the FIASCOde Autonomous Code Debugging Agent.
Your job is to diagnose why a code submission failed in an Online Judge environment through iterative hypothesis testing and diagnostic verification.
You MUST output ONLY valid JSON without Markdown code fences, chain-of-thought, or surrounding conversation.`;

export function getHypothesisPrompt({ problemTitle, problemDescription, sourceCode, language, verdict, failureCategory, pastHypotheses, iteration }) {
  return `Problem: ${problemTitle}
Description: ${problemDescription}

Language: ${language}
Submitted Source Code:
\`\`\`${language}
${sourceCode}
\`\`\`

Reported Failure Verdict: ${verdict}
Failure Category: ${failureCategory}
Current Iteration: ${iteration} of 5

Previous Tested Hypotheses:
${pastHypotheses.length > 0 ? JSON.stringify(pastHypotheses, null, 2) : "None yet"}

Formulate a new, precise debugging hypothesis explaining the bug.
Also generate a specific minimal diagnostic standard input string (stdin) that would trigger and verify this hypothesis when executed.

Respond ONLY with valid JSON in this exact structure:
{
  "hypothesis": "Concise 1-2 sentence hypothesis explaining the exact bug mechanism",
  "diagnosticInput": "Specific stdin string to test this bug",
  "expectedBehavior": "Expected stdout or behavior for this input",
  "confidence": 0.85
}`;
}

export function getEvaluateEvidencePrompt({ hypothesis, diagnosticInput, expectedBehavior, executionOutput, executionError, timedOut }) {
  return `Tested Hypothesis: "${hypothesis}"
Diagnostic Stdin: "${diagnosticInput}"
Expected Behavior: "${expectedBehavior}"

Actual Execution Results:
Stdout: "${executionOutput || ''}"
Stderr/Error: "${executionError || ''}"
TimedOut: ${timedOut}

Determine if this execution evidence confirms the hypothesis or if the bug is caused by something else.

Respond ONLY with valid JSON in this exact structure:
{
  "isConfirmed": true,
  "evidence": "Concise summary of what the execution output proved",
  "confidence": 0.90
}`;
}

export function getCandidateFixPrompt({ problemTitle, problemDescription, sourceCode, language, confirmedHypothesis, evidence }) {
  return `Problem: ${problemTitle}
Description: ${problemDescription}
Language: ${language}

Original Buggy Code:
\`\`\`${language}
${sourceCode}
\`\`\`

Confirmed Root Cause: "${confirmedHypothesis}"
Evidence: "${evidence}"

Generate the complete corrected source code that fixes this bug while strictly preserving the problem's signature, logic, and constraints.

Respond ONLY with valid JSON in this exact structure:
{
  "fixedSourceCode": "Complete corrected source code here",
  "explanation": "Brief explanation of the changes made",
  "suggestedFixSummary": "1-2 sentence description of the fix"
}`;
}

export function getFinalDiagnosisPrompt({ problemTitle, failureCategory, hypothesis, evidence, candidateFixValidated, validationSummary, iterations }) {
  return `Problem: ${problemTitle}
Failure Category: ${failureCategory}
Root Cause Hypothesis: "${hypothesis}"
Evidence: "${evidence}"
Candidate Fix Validated: ${candidateFixValidated}
Validation Summary: "${validationSummary}"
Total Iterations: ${iterations}

Synthesize a final, structured diagnostic report for the user.

Respond ONLY with valid JSON in this exact structure:
{
  "status": "diagnosed",
  "diagnosis": "Clear explanation of what went wrong in the user's code",
  "rootCause": "The core technical reason for the failure",
  "failureType": "${failureCategory}",
  "evidence": "${evidence}",
  "suggestedFix": "Concrete suggestion for the programmer",
  "candidateFixValidated": ${candidateFixValidated}
}`;
}
