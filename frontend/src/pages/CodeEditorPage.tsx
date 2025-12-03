import React, { useEffect, useState, useContext } from "react";
import { readUser } from "../api/users";
import { readProblems } from "../api/problems";
import { readContests } from "../api/contests";
import { AuthContext } from "../api/authuser";
import HeaderControls from "../components/HeaderControls";
import ProblemSelector from "../components/ProblemSelector";
import ProblemDetails from "../components/ProblemDetails";
import OutputConsole from "../components/OutputConsole";
import InputBox from "../components/InputBox";
import EditorPanel from "../components/EditorPanel";
import LeaderboardPage from "./Leaderboard";
import ContestRegisterPage from "./ContestPage";
import SubmissionsPage from "./SubmissionsPage";
import { submitCode, runCode } from "../api/compiler";
import { useContestSession } from "../api/CreateSessionContext";

import {
  fetchAiAssistanceEnabled,
  generateAIHint,
} from "../api/aiService";

// Dice Coefficient utility
function diceCoefficient(str1: string, str2: string): number {
  if (!str1.length || !str2.length) return 0;
  const bigrams = (s: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.substring(i, i + 2).toLowerCase();
      map.set(bg, (map.get(bg) ?? 0) + 1);
    }
    return map;
  };
  const sumValues = (map: Map<string, number>): number => {
    let sum = 0;
    for (const count of map.values()) sum += count;
    return sum;
  };
  const map1 = bigrams(str1);
  const map2 = bigrams(str2);
  let intersection = 0;
  for (const [bg, count] of map1.entries()) {
    if (map2.has(bg)) intersection += Math.min(count, map2.get(bg)!);
  }
  const total = sumValues(map1) + sumValues(map2);
  if (total === 0) return 0;
  return (2 * intersection) / total;
}

export default function CodeEditorPage() {

  const [fiascode, setFiascode] = useState<boolean>(true);
  const { user } = useContext(AuthContext);
  const userId = user?.sub || "";
  const userName = user?.name || "";

  const [problems, setProblems] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [userContestId, setUserContestId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [code, setCode] = useState<string>("");
  const [OGcode, setOGCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("py");
  const [output, setOutput] = useState<string>("");
  const [input, setInput] = useState<string>("");

  const [similarityScore, setSimilarityScore] = useState<number>(0);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(true);

  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showContestRegister, setShowContestRegister] = useState<boolean>(false);
  const [showSubmissions, setSubmissions] = useState(false);

  const [codeInitialized, setCodeInitialized] = useState<boolean>(false);
  //Admin testing privilege
  const [adminTestMode, setAdminTestMode] = useState(false);
  const [testProblemId, setTestProblemId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);  // 👈 ADD THIS
  const auth = useContext(AuthContext);

  // 👇 FIX: Move isAdmin to useEffect
  useEffect(() => {
    if (auth?.type === "admin") {
      setIsAdmin(true);
      console.log("👑 ADMIN DETECTED");
    } else {
      setIsAdmin(false);
      console.log("👤 Regular User");
    }
  }, [auth?.type]);
  console.log(isAdmin);
  const { timeLeft } = useContestSession();

  const formatTime = (): string => {
    if (timeLeft === null) return "";
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  // AI Assistance hooks
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHint, setAiHint] = useState("");

  // Fetch AI Assistance enabled flag on userId change
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const enabled = await fetchAiAssistanceEnabled();
        setAiEnabled(enabled);
      } catch (e) {
        setAiEnabled(false);
        console.error("Failed to fetch AI assistance toggle", e);
      }
    })();
  }, [userId]);
  // Data fetch
  useEffect(() => {
    if (!userId) return;
    async function fetchAllData() {
      try {
        const [userData, problemData, contestData] = await Promise.all([
          readUser(userId),
          readProblems(),
          readContests(),
        ]);
        setUserContestId(userData?.contest || null);

        const normalizedContests = (contestData || []).map((c) => ({
          ...c,
          problems: c.problems || [],
          id: c.id || c._id,
        }));

        setContests(normalizedContests);
        setProblems(problemData);
        setCodeInitialized(false);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    }
    fetchAllData();
  }, [userId]);

  const currentContest = contests.find((c) => c.id === userContestId);
  const allContestProblemIds = new Set<string>(contests.flatMap((c) => c.problems || []));

  // Is contest live
  const isContestLive =
    currentContest && currentContest.start && currentContest.end
      ? (() => {
        const now = new Date();
        const start = new Date(currentContest.start);
        const end = new Date(currentContest.end);
        return now >= start && now <= end;
      })()
      : false;

  // Filtered problems
  // 👇 REPLACE your entire filtered problems section with this:
  let filteredProblems = problems;

  // Regular users: contest/practice filtering (unchanged)
  if (!isAdmin) {
    if (userContestId && isContestLive) {
      filteredProblems = problems.filter((p) => currentContest?.problems.includes(p.id));
    } else {
      filteredProblems = problems.filter((p) => !allContestProblemIds.has(p.id));
    }
  } else if (adminTestMode) {
    // 👑 ADMIN TEST MODE: ALL problems (no filtering)
    filteredProblems = problems;
  } else {
    // Admin normal mode: same as regular user
    if (userContestId && isContestLive) {
      filteredProblems = problems.filter((p) => currentContest?.problems.includes(p.id));
    } else {
      filteredProblems = problems.filter((p) => !allContestProblemIds.has(p.id));
    }
  }

  // Specific test override (if you add per-problem testing later)
  if (isAdmin && adminTestMode && testProblemId) {
    const targetProblem = problems.find(p => p.id === testProblemId);
    filteredProblems = targetProblem ? [targetProblem] : [];
  }



  // Code/selection init
  useEffect(() => {
    if (filteredProblems.length === 0) {
      setSelectedIndex(null);
      setOGCode("");
      setCode("");
      setSimilarityScore(0);
      setIsSubmitDisabled(true);
      setInput("");
      setOutput("");
      setCodeInitialized(true);
      setAiHint("");
      setFiascode(false);
      return;
    }
    if (!codeInitialized) {
      const firstProblemCode = filteredProblems[0].codeBase || "";
      setSelectedIndex(0);
      setOGCode(firstProblemCode);
      setCode(firstProblemCode);
      setSimilarityScore(100);
      setIsSubmitDisabled(false);
      setLanguage("py");
      setInput("");
      setOutput("");
      setCodeInitialized(true);
      setAiHint("");
      setFiascode(firstProblemCode.trim() !== "");
    }
  }, [filteredProblems, codeInitialized]);


  // Similarity / submit enabled logic
  useEffect(() => {
    if (selectedIndex === null || !filteredProblems[selectedIndex]) {
      setSimilarityScore(0);
      setIsSubmitDisabled(true);
      setAiHint("");
      return;
    }
    const prob = filteredProblems[selectedIndex];
    const similarity = diceCoefficient(prob.codeBase || "", code);
    const scorePercent = Math.round(similarity * 100);

    setSimilarityScore(scorePercent);
    setIsSubmitDisabled(scorePercent < (prob.constraintLimit || 0));
  }, [code, selectedIndex, filteredProblems]);
  // 👇 REPLACE your current URL useEffect with this:
  useEffect(() => {
    console.log("🔍 URL Check:", window.location.search);
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminTest = urlParams.get("isAdminTest") === "true";

    console.log("🔍 URL Parsed:", { isAdminTest, fullSearch: window.location.search });

    if (isAdmin && isAdminTest) {
      setAdminTestMode(true);
      console.log("🧪 ADMIN TEST MODE ACTIVATED!");
    } else {
      setAdminTestMode(false);
      setTestProblemId(null);
    }
  }, [isAdmin, problems]); // 👈 Key: problems dependency




  // Submit handler
  const handleSubmit = async () => {
    if (selectedIndex === null) {
      alert("Please select a problem before submitting.");
      return;
    }
    if (/\braise\b/i.test(code) || /\bthrow\b/i.test(code)) {
      alert("Submission not allowed: code must not contain 'raise' or 'throw' keywords.");
      return;
    }
    const prob = filteredProblems[selectedIndex];
    const langMap = { py: "py", python: "py", java: "java", cpp: "cpp", "c++": "cpp" };
    const lang = langMap[language.toLowerCase()] || "py";

    try {
      const response = await submitCode(lang, code, prob.id, userId, userContestId, userName, input);
      setOutput(response.output || response.error || "Unknown error");
    } catch (error) {
      setOutput("Submission failed.");
      console.error(error);
    }
  };

  // Run handler
  const handleRun = async () => {
    if (selectedIndex === null) {
      alert("Please select a problem before running.");
      return;
    }
    const langMap = { py: "py", python: "py", java: "java", cpp: "cpp", "c++": "cpp" };
    const lang = langMap[language.toLowerCase()] || "py";
    try {
      const response = await runCode(lang, code, input);
      setOutput(response.output || response.error || "Unknown error");
    } catch (error) {
      setOutput("Run failed." + (error.message || error.toString()));
      console.error(error);
    }
  };

  // AI Hint handler
  async function handleGenerateAIHint() {
    if (selectedIndex === null) return;
    const prob = filteredProblems[selectedIndex];
    setAiLoading(true);
    setAiHint("");
    try {
      const hint = await generateAIHint(prob.description || "", prob.codeBase || "");
      setAiHint(hint);
    } catch (e) {
      setAiHint("Failed to generate hint.");
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }

  if (showLeaderboard) {
    return (
      <LeaderboardPage contestId={userContestId || ""} contests={contests} />
    );
  }
  if (showContestRegister) {
    return (
      <ContestRegisterPage />
    );
  }
  if (showSubmissions) {
    return (
      <SubmissionsPage
        userId={userId}
        problems={problems}
        onBack={() => setSubmissions(false)}
      />
    );
  }

  // *** NEW UI STYLING (only a layout change, feature parity remains) ***
  return (
    <div className="flex flex-col md:flex-row h-screen relative bg-gradient-to-br from-[#1e202f] to-[#2c2d40] text-white font-sans">

      {/* Sidebar backdrop to close on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (overlay, responsive width) */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-zinc-900 shadow-2xl rounded-r-lg flex flex-col
        transform transition-transform duration-300 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        w-[70%] sm:w-[50%] md:w-[30%] lg:w-[22%]`}
      >
        {/* Close button only on mobile */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800 md:hidden">
          <h2 className="text-lg font-bold text-white">Problems</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Problem List"
            className="text-white hover:text-red-400 text-2xl"
          >
            ✖
          </button>
        </div>

        <ProblemSelector
          problems={filteredProblems}
          selectedIndex={selectedIndex}
          setSelectedIndex={(idx) => {
            setSelectedIndex(idx);
            setSidebarOpen(false);
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
          setCode={setCode}
          setInput={setInput}
          setOutput={setOutput}
          setSimilarityScore={setSimilarityScore}
          setIsSubmitDisabled={setIsSubmitDisabled}
          setLanguage={setLanguage}
          fiascode={fiascode}
        />
      </aside>

      {/* Left Pane */}
      <div className="flex-[0.50] flex flex-col p-4 md:p-6 overflow-y-auto space-y-6">
        <HeaderControls
          language={language}
          setLanguage={setLanguage}
          code={code}
          OGcode={OGcode}
          setCode={setCode}
          fiascode={fiascode}
          problems={filteredProblems}
          selectedIndex={selectedIndex}
          setShowLeaderboard={setShowLeaderboard}
          setShowContestRegister={setShowContestRegister}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        {/* 👇 ADD THIS INDICATOR */}
        {isAdmin && adminTestMode && (
          <div className="mx-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-2xl backdrop-blur-sm shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">👑</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-green-300">ADMIN TEST MODE ACTIVE</h3>
                <p className="text-green-200 text-sm">{filteredProblems.length} problems visible (All Access)</p>
              </div>
            </div>
          </div>
        )}

        {selectedIndex !== null && filteredProblems[selectedIndex] ? (
          <div className="mt-6 flex-1 min-h-[30%]">
            <ProblemDetails problem={filteredProblems[selectedIndex]} />
          </div>
        ) : (
          <p className="text-center text-gray-400 mt-10 select-none">
            Please select a problem to see details
          </p>
        )}

        {/* Controls and Submissions button container */}
        <div className="flex items-center justify-between mb-2 w-full">
          <button
            onClick={handleGenerateAIHint}
            disabled={aiLoading}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1.5 text-sm inline-flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Get minimal AI hint"
          >
            {aiLoading ? "Generating hint..." : "💡 Get hint"}
          </button>

          <button
            onClick={() => setSubmissions(true)}
            className="cursor-pointer px-3 py-2 bg-green-600 rounded text-white hover:bg-green-700 text-sm"
          >
            Submissions
          </button>
        </div>

        {/* AI hint text preview */}
        {aiEnabled && selectedIndex !== null && aiHint && (
          <pre className="bg-zinc-800 rounded p-3 max-h-48 overflow-auto whitespace-pre-wrap text-sm w-full">
            {aiHint}
          </pre>
        )}

        {/* InputBox */}
        <div className="flex items-center space-x-4 relative w-full">
          <InputBox input={input} setInput={setInput} className="flex-1 w-full" />
        </div>

        {/* Output Console */}
        <div className="mb-6 w-full max-h-64 overflow-auto rounded bg-zinc-900 text-sm font-mono text-white">
          <OutputConsole output={output} />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-[0.5] flex flex-col p-4 md:p-6 h-full">

        <EditorPanel
          code={code}
          setCode={setCode}
          language={language}
          similarityScore={similarityScore}
          isSubmitDisabled={isSubmitDisabled}
          runHandler={handleRun}
          submitHandler={handleSubmit}
          fiascode={fiascode}
        />
        {timeLeft !== null && (
          <div className="fixed bottom-7 right-7 bg-gray-700 rounded px-4 py-2 text-white font-mono text-lg z-50">
            Time left: {formatTime()}
          </div>
        )}

      </div>
    </div>
  );


}
