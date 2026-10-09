import React, { useState, useEffect, useContext } from "react";
import Navbar from "../components/Navbar";
import { AuthContext } from "../api/authuser";
import { useParams, useNavigate } from "react-router-dom";

export default function ContestReportPage() {
  const { contestId } = useParams();
  const { user } = useContext(AuthContext);
  const userId = user?.id || user?.email || "";
  const navigate = useNavigate();

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contestId && userId) {
      fetchContestReport();
    }
  }, [contestId, userId]);

  const fetchContestReport = async () => {
    try {
      setLoading(true);
      const backendIp = import.meta.env.VITE_BACKEND_IP || "http://localhost:5174";
      const res = await fetch(`${backendIp}/api/contests/${contestId}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error("Contest report error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center text-gray-400 font-medium">
          Generating Post-Contest Performance Report...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-amber-900/60 via-purple-900/40 to-gray-900 border border-amber-500/30 p-6 sm:p-8 rounded-2xl mb-8 shadow-xl">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">AI Post-Contest Report</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            {report?.contestName || "Contest"} Performance Analysis 📊
          </h1>
          <p className="text-gray-300 text-sm mt-1">{report?.overallSummary}</p>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl text-center shadow">
            <span className="text-3xl font-black text-indigo-400 block">{report?.totalAttempted}</span>
            <span className="text-xs text-gray-400 uppercase font-bold mt-1 block">Problems Attempted</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl text-center shadow">
            <span className="text-3xl font-black text-emerald-400 block">{report?.totalSolved}</span>
            <span className="text-xs text-gray-400 uppercase font-bold mt-1 block">Problems Solved</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl text-center shadow">
            <span className="text-3xl font-black text-purple-400 block">{report?.accuracy}%</span>
            <span className="text-xs text-gray-400 uppercase font-bold mt-1 block">Submission Accuracy</span>
          </div>
        </div>

        {/* Identified Weaknesses Card */}
        {report?.identifiedWeaknesses && report.identifiedWeaknesses.length > 0 && (
          <div className="bg-gray-900 border border-rose-500/30 p-6 rounded-2xl mb-8 shadow-xl">
            <h3 className="text-base font-bold text-rose-400 mb-3">⚠️ Identified Contest Weaknesses</h3>
            <div className="flex flex-wrap gap-2">
              {report.identifiedWeaknesses.map((w: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Per Problem Breakdown */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-base font-bold text-white mb-4">📜 Per-Problem Performance Breakdown</h3>
          <div className="space-y-4">
            {report?.problemBreakdowns && report.problemBreakdowns.map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.solved ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                    }`}>
                      {item.solved ? "Solved ✓" : "Unsolved ✕"}
                    </span>
                    <h4 className="font-bold text-sm text-gray-100">{item.title}</h4>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{item.feedback}</p>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">Key Improvement: {item.keyImprovement}</p>
                </div>

                <button
                  onClick={() => navigate(`/editor?problemId=${item.problemId}`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition cursor-pointer whitespace-nowrap"
                >
                  Review in Editor ➔
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
