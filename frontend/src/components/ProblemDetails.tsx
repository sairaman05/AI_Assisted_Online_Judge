import React from "react";

export default function ProblemDetails({ problem }) {
  if (!problem) {
    return (
      <p className="text-center text-gray-400 select-none mt-10 text-sm">
        Select a problem to see details
      </p>
    );
  }

  return (
    <section className="bg-gray-800 p-4 rounded-md shadow-md overflow-auto max-h-[100%]">
      <h2 className="text-lg font-semibold mb-3">{problem.title}</h2>
      <p className="mb-4 text-sm whitespace-pre-wrap">
        {problem.description.replace(/\\n/g, "\n")}
      </p>

      <h3 className="font-medium mb-1 text-base border-b border-gray-700 pb-1">
        Constraints
      </h3>
      <p className="mb-4 text-sm">{problem.constraintLimit}%</p>

      {problem.testcases.length > 1 && (
        <>
          <h3 className="font-medium mb-1 text-base border-b border-gray-700 pb-1">
            Test Cases
          </h3>
          <ul className="list-disc list-inside max-h-36 overflow-y-auto space-y-2 text-xs">
            {problem.testcases.slice(0, 2).map((tc, i) => (
              <li key={i} className="bg-gray-700 p-2 rounded-sm shadow-sm">
                <p className="leading-snug whitespace-pre-wrap">
                  <strong>Input:</strong> {tc.input.replace(/\\n/g, "\n")}
                </p>
                <p className="leading-snug whitespace-pre-wrap">
                  <strong>Output: </strong> {"\n"+tc.output.replace(/\\n/g, "\n")}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
