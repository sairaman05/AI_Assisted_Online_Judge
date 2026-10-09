import crypto from 'crypto';
import Contest from '../models/contest.js';
import Problem from '../models/problem.js';
import Submission from '../models/submission.js';
import ContestAnalytics from '../models/contestAnalytics.js';
import { getAgentLLM } from '../agents/shared/llm.js';

/**
 * Aggregates live contest telemetry from database & submissions
 */
export async function getAggregatedContestMetrics(contestId) {
  const contest = await Contest.findOne({
    $or: [
      { _id: contestId.match(/^[0-9a-fA-F]{24}$/) ? contestId : null },
      { id: contestId },
      { name: contestId }
    ]
  });

  if (!contest) {
    throw new Error("Contest not found.");
  }

  const effectiveContestId = contest._id.toString();
  const problemIds = contest.problems || [];
  const contestProblems = await Problem.find({
    $or: [
      { id: { $in: problemIds } },
      { _id: { $in: problemIds.filter(pid => pid.match(/^[0-9a-fA-F]{24}$/)) } }
    ]
  });

  const allSubmissions = await Submission.find({
    $or: [
      { contestId: effectiveContestId },
      { contestId: contest.id || '' },
      { contestId: contest.name }
    ]
  });

  const totalParticipantsCount = Math.max(1, contest.participants?.length || new Set(allSubmissions.map(s => s.user)).size || 1);
  const activeParticipantsCount = new Set(allSubmissions.map(s => s.user)).size;

  let problemStatistics = [];
  let totalSubmissionsCount = allSubmissions.length;

  for (const prob of contestProblems) {
    const probIdStr = prob.id || prob._id.toString();
    const probSubmissions = allSubmissions.filter(s => s.problem === probIdStr || s.problem === prob.title);

    const attemptedUsers = new Set(probSubmissions.map(s => s.user));
    const solvedUsers = new Set(probSubmissions.filter(s => s.result === 'Accepted').map(s => s.user));

    const attemptedCount = attemptedUsers.size;
    const solvedCount = solvedUsers.size;
    const failedCount = Math.max(0, attemptedCount - solvedCount);

    const successRate = attemptedCount > 0 ? Math.round((solvedCount / attemptedCount) * 100) : 0;
    const averageAttempts = attemptedCount > 0 ? Number((probSubmissions.length / attemptedCount).toFixed(1)) : 0;

    let wrongAnswerCount = 0;
    let runtimeErrorCount = 0;
    let tleCount = 0;
    let compilationErrorCount = 0;

    probSubmissions.forEach(s => {
      const res = (s.result || '').toLowerCase();
      if (res.includes('wrong answer')) wrongAnswerCount++;
      else if (res.includes('runtime')) runtimeErrorCount++;
      else if (res.includes('time limit') || res.includes('tle')) tleCount++;
      else if (res.includes('compilation') || res.includes('error')) compilationErrorCount++;
    });

    const totalFailures = wrongAnswerCount + tleCount + runtimeErrorCount + compilationErrorCount;
    // Struggle detection logic: attempted by >= 1 user AND (total failures >= 2 OR success rate < 50% OR TLE rate > 30%)
    const isStruggling = attemptedCount >= 1 && (totalFailures >= 2 || (attemptedCount >= 2 && successRate < 50) || (tleCount / Math.max(1, probSubmissions.length)) > 0.3);

    let primaryFailurePattern = "Normal problem progress";
    if (attemptedCount === 0) {
      primaryFailurePattern = "No participant attempts recorded yet for this problem.";
    } else if (tleCount >= wrongAnswerCount && tleCount >= runtimeErrorCount && tleCount > 0) {
      primaryFailurePattern = "High Time Limit Exceeded (TLE) Rate — Suboptimal time complexity used";
    } else if (wrongAnswerCount > 0) {
      primaryFailurePattern = "Wrong Answer — Edge case oversight, boundary condition, or logic flaw";
    } else if (runtimeErrorCount > 0) {
      primaryFailurePattern = "Runtime Error — Array index out of bounds or null reference";
    } else if (solvedCount > 0) {
      primaryFailurePattern = "Good solver performance — Most participants passing successfully";
    }

    problemStatistics.push({
      problemId: probIdStr,
      problemTitle: prob.title,
      difficulty: prob.difficulty || 'Medium',
      totalParticipants: totalParticipantsCount,
      attemptedCount,
      solvedCount,
      failedCount,
      successRate,
      averageAttempts,
      averageSolveTime: 0,
      wrongAnswerCount,
      runtimeErrorCount,
      tleCount,
      compilationErrorCount,
      primaryFailurePattern,
      isStruggling
    });
  }

  // Create hash snapshot of current data
  const snapshotData = JSON.stringify({
    effectiveContestId,
    totalSubmissionsCount,
    problemStats: problemStatistics.map(p => ({ pid: p.problemId, att: p.attemptedCount, sol: p.solvedCount, wa: p.wrongAnswerCount, tle: p.tleCount }))
  });
  const dataSnapshotHash = crypto.createHash('md5').update(snapshotData).digest('hex');

  return {
    contest,
    effectiveContestId,
    problemStatistics,
    totalParticipantsCount,
    activeParticipantsCount,
    totalSubmissionsCount,
    dataSnapshotHash
  };
}

/**
 * Runs Qwen2.5 Live AI Control Center Analysis
 */
export async function runAIControlCenterAnalysis(contestId, forceRefresh = false) {
  const aggregated = await getAggregatedContestMetrics(contestId);
  const { contest, effectiveContestId, problemStatistics, totalParticipantsCount, activeParticipantsCount, totalSubmissionsCount, dataSnapshotHash } = aggregated;

  // Check cached analysis doc if hash matches and not force refreshed
  if (!forceRefresh) {
    const cachedDoc = await ContestAnalytics.findOne({ contestId: effectiveContestId, dataSnapshotHash });
    if (cachedDoc) {
      console.log(`[AI Control Center] Returning cached analysis snapshot for contest "${contest.name}" (Hash: ${dataSnapshotHash.substring(0, 8)})`);
      return cachedDoc;
    }
  }

  console.log(`[AI Control Center] Executing live Qwen2.5 analysis for contest "${contest.name}"...`);

  const llm = getAgentLLM({ temperature: 0.3, maxTokens: 3000 });

  const prompt = `You are an expert competitive programming contest analyst and mentor.
Analyze the live competitive programming contest metrics and submission patterns below.

CONTEST METRICS:
- Contest Name: "${contest.name}"
- Total Participants: ${totalParticipantsCount}
- Active Participants: ${activeParticipantsCount}
- Total Submissions: ${totalSubmissionsCount}

PROBLEM TELEMETRY:
${JSON.stringify(problemStatistics, null, 2)}

CRITICAL INSTRUCTIONS:
1. Do NOT invent statistics or assume a problem is difficult merely because of its difficulty label.
2. If a problem has less than 2 attempts, explicitly state: "Not enough participant data to identify a reliable common failure pattern yet."
3. For problems where participants are struggling (low success rate / high attempt count), identify the failure pattern (e.g. O(N^2) TLE vs O(N log N), off-by-one, greedy assumption).
4. Generate 5 progressive guidance levels for struggling problems:
   - Level 1: Conceptual direction
   - Level 2: Relevant algorithmic pattern
   - Level 3: Specific structural insight
   - Level 4: Detailed reasoning
   - Level 5: Near-solution guidance / pseudocode

Return structured JSON according to this exact schema:
{
  "contestHealth": "<healthy | attention_required | critical_anomaly>",
  "problemAnalyses": [
    {
      "problemId": "<id>",
      "problemTitle": "<title>",
      "isStruggling": true,
      "failurePattern": "<e.g. O(N^2) Time Limit Exceeded>",
      "conceptualGap": "<e.g. Missing sliding window pattern>",
      "failureCategory": "<algorithmic | implementation | complexity | edge_case>",
      "evidenceSummary": "<Evidence based on attempt count and solve rate>",
      "aiGuidanceLevels": [
        { "level": 1, "title": "Conceptual Direction", "text": "<Level 1 hint text>" },
        { "level": 2, "title": "Algorithmic Pattern", "text": "<Level 2 hint text>" },
        { "level": 3, "title": "Structural Insight", "text": "<Level 3 hint text>" },
        { "level": 4, "title": "Detailed Reasoning", "text": "<Level 4 hint text>" },
        { "level": 5, "title": "Near-Solution Guidance", "text": "<Level 5 pseudocode hint text>" }
      ]
    }
  ]
}`;

  let contestHealth = 'healthy';
  let commonMistakes = [];
  let aiGuidanceList = [];

  try {
    const completion = await llm.invoke([
      { role: 'system', content: 'You are an AI competitive programming contest analyst. Return clean valid JSON only.' },
      { role: 'user', content: prompt }
    ]);

    let text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const candidate = JSON.parse(match[0]);
      contestHealth = candidate.contestHealth || 'healthy';

      if (Array.isArray(candidate.problemAnalyses)) {
        candidate.problemAnalyses.forEach(pa => {
          if (pa.isStruggling) {
            commonMistakes.push({
              problemId: pa.problemId,
              failurePattern: pa.failurePattern || "Logic or complexity flaw",
              conceptualGap: pa.conceptualGap || "Algorithmic understanding gap",
              failureCategory: pa.failureCategory || "complexity",
              evidenceSummary: pa.evidenceSummary || "Low solve rate detected"
            });

            if (Array.isArray(pa.aiGuidanceLevels)) {
              pa.aiGuidanceLevels.forEach(g => {
                aiGuidanceList.push({
                  guidanceId: `guidance_${pa.problemId}_lvl_${g.level}`,
                  problemId: pa.problemId,
                  problemTitle: pa.problemTitle,
                  targetScope: 'targeted',
                  guidanceText: g.text || "Focus on window bounds and invariant properties.",
                  guidanceLevel: g.level || 1,
                  publishedToParticipants: false,
                  minAttemptsThreshold: 3
                });
              });
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn(`[AI Control Center] DeepSeek analysis fallback triggered: ${err.message}`);
  }

  // Ensure 5 levels of guidance for all struggling problems
  problemStatistics.filter(p => p.isStruggling).forEach(p => {
    const hasLevels = aiGuidanceList.some(g => g.problemId === p.problemId);
    if (!hasLevels) {
      const levelTemplates = [
        { level: 1, text: `For "${p.problemTitle}": Focus on the core invariant property. Notice how past computations can avoid redundant recalculations.` },
        { level: 2, text: `For "${p.problemTitle}": Consider applying a Sliding Window, Hash Table, or Dynamic Programming memoization approach.` },
        { level: 3, text: `For "${p.problemTitle}": Pay close attention to boundary constraints and off-by-one index bounds when iterating.` },
        { level: 4, text: `For "${p.problemTitle}": Maintain a running metric or frequency map instead of running nested $O(N^2)$ loops.` },
        { level: 5, text: `For "${p.problemTitle}": Pseudocode direction: Initialize state variable; iterate once through input array updating optimal result dynamically.` }
      ];

      levelTemplates.forEach(t => {
        aiGuidanceList.push({
          guidanceId: `guidance_${p.problemId}_lvl_${t.level}`,
          problemId: p.problemId,
          problemTitle: p.problemTitle,
          targetScope: 'targeted',
          guidanceText: t.text,
          guidanceLevel: t.level,
          publishedToParticipants: false,
          minAttemptsThreshold: 3
        });
      });
    }
  });

  // Save/Update ContestAnalytics Document
  const analyticsDoc = await ContestAnalytics.findOneAndUpdate(
    { contestId: effectiveContestId, dataSnapshotHash },
    {
      contestId: effectiveContestId,
      dataSnapshotHash,
      analysisVersion: Date.now(),
      contestHealth,
      problemStatistics,
      commonMistakes,
      aiGuidance: aiGuidanceList,
      participantStatistics: {
        totalParticipants: totalParticipantsCount,
        activeParticipants: activeParticipantsCount,
        averageSolved: Number((problemStatistics.reduce((acc, curr) => acc + curr.solvedCount, 0) / Math.max(1, activeParticipantsCount)).toFixed(1)),
        stuckParticipantsCount: problemStatistics.filter(p => p.isStruggling).length
      },
      generatedAt: new Date()
    },
    { upsert: true, new: true }
  );

  return analyticsDoc;
}

/**
 * Publishes AI Guidance intervention for struggling participants
 */
export async function publishContestGuidance({ contestId, guidanceId, targetScope = 'targeted', minAttemptsThreshold = 3 }) {
  const analyticsDoc = await ContestAnalytics.findOne({ contestId }).sort({ createdAt: -1 });
  if (!analyticsDoc) {
    throw new Error("No analytics snapshot found for contest.");
  }

  let updated = false;
  analyticsDoc.aiGuidance = analyticsDoc.aiGuidance.map(g => {
    if (!guidanceId || g.guidanceId === guidanceId) {
      updated = true;
      return {
        ...g.toObject ? g.toObject() : g,
        publishedToParticipants: true,
        publishedAt: new Date(),
        targetScope,
        minAttemptsThreshold: Number(minAttemptsThreshold) || 3
      };
    }
    return g;
  });

  if (updated) {
    await analyticsDoc.save();
  }

  return analyticsDoc;
}

/**
 * User-side API to fetch published contest guidance for struggling participants
 */
export async function getParticipantContestGuidance({ contestId, userId, problemId }) {
  const contest = await Contest.findById(contestId);
  if (!contest || contest.aiHintsAllowed === false) {
    return { aiHintsAllowed: false, guidance: [] };
  }

  const analyticsDoc = await ContestAnalytics.findOne({ contestId }).sort({ createdAt: -1 });
  if (!analyticsDoc || !analyticsDoc.aiGuidance) {
    return { aiHintsAllowed: true, guidance: [] };
  }

  // Count user failed attempts for this problem
  const userSubmissions = await Submission.find({ contestId, user: userId, problem: problemId });
  const failedAttempts = userSubmissions.filter(s => s.result !== 'Accepted').length;

  const relevantGuidance = analyticsDoc.aiGuidance.filter(g => {
    if (!g.publishedToParticipants || g.problemId !== problemId) return false;
    if (g.targetScope === 'targeted' && failedAttempts < (g.minAttemptsThreshold || 3)) {
      return false;
    }
    return true;
  });

  return {
    aiHintsAllowed: true,
    failedAttempts,
    guidance: relevantGuidance
  };
}
