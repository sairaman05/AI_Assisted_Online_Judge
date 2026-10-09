import { getAgentLLM } from '../agents/shared/llm.js';
import Submission from '../models/submission.js';
import Contest from '../models/contest.js';
import Problem from '../models/problem.js';

/**
 * Contest Performance Report, Weakness Analysis & Problem Recommendation Service
 */

export async function generateContestPerformanceReport(contestId, userId) {
  const contest = await Contest.findById(contestId);
  if (!contest) throw new Error("Contest not found");

  const submissions = await Submission.find({
    contestId: contest._id,
    $or: [{ user: userId }, { username: userId }]
  }).sort({ createdAt: 1 });

  const problems = await Problem.find({ id: { $in: contest.problems } });

  const totalAttempted = new Set(submissions.map(s => s.problem)).size;
  const acceptedSubmissions = submissions.filter(s => s.result === 'Accepted');
  const totalSolved = new Set(acceptedSubmissions.map(s => s.problem)).size;
  const accuracy = submissions.length > 0 ? Math.round((acceptedSubmissions.length / submissions.length) * 100) : 0;

  const perProblemStats = problems.map(prob => {
    const pSubs = submissions.filter(s => s.problem === prob.id || s.problem === prob._id.toString());
    const isSolved = pSubs.some(s => s.result === 'Accepted');
    const wrongAttempts = pSubs.filter(s => s.result !== 'Accepted').length;
    const finalSub = pSubs[pSubs.length - 1];

    return {
      problemId: prob.id,
      title: prob.title,
      difficulty: prob.difficulty || 'Medium',
      tags: prob.tags || [],
      isSolved,
      totalAttempts: pSubs.length,
      wrongAttempts,
      lastVerdict: finalSub ? finalSub.result : 'Unattempted',
      lastCode: finalSub ? finalSub.code : ''
    };
  });

  const prompt = `You are a Competitive Programming Contest Performance Analyst. Analyze the user's ACTUAL contest performance data below.

CONTEST NAME: ${contest.name}
TOTAL PROBLEMS ATTEMPTED: ${totalAttempted} / ${contest.problems.length}
TOTAL PROBLEMS SOLVED: ${totalSolved}
SUBMISSION ACCURACY: ${accuracy}%
TOTAL SUBMISSIONS: ${submissions.length}

PER-PROBLEM PERFORMANCE LOG:
${JSON.stringify(perProblemStats)}

INSTRUCTIONS:
1. Provide an Overall Performance Summary (strengths, time allocation, accuracy).
2. Identify specific Weakness Patterns based on actual failures (e.g. DP state transition errors, off-by-one errors, TLE on large arrays, edge cases).
3. Provide Actionable Improvement Recommendations for each attempted problem.

JSON Output Format:
{
  "contestName": "${contest.name}",
  "totalAttempted": ${totalAttempted},
  "totalSolved": ${totalSolved},
  "accuracy": ${accuracy},
  "overallSummary": "<Summary of performance>",
  "identifiedWeaknesses": ["<Weakness 1>", "<Weakness 2>"],
  "problemBreakdowns": [
    {
      "problemId": "<id>",
      "title": "<title>",
      "solved": true|false,
      "attempts": 2,
      "feedback": "<Specific feedback on code or approach>",
      "keyImprovement": "<What to improve next time>"
    }
  ]
}`;

  const llm = getAgentLLM({ temperature: 0.3, maxTokens: 600 });
  const completion = await llm.invoke([
    { role: 'system', content: 'You are an AI contest analyst. Return clean JSON.' },
    { role: 'user', content: prompt }
  ]);

  let text = typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '');
  let parsed;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    parsed = {
      contestName: contest.name,
      totalAttempted,
      totalSolved,
      accuracy,
      overallSummary: `You solved ${totalSolved} out of ${contest.problems.length} problems with an accuracy of ${accuracy}%.`,
      identifiedWeaknesses: ["Handling edge cases", "Time complexity optimization"],
      problemBreakdowns: perProblemStats.map(p => ({
        problemId: p.problemId,
        title: p.title,
        solved: p.isSolved,
        attempts: p.totalAttempts,
        feedback: p.isSolved ? "Great job solving this problem!" : "Review time complexity and array boundary conditions.",
        keyImprovement: "Practice more problems in this category."
      }))
    };
  }

  return parsed;
}

export async function analyzeUserWeaknesses(userId) {
  const submissions = await Submission.find({
    $or: [{ user: userId }, { username: userId }]
  }).sort({ createdAt: -1 }).limit(100);

  const failedSubmissions = submissions.filter(s => s.result !== 'Accepted');
  const problemIds = Array.from(new Set(submissions.map(s => s.problem)));
  const problems = await Problem.find({ id: { $in: problemIds } });

  const tagFailureCounts = {};
  failedSubmissions.forEach(sub => {
    const prob = problems.find(p => p.id === sub.problem || p._id.toString() === sub.problem);
    if (prob && prob.tags) {
      prob.tags.forEach(tag => {
        tagFailureCounts[tag] = (tagFailureCounts[tag] || 0) + 1;
      });
    }
  });

  const sortedWeakTopics = Object.entries(tagFailureCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  return {
    totalSubmissions: submissions.length,
    failedCount: failedSubmissions.length,
    weakTopics: sortedWeakTopics.length > 0 ? sortedWeakTopics : ['Dynamic Programming', 'Graph Traversal', 'Two Pointers'],
    tagFailureCounts
  };
}

export async function getPersonalizedRecommendations(userId) {
  const { weakTopics } = await analyzeUserWeaknesses(userId);
  const userSubmissions = await Submission.find({
    $or: [{ user: userId }, { username: userId }],
    result: 'Accepted'
  });
  const solvedIds = new Set(userSubmissions.map(s => s.problem));

  // Find unsolved problems matching weak topics
  const recommendedProblems = await Problem.find({
    id: { $nin: Array.from(solvedIds) },
    tags: { $in: weakTopics.length > 0 ? weakTopics : ['Arrays', 'Hash Table'] }
  }).limit(5);

  return {
    weakTopics,
    recommendedProblems
  };
}
