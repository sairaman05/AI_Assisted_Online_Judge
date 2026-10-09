import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../api/authuser";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

interface SubmissionItem {
  _id: string;
  submissionId: string;
  problem: string;
  result: string;
  language: string;
  submittedAt?: string;
  createdAt?: string;
  errorDetails?: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // wait until auth state finishes loading

    const effectiveUserId = user?.sub || user?.id || user?.email || user?._id || "guest_user";
    fetchProfile(effectiveUserId);
  }, [user, isAuthenticated, isLoading]);

  const fetchProfile = async (targetUserId: string) => {
    try {
      setLoadingProfile(true);
      const backendIp = import.meta.env.VITE_BACKEND_IP || "http://localhost:5174";
      const res = await fetch(`${backendIp}/api/users/profile/${targetUserId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setProfile({
          user: { id: targetUserId, name: user?.name || user?.email || "Coder", email: user?.email },
          solvedCount: 0,
          attemptedCount: 0,
          totalSubmissions: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          submissions: []
        });
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const getVerdictBadge = (result: string) => {
    switch (result) {
      case "Accepted":
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">Accepted</span>;
      case "Wrong Answer":
        return <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-md">Wrong Answer</span>;
      case "Runtime Error":
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">Runtime Error</span>;
      case "Time Limit Exceeded":
        return <span className="px-2.5 py-1 text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-md">TLE</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-gray-700 text-gray-300 rounded-md">{result || "Pending"}</span>;
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center text-gray-400 font-medium">
          Loading profile telemetry...
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
            <h2 className="text-2xl font-bold text-indigo-400">User Profile 👤</h2>
            <p className="text-sm text-gray-300">
              Please sign in to view your detailed profile telemetry and past submissions.
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

  const easy = profile?.easySolved || 0;
  const medium = profile?.mediumSolved || 0;
  const hard = profile?.hardSolved || 0;
  const totalSolved = profile?.solvedCount || 0;
  const submissions: SubmissionItem[] = profile?.submissions || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* User Banner Header */}
        <div className="bg-gray-900 border border-gray-800 p-6 sm:p-8 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white text-3xl font-black shadow-lg">
              {(profile?.user?.name || user?.name || "U")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {profile?.user?.name || user?.name || "Coder"}
              </h1>
              <p className="text-gray-400 text-sm">{profile?.user?.email || user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded border border-indigo-500/30 uppercase">
                  {profile?.user?.type || "User"}
                </span>
                <span className="text-xs text-gray-500">
                  Joined: {new Date(profile?.user?.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-gray-950/80 px-6 py-4 rounded-xl border border-gray-800">
            <div className="text-center">
              <span className="block text-3xl font-black text-emerald-400">{totalSolved}</span>
              <span className="text-xs text-gray-400 uppercase font-semibold">Total Solved</span>
            </div>
            <div className="h-10 w-px bg-gray-800"></div>
            <div className="text-center">
              <span className="block text-3xl font-black text-indigo-400">{profile?.totalSubmissions || 0}</span>
              <span className="text-xs text-gray-400 uppercase font-semibold">Submissions</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Difficulty Solved Breakdown Card */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span>🎯 Solved Breakdown</span>
            </h2>

            <div className="space-y-5">
              {/* Easy Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1 font-semibold">
                  <span className="text-emerald-400">Easy</span>
                  <span className="text-gray-300">{easy} solved</span>
                </div>
                <div className="w-full bg-gray-950 rounded-full h-3 overflow-hidden border border-gray-800">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (easy / Math.max(1, totalSolved)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Medium Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1 font-semibold">
                  <span className="text-amber-400">Medium</span>
                  <span className="text-gray-300">{medium} solved</span>
                </div>
                <div className="w-full bg-gray-950 rounded-full h-3 overflow-hidden border border-gray-800">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (medium / Math.max(1, totalSolved)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Hard Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1 font-semibold">
                  <span className="text-rose-400">Hard</span>
                  <span className="text-gray-300">{hard} solved</span>
                </div>
                <div className="w-full bg-gray-950 rounded-full h-3 overflow-hidden border border-gray-800">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (hard / Math.max(1, totalSolved)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-800 text-xs text-gray-400 text-center">
              Keep practicing problems to boost your profile ranking!
            </div>
          </div>

          {/* Recent Submissions Table */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
              <span>📜 Recent Submissions</span>
              <span className="text-xs font-normal text-gray-400">Latest 50</span>
            </h2>

            {submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No submissions recorded yet. Pick a problem from the Practice tab!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                      <th className="py-3 px-4">Problem</th>
                      <th className="py-3 px-4">Language</th>
                      <th className="py-3 px-4">Verdict</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {submissions.map((sub) => (
                      <tr key={sub._id || sub.submissionId} className="hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-gray-200">
                          {sub.problem}
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 uppercase font-mono text-xs">
                          {sub.language}
                        </td>
                        <td className="py-3.5 px-4">
                          {getVerdictBadge(sub.result)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => navigate(`/editor?problemId=${sub.problem}`)}
                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded transition cursor-pointer"
                          >
                            Open Editor
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

      </main>
    </div>
  );
}
