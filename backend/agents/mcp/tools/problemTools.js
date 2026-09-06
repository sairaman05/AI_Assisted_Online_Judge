import Problem from '../../../models/problem.js';

/**
 * MCP Tool: get_problem
 * Retrieves sanitized problem information without exposing hidden testcases.
 */
export async function getProblemTool({ problemId }) {
  if (!problemId) {
    throw new Error("problemId is required");
  }

  const problem = await Problem.findOne({ id: problemId });
  if (!problem) {
    throw new Error(`Problem not found for id: ${problemId}`);
  }

  // Only return at most first 2 public sample testcases, never expose the full/hidden testsuite
  const sampleTestcases = (problem.testcases || []).slice(0, 2).map((tc, idx) => ({
    sampleIndex: idx + 1,
    input: tc.input || "",
    output: tc.output || "",
  }));

  return {
    problemId: problem.id,
    title: problem.title,
    description: problem.description,
    score: problem.score,
    codeBase: problem.codeBase || "",
    constraintLimit: problem.constraintLimit || 0,
    sampleTestcases,
    totalTestcasesCount: (problem.testcases || []).length,
  };
}

export const getProblemToolDef = {
  name: "get_problem",
  description: "Retrieve sanitized problem details, constraints, description, and sample testcases without hidden testcases.",
  inputSchema: {
    type: "object",
    properties: {
      problemId: { type: "string", description: "The unique identifier of the problem" }
    },
    required: ["problemId"]
  }
};
