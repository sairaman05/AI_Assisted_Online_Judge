import { getProblemTool, getProblemToolDef } from './tools/problemTools.js';
import { 
  getSubmissionTool, 
  getSubmissionTestResultsTool, 
  getSubmissionHistoryTool, 
  submissionToolDefs 
} from './tools/submissionTools.js';
import { runCodeTool, compilerToolDefs } from './tools/compilerTools.js';
import { 
  getContestTool, 
  getContestStatisticsTool, 
  getProblemStatisticsTool, 
  getRecentSubmissionsTool, 
  createAdminRecommendationTool, 
  contestToolDefs 
} from './tools/contestTools.js';
import { getLeaderboardTool, leaderboardToolDefs } from './tools/leaderboardTools.js';
import { AGENT_CONFIG } from '../shared/agentConfig.js';

/**
 * Registry of all available FIASCOde MCP Tools
 */
const TOOL_REGISTRY = {
  get_problem: getProblemTool,
  get_submission: getSubmissionTool,
  get_submission_test_results: getSubmissionTestResultsTool,
  get_submission_history: getSubmissionHistoryTool,
  run_code: runCodeTool,
  get_contest: getContestTool,
  get_contest_statistics: getContestStatisticsTool,
  get_problem_statistics: getProblemStatisticsTool,
  get_recent_submissions: getRecentSubmissionsTool,
  create_admin_recommendation: createAdminRecommendationTool,
  get_leaderboard: getLeaderboardTool,
};

export const ALL_TOOL_DEFINITIONS = [
  getProblemToolDef,
  ...submissionToolDefs,
  ...compilerToolDefs,
  ...contestToolDefs,
  ...leaderboardToolDefs,
];

/**
 * Executes an MCP tool invocation by name with input arguments
 */
export async function executeMcpTool(toolName, args = {}) {
  const handler = TOOL_REGISTRY[toolName];
  if (!handler) {
    throw new Error(`MCP Tool '${toolName}' not found in registry.`);
  }

  const startTime = Date.now();
  try {
    const result = await handler(args);
    const durationMs = Date.now() - startTime;
    AGENT_CONFIG.log('MCP', { tool: toolName, status: 'success', durationMs });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    AGENT_CONFIG.log('MCP', { tool: toolName, status: 'error', error: error.message, durationMs });
    throw error;
  }
}

/**
 * Returns the list of all available MCP tools and their schemas
 */
export function listMcpTools() {
  return ALL_TOOL_DEFINITIONS;
}
