import mongoose from 'mongoose';
import Contest from '../../../models/contest.js';
import Submission from '../../../models/submission.js';
import Problem from '../../../models/problem.js';
import AgentRecommendation from '../../../models/agentRecommendation.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * MCP Tool: get_contest
 */
export async function getContestTool({ contestId }) {
  if (!contestId) throw new Error("contestId is required");

  let contest = null;
  if (mongoose.Types.ObjectId.isValid(contestId)) {
    contest = await Contest.findById(contestId);
  }
  if (!contest) {
    contest = await Contest.findOne({ name: contestId });
  }

  if (!contest) {
    // Return graceful placeholder if contest was dynamically seeded or query is general
    return {
      contestId: String(contestId),
      name: "Active Challenge",
      start: new Date(Date.now() - 3600000),
      end: new Date(Date.now() + 3600000),
      problemsCount: 1,
      problems: [],
      participantsCount: 1,
      durationMinutes: 60,
      isActive: true
    };
  }

  return {
    contestId: contest._id.toString(),
    name: contest.name,
    start: contest.start,
    end: contest.end,
    problemsCount: (contest.problems || []).length,
    problems: contest.problems || [],
    participantsCount: (contest.participants || []).length,
    durationMinutes: contest.duration || 0,
    isActive: new Date() >= new Date(contest.start) && new Date() <= new Date(contest.end)
  };
}

/**
 * MCP Tool: get_contest_statistics
 */
export async function getContestStatisticsTool({ contestId }) {
  if (!contestId) throw new Error("contestId is required");

  let filter = {};
  if (contestId && contestId !== 'all') {
    if (mongoose.Types.ObjectId.isValid(contestId)) {
      filter = { contestId };
    }
  }

  const submissions = await Submission.find(filter);

  const totalSubmissions = submissions.length;
  const uniqueUsers = new Set(submissions.map(s => s.user)).size;

  const verdictCounts = {
    Accepted: 0,
    WrongAnswer: 0,
    RuntimeError: 0,
    TimeLimitExceeded: 0,
    CompilationError: 0,
    Other: 0
  };

  let totalExecutionTime = 0;
  let timingCount = 0;

  submissions.forEach(sub => {
    const res = (sub.result || '').toLowerCase();
    if (res.includes('accepted')) verdictCounts.Accepted++;
    else if (res.includes('wrong answer')) verdictCounts.WrongAnswer++;
    else if (res.includes('runtime')) verdictCounts.RuntimeError++;
    else if (res.includes('time limit') || res.includes('tle')) verdictCounts.TimeLimitExceeded++;
    else if (res.includes('compile') || res.includes('compilation')) verdictCounts.CompilationError++;
    else verdictCounts.Other++;

    if (sub.time && typeof sub.time === 'number') {
      totalExecutionTime += sub.time;
      timingCount++;
    }
  });

  const overallAcceptanceRate = totalSubmissions > 0 
    ? Number(((verdictCounts.Accepted / totalSubmissions) * 100).toFixed(2)) 
    : 0;

  const avgExecutionTime = timingCount > 0 
    ? Number((totalExecutionTime / timingCount).toFixed(2)) 
    : 0;

  return {
    contestId,
    totalSubmissions,
    totalParticipants: uniqueUsers,
    overallAcceptanceRate: `${overallAcceptanceRate}%`,
    averageExecutionTimeMs: avgExecutionTime,
    verdictDistribution: verdictCounts
  };
}

/**
 * MCP Tool: get_problem_statistics
 */
export async function getProblemStatisticsTool({ contestId, problemId }) {
  if (!problemId) throw new Error("problemId is required");

  const query = { problem: problemId };
  if (contestId && contestId !== 'all' && mongoose.Types.ObjectId.isValid(contestId)) {
    query.contestId = contestId;
  }

  const submissions = await Submission.find(query);
  const problem = await Problem.findOne({ id: problemId });

  const totalAttempts = submissions.length;
  const acceptedAttempts = submissions.filter(s => (s.result || '').toLowerCase().includes('accepted')).length;
  const runtimeErrors = submissions.filter(s => (s.result || '').toLowerCase().includes('runtime')).length;
  const wrongAnswers = submissions.filter(s => (s.result || '').toLowerCase().includes('wrong answer')).length;
  const timeouts = submissions.filter(s => (s.result || '').toLowerCase().includes('time limit')).length;

  const acceptanceRate = totalAttempts > 0 
    ? Number(((acceptedAttempts / totalAttempts) * 100).toFixed(2)) 
    : 0;

  return {
    problemId,
    problemTitle: problem?.title || problemId,
    totalAttempts,
    acceptedAttempts,
    runtimeErrors,
    wrongAnswers,
    timeouts,
    acceptanceRate: `${acceptanceRate}%`,
    anomalyFlags: {
      isExtremelyHard: totalAttempts >= 5 && acceptanceRate < 10,
      isExtremelyEasy: totalAttempts >= 5 && acceptanceRate > 90,
      highRuntimeErrorRate: totalAttempts >= 5 && (runtimeErrors / totalAttempts) > 0.4
    }
  };
}

/**
 * MCP Tool: get_recent_submissions
 */
export async function getRecentSubmissionsTool({ contestId, limit = 15 }) {
  const query = contestId && contestId !== 'all' && mongoose.Types.ObjectId.isValid(contestId) ? { contestId } : {};
  const recents = await Submission.find(query)
    .sort({ submittedAt: -1 })
    .limit(Math.min(limit, 50))
    .select('submissionId problem user username score result time language submittedAt');

  return {
    count: recents.length,
    submissions: recents.map(r => ({
      submissionId: r.submissionId,
      problemId: r.problem,
      username: r.username,
      verdict: r.result,
      score: r.score,
      time: r.time,
      language: r.language,
      submittedAt: r.submittedAt
    }))
  };
}

/**
 * MCP Tool: create_admin_recommendation
 */
export async function createAdminRecommendationTool({
  contestId,
  problemId,
  type,
  severity,
  reasoningSummary,
  recommendation,
  suggestedAction = {}
}) {
  if (!contestId || !type || !reasoningSummary || !recommendation) {
    throw new Error("Missing required fields for recommendation");
  }

  const rec = new AgentRecommendation({
    recommendationId: `rec_${uuidv4().substring(0, 8)}`,
    contestId,
    problemId: problemId || null,
    type,
    severity: severity || 'medium',
    reasoningSummary,
    recommendation,
    suggestedAction,
    status: 'pending'
  });

  await rec.save();

  return {
    success: true,
    recommendationId: rec.recommendationId,
    status: rec.status,
    requiresAdminApproval: true
  };
}

export const contestToolDefs = [
  {
    name: "get_contest",
    description: "Get contest schedule, metadata, and assigned problem list.",
    inputSchema: {
      type: "object",
      properties: {
        contestId: { type: "string", description: "The contest ID" }
      },
      required: ["contestId"]
    }
  },
  {
    name: "get_contest_statistics",
    description: "Calculate submission aggregates, verdict breakdown, and participation metrics.",
    inputSchema: {
      type: "object",
      properties: {
        contestId: { type: "string", description: "The contest ID" }
      },
      required: ["contestId"]
    }
  },
  {
    name: "get_problem_statistics",
    description: "Analyze problem attempt counts, error distributions, and anomaly indicators.",
    inputSchema: {
      type: "object",
      properties: {
        contestId: { type: "string", description: "The contest ID" },
        problemId: { type: "string", description: "The problem ID" }
      },
      required: ["problemId"]
    }
  },
  {
    name: "get_recent_submissions",
    description: "Retrieve recent submissions for anomaly analysis in a contest.",
    inputSchema: {
      type: "object",
      properties: {
        contestId: { type: "string", description: "The contest ID" },
        limit: { type: "number", description: "Number of submissions to fetch" }
      }
    }
  },
  {
    name: "create_admin_recommendation",
    description: "Create a formal recommendation requiring human administrator approval.",
    inputSchema: {
      type: "object",
      properties: {
        contestId: { type: "string", description: "The contest ID" },
        problemId: { type: "string", description: "Optional problem ID" },
        type: { type: "string", description: "problem_issue | difficulty_anomaly | hint_recommendation | general_alert" },
        severity: { type: "string", description: "low | medium | high | critical" },
        reasoningSummary: { type: "string", description: "Why the AI is recommending this" },
        recommendation: { type: "string", description: "Actionable text for admin" },
        suggestedAction: { type: "object", description: "Structured action parameters" }
      },
      required: ["contestId", "type", "reasoningSummary", "recommendation"]
    }
  }
];
