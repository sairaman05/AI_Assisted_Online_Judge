import mongoose from 'mongoose';
import Submission from '../../../models/submission.js';

/**
 * MCP Tool: get_leaderboard
 * Calculates leaderboard rankings and score spread for a contest.
 */
export async function getLeaderboardTool({ contestId }) {
  if (!contestId) throw new Error("contestId is required");

  let filter = {};
  if (contestId && contestId !== 'all' && mongoose.Types.ObjectId.isValid(contestId)) {
    filter = { contestId };
  }

  const submissions = await Submission.find(filter);

  // Group by user
  const userMap = new Map();

  submissions.forEach(sub => {
    const userId = sub.user;
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId,
        username: sub.username || "Anonymous",
        totalScore: 0,
        problemsSolved: new Set(),
        totalSubmissions: 0,
        lastAcceptedTime: 0
      });
    }

    const userData = userMap.get(userId);
    userData.totalSubmissions++;

    const isAccepted = (sub.result || '').toLowerCase() === 'accepted';
    if (isAccepted && !userData.problemsSolved.has(sub.problem)) {
      userData.problemsSolved.add(sub.problem);
      userData.totalScore += (sub.score || 100);
      const subTime = new Date(sub.submittedAt || 0).getTime();
      if (subTime > userData.lastAcceptedTime) {
        userData.lastAcceptedTime = subTime;
      }
    }
  });

  const standings = Array.from(userMap.values())
    .map(u => ({
      userId: u.userId,
      username: u.username,
      totalScore: u.totalScore,
      solvedCount: u.problemsSolved.size,
      totalSubmissions: u.totalSubmissions
    }))
    .sort((a, b) => b.totalScore - a.totalScore || a.totalSubmissions - b.totalSubmissions)
    .slice(0, 50);

  return {
    contestId,
    totalCompetitors: standings.length,
    topRankings: standings.slice(0, 10),
    medianScore: standings.length > 0 ? standings[Math.floor(standings.length / 2)].totalScore : 0
  };
}

export const leaderboardToolDefs = [
  {
    name: "get_leaderboard",
    description: "Retrieve sanitized contest leaderboard standings and score distribution metrics.",
    inputSchema: {
      type: "object",
      properties: {
        contestId: { type: "string", description: "The contest ID" }
      },
      required: ["contestId"]
    }
  }
];
