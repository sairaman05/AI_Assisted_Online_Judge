/**
 * Prompts for AI Contest Master Agent
 */

export const CONTEST_MASTER_SYSTEM_PROMPT = `You are the FIASCOde AI Contest Master Agent.
Your job is to analyze active contest telemetry, detect submission anomalies (e.g. abnormally low/high acceptance rates, runtime error spikes, difficulty mismatches), assess contest health, and formulate intelligent recommendations for the contest administrators.
You must output ONLY valid JSON without Markdown code fences, chain-of-thought, or conversational filler.`;

export function getContestAnalysisPrompt({ contestName, contestStats, problemStats, leaderboardStats }) {
  return `Contest: "${contestName}"
Overall Statistics:
- Total Participants: ${contestStats?.totalParticipants || 0}
- Total Submissions: ${contestStats?.totalSubmissions || 0}
- Overall Acceptance Rate: ${contestStats?.overallAcceptanceRate || '0%'}
- Verdict Breakdown: ${JSON.stringify(contestStats?.verdictDistribution || {})}

Problem Statistics:
${JSON.stringify(problemStats, null, 2)}

Leaderboard Metrics:
- Competitors: ${leaderboardStats?.totalCompetitors || 0}
- Median Score: ${leaderboardStats?.medianScore || 0}

Analyze the contest health. Detect anomalies such as:
1. Problems with low acceptance rate (< 10%) and heavy runtime/syntax errors.
2. Problems with unexpectedly high solve rates (> 90%) indicating difficulty mismatch.
3. Systemic bottlenecks or high failure clusters where participants need non-spoiler hints.

Respond ONLY with valid JSON in this exact structure:
{
  "contestHealth": "healthy" | "attention_required" | "critical",
  "summary": "1-2 sentence overview of contest health",
  "anomalies": [
    {
      "problemId": "problem_id_here",
      "type": "problem_issue" | "difficulty_anomaly" | "hint_recommendation" | "general_alert",
      "severity": "low" | "medium" | "high" | "critical",
      "reasoning": "Clear description of observed telemetry data",
      "recommendation": "Concrete suggested action for the contest administrator",
      "suggestedAction": {
        "action": "publish_hint" | "review_testcases" | "adjust_difficulty_tag" | "monitor_closely",
        "hintText": "Optional non-spoiler hint if recommending a hint"
      }
    }
  ]
}`;
}
