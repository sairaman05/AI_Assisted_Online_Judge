import React from "react";

export default function ProblemSelector({
  problems,
  selectedIndex,
  setSelectedIndex,
  setCode,
  setInput,
  setOutput,
  setSimilarityScore,
  setIsSubmitDisabled,
  setLanguage,
  fiascode, // receive fiascode as a prop
}) {
  const languageBoilerplates = {
    py: "# Write your Python code here\n",
    java: `public class Main {\n  public static void main(String[] args) {\n    // Write your Java code here\n  }\n}\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  // Write your C++ code here\n  return 0;\n}\n`,
  };

  const handleSelect = (index) => {
    const selProb = problems[index];
    let baseCode = selProb.codeBase && selProb.codeBase.trim() !== ""
      ? selProb.codeBase
      : ""; // empty if no codeBase

    // Override with boilerplate if fiascode is false (means no original codeBase)
    if (fiascode === false) {
      // Here, default to Python boilerplate, extend as needed per problem language if available
      baseCode = languageBoilerplates["py"];
    }

    setSelectedIndex(index);
    setCode(baseCode);
    setInput("");
    setOutput("");
    setSimilarityScore(100);
    setIsSubmitDisabled(false);
    setLanguage("py");
  };

  return (
    <ul className="overflow-y-auto flex-1">
      {problems.map((p, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <li
            key={p.id}
            onClick={() => handleSelect(idx)}
            className={`cursor-pointer px-5 py-4 border-b border-zinc-800 select-none transition-colors
              ${
                isSelected
                  ? "bg-indigo-600/20 border-r-4 border-indigo-500 text-white font-semibold"
                  : "text-gray-300 hover:bg-indigo-700/10 hover:text-white"
              }
            `}
            title={p.description || ""}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelect(idx);
              }
            }}
          >
            <div className="flex justify-between items-center space-x-2">
              <span className="whitespace-normal break-words">
                {p.title}
              </span>
              <span className="ml-2 bg-indigo-800 px-2 py-0.5 rounded text-xs font-semibold">
                {p.score} pts
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
