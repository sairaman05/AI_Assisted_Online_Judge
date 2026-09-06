import React, { useEffect, useState } from "react";
import { readSubmissions } from "../api/submissions";
import { startDebugSession } from "../api/agents";
import DebuggingModal from "../components/DebuggingModal";

interface Submission {
  submissionId: string;
  problem: string;      
  user: string;
  username: string;
  contestId?: string | null;
  score: number;
  result: 'Accepted' | 'Wrong Answer' | 'Pending' | 'Judging' | 'Runtime Error' | 'Time Limit Exceeded' | 'Compilation Error';
  time?: number;
  memory?: number;
  code?: string;
  language?: string;
  submittedAt: string;   
}

interface UserSubmissionsPageProps {
  userId: string;
  problems: Array<{ id: string; title: string }>; 
  onBack?: () => void;
  onApplyFix?: (code: string) => void;
}

export default function SubmissionsPage({ userId, problems, onBack, onApplyFix }: UserSubmissionsPageProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Debugging Modal State
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<any>(null);
  const [selectedSubCode, setSelectedSubCode] = useState<string>("");

  // Quick lookup from problemId to title
  const problemName = (problemId: string) =>
    problems.find((p) => p.id === problemId)?.title || problemId;

  useEffect(() => {
    setLoading(true);
    readSubmissions()
      .then((allSubs: Submission[]) => {
        const userSubs = (allSubs || []).filter(sub => sub.user === userId);
        userSubs.sort(
          (a, b) =>
            new Date(b.submittedAt || 0).getTime() -
            new Date(a.submittedAt || 0).getTime()
        );
        setSubmissions(userSubs);
      })
      .catch(err => {
        setSubmissions([]);
        console.error("Failed to load user submissions:", err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleDebugSubmission = async (sub: Submission) => {
    setDebugModalOpen(true);
    setDebugLoading(true);
    setDebugError(null);
    setDiagnosisData(null);
    setSelectedSubCode(sub.code || "");

    try {
      const result = await startDebugSession({
        submissionId: sub.submissionId,
        problemId: sub.problem,
        sourceCode: sub.code,
        language: sub.language || 'py',
        verdict: sub.result,
      });

      setDiagnosisData(result);
    } catch (err: any) {
      setDebugError(err.message || "Failed to run autonomous debugging agent.");
    } finally {
      setDebugLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-indigo-400 text-lg font-semibold bg-zinc-950">
        Loading submissions...
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-white">
        <h2 className="text-2xl font-bold mb-6 text-indigo-400">Submissions</h2>
        <p className="text-gray-400">No submissions yet.</p>
        {onBack && (
          <button onClick={onBack} className="mt-8 px-4 py-2 bg-blue-600 rounded hover:bg-blue-800 font-semibold">
            ← Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-zinc-950 text-white flex flex-col">
      <div className="flex items-center justify-between mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-800 text-white font-semibold"
          >
            ← Back to Editor
          </button>
        )}
        <h2 className="text-3xl font-bold text-indigo-400 mx-auto">Your Submissions</h2>
        <div style={{width: 120}} />
      </div>

      <div className="overflow-x-auto shadow-2xl rounded-xl border border-zinc-800">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-zinc-900 text-indigo-200 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Problem</th>
              <th className="px-4 py-3 text-center">Score</th>
              <th className="px-4 py-3 text-center">Result</th>
              <th className="px-4 py-3 text-center">AI Diagnostics</th>
            </tr>
          </thead>
          <tbody className="bg-zinc-950 text-gray-200 divide-y divide-zinc-800/60">
            {submissions.map(sub => {
              const isAccepted = sub.result === 'Accepted';
              return (
                <tr key={sub.submissionId} className="hover:bg-zinc-900/40 transition">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                    {sub.submittedAt
                      ? new Date(sub.submittedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{problemName(sub.problem)}</td>
                  <td className="px-4 py-3 text-center font-mono">{sub.score}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${
                      isAccepted
                        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}>
                      {sub.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!isAccepted ? (
                      <button
                        onClick={() => handleDebugSubmission(sub)}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg text-xs transition shadow-md flex items-center gap-1.5 mx-auto cursor-pointer"
                        title="Start autonomous iterative debugging with AI"
                      >
                        <span>🤖</span> Debug with AI
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 italic">Passed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Interactive Debugging Modal */}
      <DebuggingModal
        isOpen={debugModalOpen}
        onClose={() => setDebugModalOpen(false)}
        loading={debugLoading}
        error={debugError}
        diagnosisData={diagnosisData}
        originalCode={selectedSubCode}
        onApplyFix={onApplyFix}
      />
    </div>
  );
}
