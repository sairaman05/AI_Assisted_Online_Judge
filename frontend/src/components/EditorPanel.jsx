import React, { useState } from "react";
import Editor from "@monaco-editor/react";

export default function EditorPanel({
  code,
  setCode,
  language,
  similarityScore,
  isSubmitDisabled,
  runHandler,
  submitHandler,
}) {
  const [clickedButton, setClickedButton] = useState(null);

  const handleClickWithFeedback = (buttonKey, callback) => {
    setClickedButton(buttonKey);
    if (callback) callback();
    setTimeout(() => setClickedButton(null), 300);
  };

  const getButtonClass = (key, baseClasses, disabled) => {
    let classes = baseClasses;
    if (disabled) {
      return "flex-1 rounded py-3 font-semibold text-white bg-gray-600 cursor-not-allowed opacity-60";
    } else if (clickedButton === key) {
      classes = classes
        .replace(/bg-blue-600/, "bg-yellow-400")
        .replace(/hover:bg-blue-700/, "hover:bg-yellow-500")
        .replace(/bg-green-600/, "bg-yellow-400")
        .replace(/hover:bg-green-700/, "hover:bg-yellow-500");
      classes += " ring-4 ring-yellow-300 scale-105 transform transition-transform";
    }
    return classes;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex space-x-4 items-center">
        <button
          type="button"
          disabled={isSubmitDisabled}
          onClick={() => handleClickWithFeedback("run", runHandler)}
          className={getButtonClass(
            "run",
            "cursor-pointer flex-1 rounded py-3 font-semibold text-white transition duration-200 bg-blue-600 hover:bg-blue-700",
            isSubmitDisabled
          )}
          title={isSubmitDisabled ? "Disabled due to low similarity" : ""}
          aria-label="Run code"
        >
          Run
        </button>

        <button
          type="button"
          disabled={isSubmitDisabled}
          onClick={() => handleClickWithFeedback("submit", submitHandler)}
          className={getButtonClass(
            "submit",
            "cursor-pointer flex-1 rounded py-3 font-semibold text-white transition duration-200 bg-green-600 hover:bg-green-700",
            isSubmitDisabled
          )}
          title={isSubmitDisabled ? "Disabled due to low similarity" : ""}
          aria-label="Submit code"
        >
          Submit
        </button>

        <div className="text-white font-mono select-none" aria-label="Similarity score">
          {similarityScore}%
        </div>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          width="100%"
          language={language === "py" ? "python" : language}
          value={code}
          onChange={setCode}
          theme="vs-dark"
          options={{
            fontSize: 16,
            fontFamily: "'Fira Mono', monospace",
            minimap: { enabled: false },
            padding: { top: 12 },
          }}
          aria-label="Code editor"
        />
      </div>
    </div>
  );
}
