import React, { useState, useContext } from "react";
import { AuthContext } from "../api/authuser";
import { useNavigate } from "react-router-dom";

export default function HeaderControls({
  language,
  setLanguage,
  code,
  OGcode,
  setCode,
  fiascode,
  setShowLeaderboard,
  setShowContestRegister,
  sidebarOpen,
  setSidebarOpen,
}) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [clickedButton, setClickedButton] = useState(null);

  const handleClickWithFeedback = (buttonKey, callback) => {
    setClickedButton(buttonKey);
    if (callback) callback();
    setTimeout(() => setClickedButton(null), 500);
  };

  const languageBoilerplates = {
    py: "# Write your Python code here\n",
    java: `public class Main {\n  public static void main(String[] args) {\n    // Write your Java code here\n  }\n}\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  // Write your C++ code here\n  return 0;\n}\n`,
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    handleClickWithFeedback("language", () => {
      setLanguage(newLang);

      if (fiascode === false) {
        setCode(languageBoilerplates[newLang] || "");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 w-full">
      {/* All Problems List Link */}
      <button
        onClick={() => navigate("/problems")}
        className="cursor-pointer py-2 px-3 bg-indigo-600 rounded text-white hover:bg-indigo-500 font-semibold text-xs transition"
        title="Back to Problems List"
      >
        📚 All Problems
      </button>

      {/* Problems sidebar toggle button */}
      <button
        onClick={() =>
          handleClickWithFeedback("problems", () =>
            setSidebarOpen((prev) => !prev)
          )
        }
        className="cursor-pointer py-2 px-3 bg-gray-800 border border-gray-700 rounded text-gray-200 hover:bg-gray-700 text-xs"
      >
        Select Problem
      </button>

      {/* Language selector */}
      <select
        value={language}
        onChange={handleLanguageChange}
        className="cursor-pointer py-2 px-2 rounded bg-gray-800 text-white text-xs border border-gray-700 focus:outline-none"
      >
        <option value="py">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
      </select>

      {/* Copy code button */}
      {fiascode !== false && (
        <button
          onClick={() =>
            handleClickWithFeedback("copyCode", () => {
              navigator.clipboard.writeText(OGcode);
            })
          }
          className="cursor-pointer py-2 px-3 bg-emerald-600/80 rounded text-white hover:bg-emerald-600 text-xs"
        >
          Copy Code
        </button>
      )}

      {/* Contests button */}
      <button
        onClick={() => navigate("/contests")}
        className="cursor-pointer py-2 px-3 bg-teal-600 rounded text-white hover:bg-teal-500 text-xs font-semibold"
      >
        Contests
      </button>

      {/* Leaderboard button */}
      <button
        onClick={() =>
          handleClickWithFeedback("leaderboard", () => setShowLeaderboard(true))
        }
        className="cursor-pointer py-2 px-3 bg-indigo-700 rounded text-white hover:bg-indigo-600 text-xs font-semibold"
      >
        Leaderboard
      </button>
    </div>
  );
}
