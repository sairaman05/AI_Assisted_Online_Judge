import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  startDebuggingSession,
  getDebuggingSession,
  analyzeContest,
  getContestRecommendations,
  approveRecommendation,
  rejectRecommendation,
  getAuditLogs,
  getRecentDebuggingSessions
} from '../agents/services/agentService.js';
import Submission from '../models/submission.js';

const router = express.Router();

/**
 * POST /api/agents/debug
 * Starts an iterative autonomous debugging session on a submission or code
 */
router.post('/debug', authenticateToken, async (req, res) => {
  const { submissionId, problemId, sourceCode, language, verdict } = req.body;
  const userId = req.user.id;

  try {
    // If a submissionId is provided, verify ownership (or admin status)
    if (submissionId) {
      const sub = await Submission.findOne({ submissionId });
      if (sub && sub.user !== userId && req.user.type !== 'admin') {
        return res.status(403).json({ error: "Unauthorized: You can only debug your own submissions" });
      }
    }

    const session = await startDebuggingSession({
      userId,
      submissionId,
      problemId,
      sourceCode,
      language,
      verdict,
    });

    res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      status: session.status,
      iterations: session.iterations,
      finalDiagnosis: session.finalDiagnosis,
      state: session.state,
    });
  } catch (error) {
    console.error("[AgentRoute] Debugging session error:", error);
    res.status(500).json({ error: `Debugging failed: ${error.message}` });
  }
});

/**
 * GET /api/agents/debug/:sessionId
 * Retrieves status and full diagnostic report of a debugging session
 */
router.get('/debug/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = await getDebuggingSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: "Debugging session not found" });
    }

    // Check ownership or admin
    if (session.userId !== req.user.id && req.user.type !== 'admin') {
      return res.status(403).json({ error: "Unauthorized: Access forbidden" });
    }

    res.json({
      sessionId: session.sessionId,
      status: session.status,
      iterations: session.iterations,
      finalDiagnosis: session.finalDiagnosis,
      state: session.state,
      createdAt: session.createdAt,
    });
  } catch (error) {
    console.error("[AgentRoute] Fetch debug session error:", error);
    res.status(500).json({ error: `Failed to fetch session: ${error.message}` });
  }
});

/**
 * POST /api/agents/contest/:contestId/analyze
 * Triggers Contest Master anomaly detection and health assessment (Admin only)
 */
router.post('/contest/:contestId/analyze', authenticateToken, requireAdmin, async (req, res) => {
  const { contestId } = req.params;
  const adminId = req.user.id;

  try {
    const result = await analyzeContest({ contestId, adminId });
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("[AgentRoute] Contest Master analysis error:", error);
    res.status(500).json({ error: `Contest analysis failed: ${error.message}` });
  }
});

/**
 * GET /api/agents/contest/:contestId/recommendations
 * Retrieves all pending and past recommendations for a contest (Admin only)
 */
router.get('/contest/:contestId/recommendations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const recommendations = await getContestRecommendations(req.params.contestId);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch recommendations: ${error.message}` });
  }
});

/**
 * POST /api/agents/recommendations/:id/approve
 * Approves a recommendation and logs audit action (Admin only)
 */
router.post('/recommendations/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  const { note } = req.body;
  const adminId = req.user.id;

  try {
    const result = await approveRecommendation({
      recommendationId: req.params.id,
      adminId,
      note
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: `Approval failed: ${error.message}` });
  }
});

/**
 * POST /api/agents/recommendations/:id/reject
 * Rejects a recommendation with explanation and audit log (Admin only)
 */
router.post('/recommendations/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  const { reason } = req.body;
  const adminId = req.user.id;

  try {
    const result = await rejectRecommendation({
      recommendationId: req.params.id,
      adminId,
      reason
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: `Rejection failed: ${error.message}` });
  }
});

/**
 * GET /api/agents/audit
 * Retrieves recent audit logs for the AI Control Center (Admin only)
 */
router.get('/audit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await getAuditLogs(parseInt(req.query.limit) || 30);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch audit logs: ${error.message}` });
  }
});

/**
 * GET /api/agents/sessions
 * Retrieves recent agent sessions for admin overview (Admin only)
 */
router.get('/sessions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sessions = await getRecentDebuggingSessions(parseInt(req.query.limit) || 20);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch sessions: ${error.message}` });
  }
});

export default router;
