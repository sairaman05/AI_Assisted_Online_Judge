import { useEffect, useState } from "react";
import { readSubmissions } from "../api/submissions";
import {
  calculateLeaderboard,
  type LeaderboardEntry,
  type Contest,
} from "../api/leaderboard";

interface LeaderboardPageProps {
  contestId: string;
  contests: Contest[];
}

export default function LeaderboardPage({
  contestId,
  contests,
}: LeaderboardPageProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const contest = contests.find((c) => c.id === contestId);
  const contestProblemIds = contest?.problems ?? [];

  useEffect(() => {
    if (!contestProblemIds.length) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const submissions = await readSubmissions();
        if (Array.isArray(submissions)) {
          const leaderboardData = calculateLeaderboard(submissions, contestProblemIds);
          setLeaderboard(leaderboardData);
        } else {
          setLeaderboard([]);
        }
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [contestProblemIds]);

  const getMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return rank;
    }
  };

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen flex items-center justify-center text-indigo-400 text-lg font-semibold"
      >
        Loading leaderboard...
      </div>
    );
  }

  if (!leaderboard.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">🏆 Leaderboard</h2>
        <p className="text-gray-400">No submissions or results yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-white flex flex-col">
      {/* Top row with Back button and heading */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-800 text-white font-semibold transition"
          aria-label="Back to Editor"
        >
          ← Back to Editor
        </button>

        <h2 className="text-3xl font-bold text-indigo-400 text-center flex-grow mx-4">
          🏆 Leaderboard
        </h2>

        {/* Empty div for spacing to balance back button */}
        <div style={{ width: 120 }} />
      </div>

      {/* Scrollable table container */}
      <div className="overflow-x-auto shadow-lg rounded-lg border border-indigo-700">
        <table
          aria-label="Contest leaderboard"
          className="w-full text-sm border-collapse"
        >
          <thead className="bg-indigo-800 text-indigo-100">
            <tr>
              <th className="border border-indigo-700 px-4 py-3 text-center w-20">Rank</th>
              <th className="border border-indigo-700 px-4 py-3 text-left">Username</th>
              <th className="border border-indigo-700 px-4 py-3 text-center w-24">Score</th>
              <th
                className="border border-indigo-700 px-4 py-3 text-center w-48"
                title="Average percentile of solution times"
              >
                Avg. Time Percentile
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 text-indigo-100">
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.user || index}
                className="hover:bg-indigo-800/40 transition duration-200"
              >
                <td
                  className="border border-indigo-700 px-4 py-2 text-center whitespace-nowrap"
                  aria-label={`Rank ${index + 1}`}
                >
                  {getMedal(index + 1)}
                </td>
                <td className="border border-indigo-700 px-4 py-2">{entry.username}</td>
                <td className="border border-indigo-700 px-4 py-2 text-center whitespace-nowrap">
                  {entry.totalScore}
                </td>
                <td className="border border-indigo-700 px-4 py-2 text-center whitespace-nowrap">
                  {entry.avgTimePercentile.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
