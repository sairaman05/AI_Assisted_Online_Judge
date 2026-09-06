import Submission from '../../../models/submission.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Helper to locate source code from DB or compiler submissions directory if needed
 */
async function retrieveSourceCode(submission) {
  if (submission.code && submission.code.trim().length > 0) {
    return submission.code;
  }

  // Fallback to reading file from compiler/submissions directory if available
  try {
    const format = submission.language || 'py';
    const filePath = path.resolve(`../compiler/submissions/${submission.submissionId}.${format}`);
    const diskCode = await fs.readFile(filePath, 'utf-8');
    return diskCode;
  } catch {
    return "# Source code unavailable in storage";
  }
}

/**
 * MCP Tool: get_submission
 * Retrieves detailed submission data for a user submission.
 */
export async function getSubmissionTool({ submissionId }) {
  if (!submissionId) {
    throw new Error("submissionId is required");
  }

  const submission = await Submission.findOne({ submissionId });
  if (!submission) {
    throw new Error(`Submission not found: ${submissionId}`);
  }

  const sourceCode = await retrieveSourceCode(submission);

  return {
    submissionId: submission.submissionId,
    problemId: submission.problem,
    userId: submission.user,
    username: submission.username,
    contestId: submission.contestId ? String(submission.contestId) : null,
    verdict: submission.result,
    score: submission.score,
    executionTime: submission.time || null,
    language: submission.language || 'py',
    sourceCode,
    errorDetails: submission.errorDetails || "",
    submittedAt: submission.submittedAt,
  };
}

/**
 * MCP Tool: get_submission_test_results
 * Retrieves test results and error telemetry without exposing hidden testcases.
 */
export async function getSubmissionTestResultsTool({ submissionId }) {
  if (!submissionId) {
    throw new Error("submissionId is required");
  }

  const submission = await Submission.findOne({ submissionId });
  if (!submission) {
    throw new Error(`Submission not found: ${submissionId}`);
  }

  // Sanitize any error logs
  let sanitizedError = submission.errorDetails || "";
  if (sanitizedError.length > 500) {
    sanitizedError = sanitizedError.substring(0, 500) + "... [truncated]";
  }

  const isPassed = submission.result === 'Accepted';

  return {
    submissionId: submission.submissionId,
    verdict: submission.result,
    executionTime: submission.time || null,
    isPassed,
    sanitizedFailureReason: isPassed ? "None" : (submission.result || "Wrong Answer"),
    telemetry: {
      hasRuntimeError: submission.result === 'Runtime Error' || sanitizedError.toLowerCase().includes('traceback') || sanitizedError.toLowerCase().includes('exception'),
      hasCompileError: submission.result === 'Compilation Error' || sanitizedError.toLowerCase().includes('error:'),
      hasTimeout: submission.result === 'Time Limit Exceeded' || sanitizedError.toLowerCase().includes('timed out'),
      errorMessage: sanitizedError
    }
  };
}

/**
 * MCP Tool: get_submission_history
 * Retrieves recent submissions by a user for a problem.
 */
export async function getSubmissionHistoryTool({ userId, problemId, limit = 5 }) {
  if (!userId || !problemId) {
    throw new Error("userId and problemId are required");
  }

  const history = await Submission.find({ user: userId, problem: problemId })
    .sort({ submittedAt: -1 })
    .limit(Math.min(limit, 10))
    .select('submissionId problem user score result time language submittedAt');

  return {
    totalSubmissions: history.length,
    submissions: history.map(s => ({
      submissionId: s.submissionId,
      verdict: s.result,
      score: s.score,
      time: s.time,
      language: s.language,
      submittedAt: s.submittedAt
    }))
  };
}

export const submissionToolDefs = [
  {
    name: "get_submission",
    description: "Retrieve submission source code, language, status, and execution metrics.",
    inputSchema: {
      type: "object",
      properties: {
        submissionId: { type: "string", description: "The submission UUID" }
      },
      required: ["submissionId"]
    }
  },
  {
    name: "get_submission_test_results",
    description: "Retrieve sanitized test execution results and failure telemetry for a submission without exposing hidden testcases.",
    inputSchema: {
      type: "object",
      properties: {
        submissionId: { type: "string", description: "The submission UUID" }
      },
      required: ["submissionId"]
    }
  },
  {
    name: "get_submission_history",
    description: "Retrieve recent submission history for a specific user and problem.",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user ID" },
        problemId: { type: "string", description: "The problem ID" },
        limit: { type: "number", description: "Number of past submissions to fetch (default: 5)" }
      },
      required: ["userId", "problemId"]
    }
  }
];
