import { StateGraph, END, START } from '@langchain/langgraph';
import { ContestMasterStateAnnotation } from './contestMasterState.js';
import { executeMcpTool } from '../mcp/server.js';
import { getAgentLLM } from '../shared/llm.js';
import { AGENT_CONFIG } from '../shared/agentConfig.js';
import AgentAuditLog from '../../models/agentAuditLog.js';
import { v4 as uuidv4 } from 'uuid';
import {
  CONTEST_MASTER_SYSTEM_PROMPT,
  getContestAnalysisPrompt,
} from './contestMasterPrompts.js';

function parseJsonSafe(content) {
  if (!content) return {};
  try {
    const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
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

// 1. Load Contest Node
async function loadContestNode(state) {
  const { contestId } = state;
  let metadata = null;
  try {
    metadata = await executeMcpTool("get_contest", { contestId });
  } catch (err) {
    console.warn(`[ContestMaster] Could not load contest: ${err.message}`);
  }

  return {
    contestMetadata: metadata,
  };
}

// 2. Collect Metrics Node
async function collectMetricsNode(state) {
  const { contestId, contestMetadata } = state;

  let contestStats = null;
  try {
    contestStats = await executeMcpTool("get_contest_statistics", { contestId });
  } catch (err) {
    console.warn("[ContestMaster] Error fetching contest stats:", err.message);
  }

  const problemStats = [];
  const problemIds = contestMetadata?.problems || [];

  for (const pid of problemIds) {
    try {
      const pStat = await executeMcpTool("get_problem_statistics", { contestId, problemId: pid });
      problemStats.push(pStat);
    } catch (err) {
      console.warn(`[ContestMaster] Error fetching problem stat for ${pid}:`, err.message);
    }
  }

  let leaderboard = null;
  try {
    leaderboard = await executeMcpTool("get_leaderboard", { contestId });
  } catch (err) {
    console.warn("[ContestMaster] Error fetching leaderboard:", err.message);
  }

  return {
    contestStats,
    problemStats,
    leaderboardStats: leaderboard,
  };
}

// 3. Detect Anomalies & Assess Health Node
async function detectAnomaliesNode(state) {
  const { contestMetadata, contestStats, problemStats, leaderboardStats } = state;

  const llm = getAgentLLM({ temperature: 0.1 });
  const prompt = getContestAnalysisPrompt({
    contestName: contestMetadata?.name || "Contest",
    contestStats,
    problemStats,
    leaderboardStats,
  });

  const response = await llm.invoke([
    { role: "system", content: CONTEST_MASTER_SYSTEM_PROMPT },
    { role: "user", content: prompt }
  ]);

  const parsed = parseJsonSafe(response.content);
  const health = parsed.contestHealth || "healthy";
  const detectedAnomalies = parsed.anomalies || [];

  AGENT_CONFIG.log('ContestMaster', { 
    action: 'detectAnomalies', 
    health,
    anomaliesCount: detectedAnomalies.length 
  });

  return {
    contestHealth: health,
    anomalies: detectedAnomalies,
    recommendations: detectedAnomalies,
  };
}

// 4. Generate Recommendations Node (Saves recommendations as pending for Admin review)
async function generateRecommendationsNode(state) {
  const { contestId, recommendations } = state;
  const created = [];

  for (const rec of (recommendations || [])) {
    try {
      const createdRec = await executeMcpTool("create_admin_recommendation", {
        contestId,
        problemId: rec.problemId || null,
        type: rec.type || "problem_issue",
        severity: rec.severity || "medium",
        reasoningSummary: rec.reasoning || "Anomaly detected by AI Contest Master",
        recommendation: rec.recommendation || "Review contest configuration",
        suggestedAction: rec.suggestedAction || {}
      });
      created.push(createdRec);
    } catch (err) {
      console.error("[ContestMaster] Failed to persist recommendation:", err);
    }
  }

  return {
    createdRecommendations: created,
  };
}

// 5. Audit Action Node
async function auditActionNode(state) {
  const { contestId, contestHealth, createdRecommendations } = state;

  try {
    const audit = new AgentAuditLog({
      auditId: `audit_${uuidv4().substring(0, 8)}`,
      agentType: "contest-master",
      action: "contest_analysis_completed",
      actorType: "system",
      actorId: "contest-master-agent",
      targetType: "contest",
      targetId: contestId,
      metadata: {
        contestHealth,
        recommendationsGenerated: createdRecommendations.length,
        timestamp: new Date().toISOString()
      }
    });

    await audit.save();
  } catch (err) {
    console.error("[ContestMaster] Failed to save audit log:", err);
  }

  return {
    status: "completed"
  };
}

/**
 * Builds and compiles the LangGraph Contest Master Agent State Machine
 */
export function buildContestMasterGraph() {
  const workflow = new StateGraph(ContestMasterStateAnnotation)
    .addNode("loadContest", loadContestNode)
    .addNode("collectMetrics", collectMetricsNode)
    .addNode("detectAnomalies", detectAnomaliesNode)
    .addNode("generateRecommendations", generateRecommendationsNode)
    .addNode("auditAction", auditActionNode)
    .addEdge(START, "loadContest")
    .addEdge("loadContest", "collectMetrics")
    .addEdge("collectMetrics", "detectAnomalies")
    .addEdge("detectAnomalies", "generateRecommendations")
    .addEdge("generateRecommendations", "auditAction")
    .addEdge("auditAction", END);

  return workflow.compile();
}
