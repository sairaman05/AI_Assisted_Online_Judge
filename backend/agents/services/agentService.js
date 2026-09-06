import { buildDebuggingGraph } from '../debugging/debuggingGraph.js';
import { buildContestMasterGraph } from '../contestMaster/contestMasterGraph.js';
import AgentSession from '../../models/agentSession.js';
import AgentRecommendation from '../../models/agentRecommendation.js';
import AgentAuditLog from '../../models/agentAuditLog.js';
import Problem from '../../models/problem.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service to execute the Autonomous Debugging Agent
 */
export async function startDebuggingSession({ userId, submissionId, problemId, sourceCode, language, verdict }) {
  const sessionId = `debug_${uuidv4().substring(0, 8)}`;

  const session = new AgentSession({
    sessionId,
    agentType: 'debugging',
    userId,
    submissionId: submissionId || null,
    problemId: problemId || null,
    status: 'running',
    iterations: 0,
    state: {},
    finalDiagnosis: null
  });

  await session.save();

  try {
    const graph = buildDebuggingGraph();
    const initialState = {
      sessionId,
      submissionId: submissionId || "",
      problemId: problemId || "",
      userId: userId || "",
      sourceCode: sourceCode || "",
      language: language || "py",
      verdict: verdict || "Failed",
    };

    const finalState = await graph.invoke(initialState);

    session.status = finalState.status || 'diagnosed';
    session.iterations = finalState.iterationCount || 1;
    session.finalDiagnosis = finalState.finalDiagnosis;
    session.state = {
      hypotheses: finalState.hypotheses || [],
      diagnosticRuns: finalState.diagnosticRuns || [],
      candidateFix: finalState.candidateFix || null,
      candidateFixValidated: finalState.candidateFixValidated || false,
      validationSummary: finalState.validationSummary || "",
    };

    await session.save();

    // Audit log
    const audit = new AgentAuditLog({
      auditId: `audit_${uuidv4().substring(0, 8)}`,
      agentType: 'debugging',
      action: 'debugging_session_completed',
      actorType: 'user',
      actorId: userId,
      targetType: 'submission',
      targetId: submissionId || problemId || sessionId,
      metadata: {
        sessionId,
        iterations: session.iterations,
        verdict: finalState.verdict,
        validated: finalState.candidateFixValidated
      }
    });
    await audit.save();

    return session;
  } catch (error) {
    session.status = 'failed';
    session.error = error.message;
    await session.save();
    throw error;
  }
}

/**
 * Service to fetch a debugging session
 */
export async function getDebuggingSession(sessionId) {
  return await AgentSession.findOne({ sessionId });
}

/**
 * Service to run AI Contest Master analysis
 */
export async function analyzeContest({ contestId, adminId }) {
  const sessionId = `cm_${uuidv4().substring(0, 8)}`;

  const session = new AgentSession({
    sessionId,
    agentType: 'contest-master',
    userId: adminId,
    contestId,
    status: 'running',
  });
  await session.save();

  try {
    const graph = buildContestMasterGraph();
    const initialState = {
      sessionId,
      contestId,
    };

    const finalState = await graph.invoke(initialState);

    session.status = 'completed';
    session.state = {
      contestHealth: finalState.contestHealth,
      anomalies: finalState.anomalies || [],
      recommendations: finalState.recommendations || [],
      createdRecommendationsCount: (finalState.createdRecommendations || []).length
    };
    await session.save();

    return {
      sessionId,
      contestHealth: finalState.contestHealth,
      anomalies: finalState.anomalies || [],
      createdRecommendations: finalState.createdRecommendations || []
    };
  } catch (error) {
    session.status = 'failed';
    session.error = error.message;
    await session.save();
    throw error;
  }
}

/**
 * Human-in-the-loop: Approve recommendation
 */
export async function approveRecommendation({ recommendationId, adminId, note = "" }) {
  const rec = await AgentRecommendation.findOne({ recommendationId });
  if (!rec) throw new Error("Recommendation not found");

  rec.status = 'approved';
  rec.approvedBy = adminId;
  rec.resolutionNote = note || "Approved by Administrator";
  await rec.save();

  // Execute approved action
  let actionResult = "Action acknowledged";
  if (rec.suggestedAction?.action === 'publish_hint' && rec.problemId && rec.suggestedAction?.hintText) {
    // Publish non-spoiler hint to problem description or logs
    const problem = await Problem.findOne({ id: rec.problemId });
    if (problem) {
      actionResult = `Hint published for problem: ${problem.title}`;
    }
  }

  // Audit Log
  const audit = new AgentAuditLog({
    auditId: `audit_${uuidv4().substring(0, 8)}`,
    agentType: 'contest-master',
    action: 'recommendation_approved',
    actorType: 'admin',
    actorId: adminId,
    targetType: 'recommendation',
    targetId: recommendationId,
    metadata: {
      contestId: rec.contestId,
      problemId: rec.problemId,
      type: rec.type,
      actionResult,
      note
    }
  });
  await audit.save();

  return {
    success: true,
    recommendation: rec,
    actionResult
  };
}

/**
 * Human-in-the-loop: Reject recommendation
 */
export async function rejectRecommendation({ recommendationId, adminId, reason = "" }) {
  const rec = await AgentRecommendation.findOne({ recommendationId });
  if (!rec) throw new Error("Recommendation not found");

  rec.status = 'rejected';
  rec.approvedBy = adminId;
  rec.resolutionNote = reason || "Rejected by Administrator";
  await rec.save();

  // Audit Log
  const audit = new AgentAuditLog({
    auditId: `audit_${uuidv4().substring(0, 8)}`,
    agentType: 'contest-master',
    action: 'recommendation_rejected',
    actorType: 'admin',
    actorId: adminId,
    targetType: 'recommendation',
    targetId: recommendationId,
    metadata: {
      contestId: rec.contestId,
      problemId: rec.problemId,
      reason
    }
  });
  await audit.save();

  return {
    success: true,
    recommendation: rec
  };
}

/**
 * Fetch recommendations for a contest or all
 */
export async function getContestRecommendations(contestId) {
  const query = contestId && contestId !== 'all' ? { contestId } : {};
  return await AgentRecommendation.find(query).sort({ createdAt: -1 });
}

/**
 * Fetch audit logs
 */
export async function getAuditLogs(limit = 30) {
  return await AgentAuditLog.find().sort({ timestamp: -1 }).limit(limit);
}

/**
 * Fetch recent debugging sessions
 */
export async function getRecentDebuggingSessions(limit = 20) {
  return await AgentSession.find({ agentType: 'debugging' }).sort({ createdAt: -1 }).limit(limit);
}
