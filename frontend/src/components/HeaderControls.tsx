import React, { useState, useContext } from "react";
import { AuthContext } from "../api/authuser";

export default function HeaderControls({
  language,
  setLanguage,
  code,
  OGcode,
  setCode,
  fiascode,
  setShowLeaderboard,
  setShowContestRegister,
  setSidebarOpen,
}) {
  const auth = useContext(AuthContext);
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
      {/* Problems toggle button */}
      <button
        onClick={() =>
          handleClickWithFeedback("problems", () =>
            setSidebarOpen((prev) => !prev)
          )
        }
        className="cursor-pointer flex-1 min-w-[15%] py-2 bg-indigo-700 rounded text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        Problems
      </button>

      {/* Language selector */}
      <select
        value={language}
        onChange={handleLanguageChange}
        className="cursor-pointer flex-1 min-w-[15%] py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-center"
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
          className="cursor-pointer flex-1 min-w-[15%] py-2 bg-green-600 rounded text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          Copy Code
        </button>
      )}

      {/* Register for Contests button */}
      <button
        onClick={() =>
          handleClickWithFeedback("register", () => setShowContestRegister(true))
        }
        className="cursor-pointer flex-1 min-w-[20%] py-2 bg-teal-600 rounded text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        Register Contests 
      </button>

      {/* Leaderboard button */}
      <button
        onClick={() =>
          handleClickWithFeedback("leaderboard", () => setShowLeaderboard(true))
        }
        className="cursor-pointer flex-1 min-w-[15%] py-2 bg-green-600 rounded text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        Leaderboard
      </button>

      {/* Logout button */}
      {auth?.isAuthenticated && (
        <button
          onClick={() => auth.logout()}
          className="cursor-pointer py-2 px-3 bg-red-600 rounded text-white hover:bg-red-700 font-semibold transition"
          title="Logout of active session"
        >
          Logout
        </button>
      )}
    </div>
  );
}
