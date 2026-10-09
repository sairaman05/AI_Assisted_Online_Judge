import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../api/authuser";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // wait until auth state finishes loading

    const effectiveUserId = user?.sub || user?.id || user?.email || user?._id || "guest_user";
    fetchDashboardData(effectiveUserId);
  }, [user, isAuthenticated, isLoading]);

  const fetchDashboardData = async (targetUserId: string) => {
    try {
      setLoading(true);
      const backendIp = import.meta.env.VITE_BACKEND_IP || "http://localhost:5174";
      const res = await fetch(`${backendIp}/api/users/profile/${targetUserId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      } else {
        setTelemetry({
          user: { id: targetUserId, name: user?.name || user?.email || "Coder", email: user?.email },
          solvedCount: 0,
          attemptedCount: 0,
          streak: 1,
          rating: 1200,
          contestParticipationCount: 0,
          solvedProblemIds: [],
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          totalSubmissions: 0,
          topicProgress: {},
          weakTopics: ["Dynamic Programming", "Graph Traversal", "Two Pointers"],
          recommendedProblems: [],
          submissions: []
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center text-gray-400 font-medium">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading User Dashboard Telemetry...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-2xl font-bold text-indigo-400">User Dashboard Telemetry</h2>
            <p className="text-sm text-gray-300">
              Please sign in to track your problem-solving metrics, weak topics, and AI interview recommendations.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs rounded-xl shadow cursor-pointer transition"
              >
                Sign In Now
              </button>
              <button
                onClick={() => navigate("/problems")}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 font-bold text-gray-300 text-xs rounded-xl transition"
              >
                Browse Problems
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const solved = telemetry?.solvedCount || 0;
  const attempted = telemetry?.attemptedCount || 0;
  const streak = telemetry?.streak || 1;
  const rating = telemetry?.rating || 1200;
  const easy = telemetry?.easySolved || 0;
  const medium = telemetry?.mediumSolved || 0;
  const hard = telemetry?.hardSolved || 0;
  const contestCount = telemetry?.contestParticipationCount || 0;
  const weakTopics: string[] = telemetry?.weakTopics || [];
  const recommendedProblems: any[] = telemetry?.recommendedProblems || [];
  const submissions: any[] = telemetry?.submissions || [];
  const topicProgress = telemetry?.topicProgress || {};

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* User Hero Banner */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-gray-900 border border-indigo-500/20 p-6 sm:p-8 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">User Dashboard</span>
            <h1 className="text-3xl font-extrabold text-white mt-1">
              Welcome back, {user?.name || user?.email || "Coder"}! 🚀
            </h1>
            <p className="text-gray-300 text-sm mt-1">
              Here is your real-time practice telemetry, weak topic insights, and AI problem recommendations.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-gray-950/80 px-6 py-3.5 rounded-xl border border-gray-800">
            <div className="text-center">
              <span className="block text-2xl font-black text-amber-400">🔥 {streak}</span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Active Streak</span>
            </div>
            <div className="h-8 w-px bg-gray-800"></div>
            <div className="text-center">
              <span className="block text-2xl font-black text-indigo-400">⚡ {rating}</span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Contest Rating</span>
            </div>
          </div>
        </div>

        {/* 4 Primary Metric Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl text-center shadow">
            <span className="text-3xl font-black text-emerald-400 block">{solved}</span>
            <span className="text-xs text-gray-400 uppercase font-bold mt-1 block">Problems Solved</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl text-center shadow">
            <span className="text-3xl font-black text-indigo-400 block">{attempted}</span>
            <span className="text-xs text-gray-400 uppercase font-bold mt-1 block">Problems Attempted</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl text-center shadow">
            <span className="text-3xl font-black text-purple-400 block">{contestCount}</span>
            <span className="text-xs text-gray-400 uppercase font-bold mt-1 block">Contests Joined</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl text-center shadow">
            <span className="text-3xl font-black text-amber-400 block">{telemetry?.totalSubmissions || 0}</span>
            <span className="text-xs text-gray-400 uppercase font-bold mt-1 block">Total Submissions</span>
          </div>
        </div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Difficulty & Weak Topics Breakdown */}
          <div className="space-y-6">
            
            {/* Difficulty Breakdown Card */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">🎯 Difficulty-wise Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-400">Easy</span>
                    <span>{easy} solved</span>
                  </div>
                  <div className="w-full bg-gray-950 rounded-full h-2.5 overflow-hidden border border-gray-800">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (easy / Math.max(1, solved)) * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-400">Medium</span>
                    <span>{medium} solved</span>
                  </div>
                  <div className="w-full bg-gray-950 rounded-full h-2.5 overflow-hidden border border-gray-800">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (medium / Math.max(1, solved)) * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-400">Hard</span>
                    <span>{hard} solved</span>
                  </div>
                  <div className="w-full bg-gray-950 rounded-full h-2.5 overflow-hidden border border-gray-800">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, (hard / Math.max(1, solved)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Identified Weak Topics Card */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-base font-bold text-white mb-3 flex items-center justify-between">
                <span>⚠️ Identified Weak Topics</span>
                <span className="text-[10px] text-gray-400 font-mono">Based on failed runs</span>
              </h2>
              {weakTopics.length === 0 ? (
                <p className="text-xs text-gray-500">No weak topics identified yet. Keep practicing!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {weakTopics.map((topic, idx) => (
                    <span key={idx} className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Interview Prep Banner */}
            <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 p-6 rounded-2xl text-center shadow-xl">
              <h3 className="text-lg font-bold text-purple-300 mb-2">💼 AI Interview Preparation</h3>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                Upload a Job Description PDF and get custom roadmaps, interactive mock interview chatbot, and downloadable revision PDFs.
              </p>
              <button
                onClick={() => navigate("/interview-prep")}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
              >
                Launch Interview Prep Suite ➔
              </button>
            </div>

          </div>

          {/* AI Recommended Problems & Recent Submissions Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Recommended Practice Problems Card */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-base font-bold text-white mb-4 flex items-center justify-between">
                <span>🤖 AI Recommended Practice Problems</span>
                <span className="text-xs text-indigo-400 font-normal">Targeting your weak topics</span>
              </h2>

              {recommendedProblems.length === 0 ? (
                <div className="text-xs text-gray-500 p-4 text-center">
                  All targeted problems solved! Browse the main practice catalog.
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedProblems.map((prob) => (
                    <div key={prob.id || prob._id} className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center justify-between gap-4 hover:border-indigo-500/30 transition">
                      <div>
                        <h4 className="font-bold text-sm text-gray-100 hover:text-indigo-400 cursor-pointer" onClick={() => navigate(`/editor?problemId=${prob.id}`)}>
                          {prob.title}
                        </h4>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            (prob.difficulty || "Medium").toLowerCase() === "easy" ? "bg-emerald-500/20 text-emerald-400" :
                            (prob.difficulty || "Medium").toLowerCase() === "hard" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {prob.difficulty || "Medium"}
                          </span>
                          {prob.tags && prob.tags.map((t: string, i: number) => (
                            <span key={i} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/editor?problemId=${prob.id}`)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition shadow cursor-pointer whitespace-nowrap"
                      >
                        Solve ➔
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Submissions Table */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">📜 Recent Submission Telemetry</h2>

              {submissions.length === 0 ? (
                <div className="text-xs text-gray-500 p-4 text-center">No recent submissions found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 uppercase">
                        <th className="py-2.5 px-3">Problem</th>
                        <th className="py-2.5 px-3">Lang</th>
                        <th className="py-2.5 px-3">Verdict</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {submissions.slice(0, 8).map((sub) => (
                        <tr key={sub._id || sub.submissionId} className="hover:bg-gray-800/30">
                          <td className="py-2.5 px-3 font-semibold text-gray-200">{sub.problem}</td>
                          <td className="py-2.5 px-3 text-gray-400 uppercase font-mono">{sub.language}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.result === "Accepted" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                            }`}>
                              {sub.result}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => navigate(`/editor?problemId=${sub.problem}`)}
                              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] rounded"
                            >
                              Editor
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
