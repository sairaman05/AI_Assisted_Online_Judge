import React, { useState } from 'react';

interface DebuggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error?: string | null;
  diagnosisData?: any;
  originalCode?: string;
  onApplyFix?: (newCode: string) => void;
}

export default function DebuggingModal({
  isOpen,
  onClose,
  loading,
  error,
  diagnosisData,
  originalCode = "",
  onApplyFix,
}: DebuggingModalProps) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'timeline' | 'diff'>('diagnosis');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const diagnosis = diagnosisData?.finalDiagnosis || diagnosisData || {};
  const candidateFixCode = diagnosis?.candidateFix?.code || diagnosis?.suggestedFixCode || "";
  const hypotheses = diagnosis?.hypotheses || diagnosisData?.state?.hypotheses || [];
  const diagnosticRuns = diagnosis?.diagnosticRuns || diagnosisData?.state?.diagnosticRuns || [];

  const handleCopy = () => {
    if (candidateFixCode) {
      navigator.clipboard.writeText(candidateFixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (onApplyFix && candidateFixCode) {
      onApplyFix(candidateFixCode);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-indigo-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Autonomous Debugging Agent
              </h2>
              <p className="text-xs text-gray-400">
                LangGraph State Machine • Isolated Docker Diagnostic Execution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            ✖
          </button>
        </div>

        {/* Navigation Tabs */}
        {!loading && !error && diagnosisData && (
          <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 gap-2 pt-2">
            <button
              onClick={() => setActiveTab('diagnosis')}
              className={`py-2.5 px-4 font-semibold text-sm rounded-t-lg transition border-b-2 ${
                activeTab === 'diagnosis'
                  ? 'border-indigo-500 text-indigo-400 bg-zinc-800/60'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              🔍 Diagnosis & Root Cause
            </button>
            <button
              onClick={() => setActiveTab('diff')}
              className={`py-2.5 px-4 font-semibold text-sm rounded-t-lg transition border-b-2 ${
                activeTab === 'diff'
                  ? 'border-indigo-500 text-indigo-400 bg-zinc-800/60'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              📝 Candidate Fix & Diff
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-2.5 px-4 font-semibold text-sm rounded-t-lg transition border-b-2 ${
                activeTab === 'timeline'
                  ? 'border-indigo-500 text-indigo-400 bg-zinc-800/60'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              🔄 Iteration Timeline ({hypotheses.length || diagnosis.iterations || 1})
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-lg font-bold text-indigo-300">Agent Reasoning & Diagnostic Runs in Progress...</p>
              <p className="text-xs text-gray-400 max-w-md text-center">
                Generating hypotheses, executing isolated testcases in Docker, and isolating root cause logic.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-5 text-red-200 space-y-2">
              <h3 className="font-bold flex items-center gap-2">⚠️ Debugging Session Error</h3>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && diagnosisData && (
            <>
              {/* TAB 1: DIAGNOSIS */}
              {activeTab === 'diagnosis' && (
                <div className="space-y-5">
                  {/* Status & Failure Type Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4">
                      <span className="text-xs text-gray-400 block mb-1">Failure Category</span>
                      <span className="inline-block px-2.5 py-1 bg-red-500/20 border border-red-500/40 text-red-300 rounded font-semibold text-xs">
                        {diagnosis.failureType || "Logical Bug"}
                      </span>
                    </div>

                    <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4">
                      <span className="text-xs text-gray-400 block mb-1">Validation Status</span>
                      <span className={`inline-block px-2.5 py-1 rounded font-semibold text-xs border ${
                        diagnosis.candidateFixValidated 
                          ? 'bg-green-500/20 border-green-500/40 text-green-300'
                          : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                      }`}>
                        {diagnosis.candidateFixValidated ? "✅ Verified via Sample Testcase" : "⚠️ Candidate Fix Generated"}
                      </span>
                    </div>

                    <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4">
                      <span className="text-xs text-gray-400 block mb-1">Diagnostic Iterations</span>
                      <span className="text-lg font-bold text-indigo-300">
                        {diagnosis.iterations || 1} / 5
                      </span>
                    </div>
                  </div>

                  {/* Root Cause Card */}
                  <div className="bg-zinc-800/40 border border-indigo-500/30 rounded-xl p-5 space-y-2">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
                      🎯 Identified Root Cause
                    </h3>
                    <p className="text-gray-200 text-sm leading-relaxed font-medium">
                      {diagnosis.rootCause || diagnosis.diagnosis || "Algorithm logic bug detected."}
                    </p>
                  </div>

                  {/* Evidence Card */}
                  <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-5 space-y-2">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                      🔬 Execution Evidence
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {diagnosis.evidence || diagnosis.validationSummary || "Verified through diagnostic runs."}
                    </p>
                  </div>

                  {/* Suggested Fix Card */}
                  <div className="bg-zinc-800/40 border border-green-500/30 rounded-xl p-5 space-y-2">
                    <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider">
                      💡 Suggested Recommendation
                    </h3>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {diagnosis.suggestedFix || diagnosis?.candidateFix?.explanation || "Review loop conditions and boundaries."}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: CANDIDATE FIX & DIFF */}
              {activeTab === 'diff' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-xs">
                    <span className="text-gray-300">
                      {diagnosis.candidateFix?.explanation || "Candidate correction generated by Agent"}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-white font-semibold transition"
                      >
                        {copied ? "✓ Copied!" : "📋 Copy Fix"}
                      </button>
                      {onApplyFix && (
                        <button
                          onClick={handleApply}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-white font-bold transition"
                        >
                          🚀 Apply to Code Editor
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Side-by-Side Code View */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col">
                      <span className="text-xs font-bold text-red-400 mb-2">Original Code (With Bug)</span>
                      <pre className="text-xs font-mono text-gray-300 overflow-x-auto p-2 bg-zinc-900/80 rounded flex-1">
                        <code>{originalCode || diagnosisData.sourceCode || "// Original code unavailable"}</code>
                      </pre>
                    </div>

                    <div className="bg-zinc-950 border border-green-900/60 rounded-xl p-3 flex flex-col">
                      <span className="text-xs font-bold text-green-400 mb-2">Agent Suggested Fix</span>
                      <pre className="text-xs font-mono text-green-200 overflow-x-auto p-2 bg-zinc-900/80 rounded flex-1">
                        <code>{candidateFixCode || "// Candidate fix code generated"}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400">Agent Iteration & Hypothesis Log:</h3>
                  {hypotheses.map((h: any, index: number) => {
                    const run = diagnosticRuns[index]?.result;
                    return (
                      <div key={index} className="bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400 uppercase">
                            Iteration {h.iteration || index + 1}
                          </span>
                          <span className="text-xs text-gray-400">
                            Confidence: {Math.round((h.confidence || 0.8) * 100)}%
                          </span>
                        </div>

                        <p className="text-sm text-gray-200 font-medium">
                          <strong>Hypothesis:</strong> {h.hypothesis}
                        </p>

                        {h.diagnosticInput && (
                          <div className="text-xs bg-zinc-900 p-2 rounded border border-zinc-800 font-mono">
                            <span className="text-gray-400 block">Diagnostic Stdin:</span>
                            <span className="text-amber-300">{h.diagnosticInput}</span>
                          </div>
                        )}

                        {run && (
                          <div className="text-xs bg-zinc-950 p-2 rounded border border-zinc-800 font-mono">
                            <span className="text-gray-400 block">Diagnostic Output ({run.executionTimeMs}ms):</span>
                            {run.error ? (
                              <span className="text-red-400">{run.error}</span>
                            ) : (
                              <span className="text-green-300">{run.output || "(empty stdout)"}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/70">
          <span className="text-xs text-gray-500">
            Powered by LangGraph Agent Orchestration & MCP Security Protocol
          </span>
          <div className="flex space-x-3">
            {candidateFixCode && onApplyFix && !loading && (
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-white font-bold text-sm transition shadow-md"
              >
                Apply Fix to Editor
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-gray-200 font-semibold text-sm transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
