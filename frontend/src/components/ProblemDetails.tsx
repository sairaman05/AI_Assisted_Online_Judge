import React from "react";

export default function ProblemDetails({ problem }: { problem: any }) {
  if (!problem) {
    return (
      <p className="text-center text-gray-400 select-none mt-10 text-sm">
        Select a problem to see details
      </p>
    );
  }

  // Combine publicTestcases or fallback to testcases (up to 3 public examples)
  const visibleExamples = problem.publicTestcases && problem.publicTestcases.length > 0
    ? problem.publicTestcases.slice(0, 3)
    : (problem.testcases || []).slice(0, 3);

  const getDifficultyColor = (diff: string = "Medium") => {
    switch (diff.toLowerCase()) {
      case "easy":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "hard":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    }
  };

  return (
    <section className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-xl space-y-4 font-sans">
      {/* Header & Badges */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-white">{problem.title}</h2>
        <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${getDifficultyColor(problem.difficulty)}`}>
          {problem.difficulty || "Medium"}
        </span>
      </div>

      {/* Tags */}
      {problem.tags && problem.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {problem.tags.map((tag: string, idx: number) => (
            <span key={idx} className="text-[11px] bg-gray-800 text-gray-400 px-2.5 py-0.5 rounded border border-gray-700 font-mono">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Problem Statement */}
      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
        {(() => {
          if (!problem.description || problem.description.includes("<Clean Markdown")) {
            return `Solve the classic "${problem.title || "Algorithmic"}" challenge. Read inputs from standard input and write the computed output to standard output.`;
          }
          return problem.description.replace(/\\n/g, "\n");
        })()}
      </div>

      {/* 3 Public Example Test Cases */}
      {visibleExamples.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-gray-800">
          <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-400">
            Public Example Test Cases ({visibleExamples.length})
          </h3>

          <div className="space-y-3">
            {visibleExamples.map((tc: any, i: number) => (
              <div key={i} className="bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs space-y-1.5 font-mono">
                <span className="font-bold text-yellow-300 text-[11px] block">Example {i + 1}</span>
                <div>
                  <strong className="text-gray-400">Input:</strong>
                  <pre className="text-gray-200 bg-gray-900 p-1.5 rounded mt-0.5 whitespace-pre-wrap">{tc.input ? String(tc.input).trim() : ""}</pre>
                </div>
                <div>
                  <strong className="text-gray-400">Output:</strong>
                  <pre className="text-emerald-400 bg-gray-900 p-1.5 rounded mt-0.5 whitespace-pre-wrap">{tc.output ? String(tc.output).trim() : ""}</pre>
                </div>
                {tc.explanation && (
                  <p className="text-gray-400 text-[11px] font-sans italic mt-1">
                    <strong className="text-indigo-400 not-italic">Explanation:</strong> {tc.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
