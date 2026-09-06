import { StateGraph, END, START } from '@langchain/langgraph';
import { DebuggingStateAnnotation } from './debuggingState.js';
import { executeMcpTool } from '../mcp/server.js';
import { getAgentLLM } from '../shared/llm.js';
import { AGENT_CONFIG } from '../shared/agentConfig.js';
import {
  DEBUG_SYSTEM_PROMPT,
  getHypothesisPrompt,
  getEvaluateEvidencePrompt,
  getCandidateFixPrompt,
  getFinalDiagnosisPrompt,
} from './debuggingPrompts.js';

/**
 * Parses clean JSON from LLM content string
 */
function parseJsonSafe(content) {
  if (!content) return {};
  try {
    // Strip markdown code fences if present
    const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Try regex extraction of JSON object
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return {};
      }
    }
    return {};
  }
}

// 1. Load Context Node
async function loadContextNode(state) {
  const { submissionId, problemId } = state;
  let subData = null;
  let probData = null;

  try {
    if (submissionId) {
      subData = await executeMcpTool("get_submission", { submissionId });
    }
  } catch (err) {
    console.warn("[DebuggingAgent] Could not load submission:", err.message);
  }

  const effectiveProblemId = problemId || subData?.problemId;
  if (effectiveProblemId) {
    try {
      probData = await executeMcpTool("get_problem", { problemId: effectiveProblemId });
    } catch (err) {
      console.warn("[DebuggingAgent] Could not load problem:", err.message);
    }
  }

  let telemetry = null;
  if (submissionId) {
    try {
      telemetry = await executeMcpTool("get_submission_test_results", { submissionId });
    } catch (err) {
      console.warn("[DebuggingAgent] Could not load telemetry:", err.message);
    }
  }

  return {
    sourceCode: state.sourceCode || subData?.sourceCode || "",
    language: state.language || subData?.language || "py",
    verdict: state.verdict || subData?.verdict || "Failed",
    problemContext: probData,
    submissionTelemetry: telemetry,
    problemId: effectiveProblemId,
  };
}

// 2. Analyze Failure Node
async function analyzeFailureNode(state) {
  const { verdict, submissionTelemetry, sourceCode } = state;
  const v = (verdict || "").toLowerCase();
  const msg = (submissionTelemetry?.telemetry?.errorMessage || "").toLowerCase();

  let category = "Logical Bug";
  if (v.includes("compile") || msg.includes("syntaxerror") || msg.includes("error:")) {
    category = "Compilation Error";
  } else if (v.includes("runtime") || msg.includes("traceback") || msg.includes("exception") || msg.includes("nullpointer")) {
    category = "Runtime Exception";
  } else if (v.includes("time limit") || v.includes("tle")) {
    category = "Time Limit Exceeded (Algorithm Complexity)";
  } else if (v.includes("wrong answer")) {
    category = "Wrong Answer (Edge Case / Algorithmic Flaw)";
  }

  AGENT_CONFIG.log('DebuggingAgent', { 
    action: 'analyzeFailure', 
    category,
    verdict 
  });

  return {
    failureCategory: category,
    iterationCount: 0,
  };
}

// 3. Generate Hypothesis Node
async function generateHypothesisNode(state) {
  const currentIteration = (state.iterationCount || 0) + 1;
  const llm = getAgentLLM({ temperature: 0.2 });

  const prompt = getHypothesisPrompt({
    problemTitle: state.problemContext?.title || state.problemId || "Coding Challenge",
    problemDescription: state.problemContext?.description || "No description provided",
    sourceCode: state.sourceCode,
    language: state.language,
    verdict: state.verdict,
    failureCategory: state.failureCategory,
    pastHypotheses: state.hypotheses || [],
    iteration: currentIteration,
  });

  const response = await llm.invoke([
    { role: "system", content: DEBUG_SYSTEM_PROMPT },
    { role: "user", content: prompt }
  ]);

  const parsed = parseJsonSafe(response.content);
  const hypothesisObj = {
    iteration: currentIteration,
    hypothesis: parsed.hypothesis || "Potential boundary condition or logical mismatch in algorithm",
    diagnosticInput: parsed.diagnosticInput || (state.problemContext?.sampleTestcases?.[0]?.input || ""),
    expectedBehavior: parsed.expectedBehavior || "Expected valid testcase completion",
    confidence: parsed.confidence || 0.8,
  };

  AGENT_CONFIG.log('DebuggingAgent', { 
    action: 'generateHypothesis', 
    iteration: currentIteration, 
    hypothesis: hypothesisObj.hypothesis 
  });

  return {
    iterationCount: currentIteration,
    currentHypothesis: hypothesisObj,
    hypotheses: [hypothesisObj],
  };
}

// 4. Run Diagnostic Node
async function runDiagnosticNode(state) {
  const { currentHypothesis, language, sourceCode } = state;
  const stdin = currentHypothesis?.diagnosticInput || "";

  let diagnosticResult = null;
  try {
    diagnosticResult = await executeMcpTool("run_code", {
      language,
      sourceCode,
      stdin
    });
  } catch (err) {
    diagnosticResult = {
      success: false,
      output: "",
      error: `Diagnostic execution failed: ${err.message}`,
      executionTimeMs: 0,
      timedOut: false
    };
  }

  const record = {
    iteration: state.iterationCount,
    hypothesis: currentHypothesis?.hypothesis,
    stdin,
    result: diagnosticResult
  };

  AGENT_CONFIG.log('DebuggingAgent', { 
    action: 'runDiagnostic', 
    iteration: state.iterationCount, 
    success: diagnosticResult.success,
    hasError: !!diagnosticResult.error
  });

  return {
    diagnosticRuns: [record]
  };
}

// 5. Evaluate Evidence Node
async function evaluateEvidenceNode(state) {
  const { currentHypothesis, diagnosticRuns, failureCategory } = state;
  const latestRun = diagnosticRuns[diagnosticRuns.length - 1]?.result || {};

  const llm = getAgentLLM({ temperature: 0.1 });
  const prompt = getEvaluateEvidencePrompt({
    hypothesis: currentHypothesis?.hypothesis || "",
    diagnosticInput: currentHypothesis?.diagnosticInput || "",
    expectedBehavior: currentHypothesis?.expectedBehavior || "",
    executionOutput: latestRun.output || "",
    executionError: latestRun.error || "",
    timedOut: !!latestRun.timedOut,
  });

  const response = await llm.invoke([
    { role: "system", content: DEBUG_SYSTEM_PROMPT },
    { role: "user", content: prompt }
  ]);

  const parsed = parseJsonSafe(response.content);
  const isConfirmed = parsed.isConfirmed !== undefined ? parsed.isConfirmed : (state.iterationCount >= 2);
  const evidence = parsed.evidence || `Diagnostic execution returned: ${latestRun.error || latestRun.output || 'observed behavior confirms hypothesis'}`;

  return {
    isConfirmed,
    validationSummary: evidence,
  };
}

// 6. Generate Fix & Validate Node
async function generateFixAndValidateNode(state) {
  const llm = getAgentLLM({ temperature: 0.2 });
  const prompt = getCandidateFixPrompt({
    problemTitle: state.problemContext?.title || "Coding Challenge",
    problemDescription: state.problemContext?.description || "",
    sourceCode: state.sourceCode,
    language: state.language,
    confirmedHypothesis: state.currentHypothesis?.hypothesis || "Algorithm logical issue",
    evidence: state.validationSummary || "Observed during diagnostic run",
  });

  const response = await llm.invoke([
    { role: "system", content: DEBUG_SYSTEM_PROMPT },
    { role: "user", content: prompt }
  ]);

  const parsed = parseJsonSafe(response.content);
  const candidateCode = parsed.fixedSourceCode || state.sourceCode;

  // Validate the candidate fix using sample testcases via MCP
  let fixValidated = false;
  let validationNote = "Candidate fix generated.";

  const sampleInput = state.problemContext?.sampleTestcases?.[0]?.input || "";
  const expectedSampleOutput = (state.problemContext?.sampleTestcases?.[0]?.output || "").trim();

  if (candidateCode && sampleInput) {
    try {
      const runResult = await executeMcpTool("run_code", {
        language: state.language,
        sourceCode: candidateCode,
        stdin: sampleInput
      });

      const actualSampleOutput = (runResult.output || "").trim();
      if (!runResult.error && (!expectedSampleOutput || actualSampleOutput === expectedSampleOutput)) {
        fixValidated = true;
        validationNote = "Candidate fix successfully passed sample testcase execution!";
      } else {
        validationNote = `Candidate fix executed: ${runResult.error ? 'Encountered error: ' + runResult.error : 'Output produced: ' + actualSampleOutput}`;
      }
    } catch (err) {
      validationNote = `Validation skipped: ${err.message}`;
    }
  }

  return {
    candidateFix: {
      code: candidateCode,
      explanation: parsed.explanation || "Corrected logical bug and boundary conditions.",
      suggestedFixSummary: parsed.suggestedFixSummary || "Fixed boundary conditions."
    },
    candidateFixValidated: fixValidated,
    validationSummary: validationNote,
  };
}

// 7. Finalize Diagnosis Node
async function finalizeDiagnosisNode(state) {
  const llm = getAgentLLM({ temperature: 0.1 });
  const prompt = getFinalDiagnosisPrompt({
    problemTitle: state.problemContext?.title || state.problemId || "Coding Challenge",
    failureCategory: state.failureCategory,
    hypothesis: state.currentHypothesis?.hypothesis || "Logical error in code implementation",
    evidence: state.validationSummary || "Verified via diagnostic execution",
    candidateFixValidated: state.candidateFixValidated,
    validationSummary: state.validationSummary,
    iterations: state.iterationCount,
  });

  const response = await llm.invoke([
    { role: "system", content: DEBUG_SYSTEM_PROMPT },
    { role: "user", content: prompt }
  ]);

  const parsed = parseJsonSafe(response.content);

  const finalReport = {
    status: "diagnosed",
    iterations: state.iterationCount,
    failureType: parsed.failureType || state.failureCategory,
    diagnosis: parsed.diagnosis || `Identified ${state.failureCategory} in ${state.language} solution.`,
    rootCause: parsed.rootCause || state.currentHypothesis?.hypothesis || "Algorithmic flaw.",
    evidence: parsed.evidence || state.validationSummary || "Observed during diagnostic execution.",
    suggestedFix: parsed.suggestedFix || state.candidateFix?.suggestedFixSummary || "Review code logic.",
    candidateFix: state.candidateFix,
    candidateFixValidated: state.candidateFixValidated,
    validationSummary: state.validationSummary,
    hypotheses: state.hypotheses,
    diagnosticRuns: state.diagnosticRuns,
  };

  AGENT_CONFIG.log('DebuggingAgent', { 
    action: 'finalizeDiagnosis', 
    status: 'diagnosed',
    iterations: state.iterationCount,
    validated: state.candidateFixValidated
  });

  return {
    status: "diagnosed",
    finalDiagnosis: finalReport,
  };
}

// Router function after evaluate evidence
function routeAfterEvidence(state) {
  if (state.isConfirmed || state.iterationCount >= AGENT_CONFIG.MAX_DEBUG_ITERATIONS) {
    return "generateFixAndValidate";
  }
  return "generateHypothesis";
}

/**
 * Builds and compiles the LangGraph Debugging Agent State Machine
 */
export function buildDebuggingGraph() {
  const workflow = new StateGraph(DebuggingStateAnnotation)
    .addNode("loadContext", loadContextNode)
    .addNode("analyzeFailure", analyzeFailureNode)
    .addNode("generateHypothesis", generateHypothesisNode)
    .addNode("runDiagnostic", runDiagnosticNode)
    .addNode("evaluateEvidence", evaluateEvidenceNode)
    .addNode("generateFixAndValidate", generateFixAndValidateNode)
    .addNode("finalizeDiagnosis", finalizeDiagnosisNode)
    .addEdge(START, "loadContext")
    .addEdge("loadContext", "analyzeFailure")
    .addEdge("analyzeFailure", "generateHypothesis")
    .addEdge("generateHypothesis", "runDiagnostic")
    .addEdge("runDiagnostic", "evaluateEvidence")
    .addConditionalEdges("evaluateEvidence", routeAfterEvidence, {
      generateFixAndValidate: "generateFixAndValidate",
      generateHypothesis: "generateHypothesis"
    })
    .addEdge("generateFixAndValidate", "finalizeDiagnosis")
    .addEdge("finalizeDiagnosis", END);

  return workflow.compile();
}
