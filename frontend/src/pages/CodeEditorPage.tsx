import React, { useEffect, useState, useContext, useRef } from "react";
import { readUser } from "../api/users";
import { readProblems } from "../api/problems";
import { readContests, fetchParticipantGuidance } from "../api/contests";
import { AuthContext } from "../api/authuser";
import HeaderControls from "../components/HeaderControls";
import ProblemSelector from "../components/ProblemSelector";
import ProblemDetails from "../components/ProblemDetails";
import OutputConsole from "../components/OutputConsole";
import EditorPanel from "../components/EditorPanel.jsx";
import LeaderboardPage from "./Leaderboard";
import ContestRegisterPage from "./ContestPage";
import SubmissionsPage from "./SubmissionsPage";
import { submitCode, runCode } from "../api/compiler";
import { useContestSession } from "../api/CreateSessionContext";
import DebuggingModal from "../components/DebuggingModal";
import { startDebugSession } from "../api/agents";
import Navbar from "../components/Navbar";

import {
  fetchAiAssistanceEnabled,
} from "../api/aiService";

interface TimedHintItem {
  hintLevel: number;
  hintTitle: string;
  hintText: string;
  keyConcept: string;
  generatedAt: string;
}

export default function CodeEditorPage() {
  const [fiascode, setFiascode] = useState<boolean>(true);
  const { user } = useContext(AuthContext);
  const userId = user?.sub || user?.id || user?.email || "anonymous_user";
  const userName = user?.name || user?.email || "";

  const [problems, setProblems] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [userContestId, setUserContestId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [code, setCode] = useState<string>("");
  const [OGcode, setOGCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("py");
  const [output, setOutput] = useState<string>("");

  const [similarityScore, setSimilarityScore] = useState<number>(0);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(false);

  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showContestRegister, setShowContestRegister] = useState<boolean>(false);
  const [showSubmissions, setSubmissions] = useState(false);

  const [codeInitialized, setCodeInitialized] = useState<boolean>(false);
  const [adminTestMode, setAdminTestMode] = useState(false);
  const [testProblemId, setTestProblemId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [aiEnabled, setAiEnabled] = useState(true);

  // Timed Progressive AI Hint State (2, 4, 6, 8, 10 minutes)
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [hintHistory, setHintHistory] = useState<TimedHintItem[]>([]);
  const [hintLoading, setHintLoading] = useState(false);
  const [publishedParticipantGuidance, setPublishedParticipantGuidance] = useState<any[]>([]);

  // Deep AI Debugger State
  const [wrongDebuggerData, setWrongDebuggerData] = useState<any | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  // Accepted AI Analysis State
  const [acceptedAnalysis, setAcceptedAnalysis] = useState<any | null>(null);
  const [alternativeAnalysis, setAlternativeAnalysis] = useState<any | null>(null);
  const [acceptedLoading, setAcceptedLoading] = useState(false);
  const [analysisTab, setAnalysisTab] = useState<"analysis" | "alternative" | "walkthrough">("analysis");

  const auth = useContext(AuthContext);
  const backendIp = import.meta.env.VITE_BACKEND_IP || "http://localhost:5174";

  useEffect(() => {
    if (auth?.type === "admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [auth?.type]);

  const { timeLeft } = useContestSession();

  const formatTime = (): string => {
    if (timeLeft === null) return "";
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    fetchAiAssistanceEnabled()
      .then((val) => setAiEnabled(val))
      .catch(() => setAiEnabled(true));
  }, []);

  useEffect(() => {
    readProblems().then((data) => {
      if (Array.isArray(data)) setProblems(data);
    });
    readContests().then((data) => {
      if (Array.isArray(data)) setContests(data);
    });
    if (userId) {
      readUser(userId).then((userData) => {
        if (userData && userData.contest) {
          setUserContestId(userData.contest);
        }
      });
    }
  }, [userId]);

  const currentContest = contests.find((c) => c.id === userContestId);
  const isContestLive =
    currentContest && currentContest.start && currentContest.end
      ? (() => {
          const now = new Date();
          const start = new Date(currentContest.start);
          const end = new Date(currentContest.end);
          return now >= start && now <= end;
        })()
      : false;

  const urlParams = new URLSearchParams(window.location.search);
  const isContestMode = urlParams.get("isContest") === "true";

  let filteredProblems = problems;
  if (!isAdmin && userContestId && isContestLive && isContestMode) {
    filteredProblems = problems.filter((p) => currentContest?.problems.includes(p.id));
  }

  const getCleanStarterCode = (prob: any) => {
    if (prob?.codeBase && prob.codeBase.trim() !== "" && !prob.codeBase.startsWith("<") && !prob.codeBase.includes("<Starter") && (prob.codeBase.includes("def ") || prob.codeBase.includes("#"))) {
      return prob.codeBase;
    }
    return `# Write your Python solution here\nimport sys\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    # Implement solution here\n    pass\n\nif __name__ == "__main__":\n    solve()\n`;
  };

  // Handle URL Problem Selection
  useEffect(() => {
    const targetProblemId = urlParams.get("problemId");
    const isAdminTest = urlParams.get("isAdminTest") === "true";

    if (isAdmin && isAdminTest) {
      setAdminTestMode(true);
    }

    if (targetProblemId && problems.length > 0) {
      const idx = problems.findIndex((p) => p.id === targetProblemId || p._id === targetProblemId);
      if (idx !== -1) {
        setSelectedIndex(idx);
        const prob = problems[idx];
        const starterCode = getCleanStarterCode(prob);
        setOGCode(starterCode);
        setCode(starterCode);
        setCodeInitialized(true);
      }
    }
  }, [problems, isAdmin]);

  // Code/selection initialization
  useEffect(() => {
    if (filteredProblems.length === 0) {
      setSelectedIndex(null);
      setOGCode("");
      setCode("");
      setIsSubmitDisabled(true);
      setOutput("");
      setCodeInitialized(true);
      setWrongDebuggerData(null);
      setAcceptedAnalysis(null);
      setAlternativeAnalysis(null);
      setFiascode(false);
      return;
    }
    if (!codeInitialized && selectedIndex === null) {
      const firstProb = filteredProblems[0];
      const starterCode = getCleanStarterCode(firstProb);
      setSelectedIndex(0);
      setOGCode(starterCode);
      setCode(starterCode);
      setIsSubmitDisabled(false);
      setLanguage("py");
      setOutput("");
      setCodeInitialized(true);
      setWrongDebuggerData(null);
      setAcceptedAnalysis(null);
      setAlternativeAnalysis(null);
      setFiascode(true);
    }
  }, [filteredProblems, codeInitialized, selectedIndex]);

  // Enable/disable submit button
  useEffect(() => {
    setIsSubmitDisabled(!code || code.trim().length === 0);
  }, [code]);

  // ---------------------------------------------------------
  // TIMED AI HINT SESSION & COUNTDOWN TIMER (2/4/6/8/10 mins)
  // ---------------------------------------------------------
  useEffect(() => {
    if (selectedIndex === null || !filteredProblems[selectedIndex]) return;
    const prob = filteredProblems[selectedIndex];

    // Initialize or restore session from backend
    fetch(`${backendIp}/api/ai/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, problemId: prob.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSessionStartedAt(data.sessionStartedAt);
        setElapsedSeconds(data.elapsedSeconds || 0);
        setHintLevel(data.hintLevel || 0);
        setHintHistory(data.hintHistory || []);
      })
      .catch((err) => console.error("Failed to restore hint session:", err));

    // Live timer ticking every second
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedIndex, filteredProblems, userId]);

  // Fetch Live Published Contest AI Guidance for active participant & problem
  useEffect(() => {
    if (userContestId && selectedIndex !== null && filteredProblems[selectedIndex]) {
      const probId = filteredProblems[selectedIndex].id || filteredProblems[selectedIndex]._id;
      fetchParticipantGuidance(userContestId, userId, probId)
        .then((data) => {
          if (data && Array.isArray(data.guidance)) {
            setPublishedParticipantGuidance(data.guidance);
          } else {
            setPublishedParticipantGuidance([]);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch participant guidance:", err);
          setPublishedParticipantGuidance([]);
        });
    } else {
      setPublishedParticipantGuidance([]);
    }
  }, [userContestId, selectedIndex, filteredProblems, userId]);

  // Handle requesting a timed hint
  const handleRequestTimedHint = async (level: number) => {
    if (selectedIndex === null) return;
    const prob = filteredProblems[selectedIndex];
    setHintLoading(true);

    try {
      const res = await fetch(`${backendIp}/api/ai/timed-hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          problemId: prob.id,
          problemTitle: prob.title,
          problemDescription: prob.description,
          constraints: prob.constraintLimit ? `${prob.constraintLimit}% limit` : '',
          userCode: code,
          language,
          requestedLevel: level,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHintLevel((prev) => Math.max(prev, level));
        setHintHistory((prev) => {
          const exists = prev.find((h) => h.hintLevel === level);
          if (exists) return prev;
          return [...prev, data];
        });
      } else {
        const errData = await res.json();
        alert(errData.error || "Hint is currently locked.");
      }
    } catch (err: any) {
      console.error("Timed hint error:", err);
    } finally {
      setHintLoading(false);
    }
  };

  // ---------------------------------------------------------
  // WRONG SUBMISSION AI DEBUGGER HANDLER
  // ---------------------------------------------------------
  const handleTriggerAIDebugger = async (verdictStr: string, logStr: string) => {
    if (selectedIndex === null) return;
    const prob = filteredProblems[selectedIndex];
    setDebugLoading(true);

    try {
      const res = await fetch(`${backendIp}/api/ai/debug-submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          problemTitle: prob.title,
          problemDescription: prob.description,
          userCode: code,
          language,
          verdict: verdictStr,
          errorLog: logStr,
          testcaseInfo: prob.publicTestcases ? prob.publicTestcases[0] : {},
          provideCodeFix: true,
          userId,
          problemId: prob.id
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWrongDebuggerData(data);
      }
    } catch (err) {
      console.error("AI Debugger error:", err);
    } finally {
      setDebugLoading(false);
    }
  };

  // ---------------------------------------------------------
  // SUBMIT & ACCEPTED AI CODE ANALYSIS (Compiler Judge Authority)
  // ---------------------------------------------------------
  const handleSubmit = async () => {
    if (selectedIndex === null) {
      alert("Please select a problem before submitting.");
      return;
    }

    const prob = filteredProblems[selectedIndex];
    const langMap: Record<string, string> = { py: "py", python: "py", java: "java", cpp: "cpp", "c++": "cpp" };
    const lang = langMap[language.toLowerCase()] || "py";

    setWrongDebuggerData(null);
    setAcceptedAnalysis(null);
    setAlternativeAnalysis(null);

    setOutput("⏳ Submitting solution against testcase suite...");

    try {
      const response = await submitCode(lang, code, prob.id, userId, userContestId, userName, "");
      
      if (response?.error && !response?.success && !response?.output) {
        const errDetail = response.detail ? `\n\nDetail:\n${response.detail}` : '';
        setOutput(`❌ Submission Error:\n${response.error}${errDetail}`);
        handleTriggerAIDebugger(response.error, response.detail || response.error);
        return;
      }

      const outText = response?.output || response?.detail || response?.error || "Submission completed.";
      setOutput(outText);

      const isAccepted = response?.success === true || (response?.output && String(response?.output).toLowerCase().includes("all testcases passed"));

      if (isAccepted) {
        setAcceptedLoading(true);
        Promise.all([
          fetch(`${backendIp}/api/ai/analyze-accepted-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              problemTitle: prob.title,
              problemDescription: prob.description,
              acceptedCode: code,
              language,
              sampleTestcase: prob.publicTestcases ? prob.publicTestcases[0] : {},
              userId,
              problemId: prob.id
            }),
          }).then((r) => r.json()),
          fetch(`${backendIp}/api/ai/alternative-approaches`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              problemTitle: prob.title,
              problemDescription: prob.description,
              acceptedCode: code,
              language,
              userId,
              problemId: prob.id
            }),
          }).then((r) => r.json()),
        ])
          .then(([analysisData, altData]) => {
            setAcceptedAnalysis(analysisData);
            setAlternativeAnalysis(altData);
          })
          .catch((err) => console.error("Accepted analysis error:", err))
          .finally(() => setAcceptedLoading(false));
      } else {
        handleTriggerAIDebugger(response?.error || "Wrong Answer", outText);
      }
    } catch (error: any) {
      setOutput("Submission failed: " + (error?.message || error || ""));
    }
  };

  const handleRun = async () => {
    if (selectedIndex === null) {
      alert("Please select a problem before running.");
      return;
    }
    const prob = filteredProblems[selectedIndex];
    const langMap: Record<string, string> = { py: "py", python: "py", java: "java", cpp: "cpp", "c++": "cpp" };
    const lang = langMap[language.toLowerCase()] || "py";

    setOutput("⏳ Running code against visible example test cases...");
    try {
      const response = await runCode(lang, code, "", prob?.id);
      if (response?.error && !response?.output) {
        const detailStr = response?.detail ? `\n${response.detail}` : '';
        setOutput(`❌ Execution Error: ${response.error}${detailStr}`);
      } else {
        setOutput(response?.output || "(Code executed successfully with zero output produced.)");
      }
    } catch (error: any) {
      setOutput("Run failed: " + (error?.message || error || ""));
    }
  };

  const formatCountdown = (requiredSeconds: number) => {
    if (elapsedSeconds >= requiredSeconds) return "Available Now";
    const rem = requiredSeconds - elapsedSeconds;
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    return `Available in ${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (showLeaderboard) return <LeaderboardPage contestId={userContestId || ""} contests={contests} />;
  if (showContestRegister) return <ContestRegisterPage />;
  if (showSubmissions) {
    return (
      <SubmissionsPage
        userId={userId}
        problems={problems}
        onBack={() => setSubmissions(false)}
        onApplyFix={(newCode) => {
          setCode(newCode);
          setSubmissions(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans overflow-hidden">
      <Navbar />

      {/* Main Workspace */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
        
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />}

        <aside
          className={`fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } w-[70%] sm:w-[50%] md:w-[30%] lg:w-[22%]`}
        >
          <ProblemSelector
            problems={filteredProblems}
            selectedIndex={selectedIndex}
            setSelectedIndex={(idx) => {
              setSelectedIndex(idx);
              setSidebarOpen(false);
            }}
            setCode={setCode}
            setInput={() => {}}
            setOutput={setOutput}
            setSimilarityScore={setSimilarityScore}
            setIsSubmitDisabled={setIsSubmitDisabled}
            setLanguage={setLanguage}
            fiascode={fiascode}
          />
        </aside>

        {/* Left Pane: Problem Details, 2/4/6/8/10 Timed AI Hints & AI Debugger */}
        <div className="flex-[0.50] flex flex-col p-4 md:p-6 overflow-y-auto space-y-6 border-r border-gray-800">
          <HeaderControls
            language={language}
            setLanguage={setLanguage}
            code={code}
            OGcode={OGcode}
            setCode={setCode}
            fiascode={fiascode}
            setShowLeaderboard={setShowLeaderboard}
            setShowContestRegister={setShowContestRegister}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          {selectedIndex !== null && filteredProblems[selectedIndex] ? (
            <ProblemDetails problem={filteredProblems[selectedIndex]} />
          ) : (
            <p className="text-center text-gray-400 mt-10">Please select a problem to see details</p>
          )}

          {/* PUBLISHED AI CONTEST GUIDANCE INTERVENTION CARD */}
          {publishedParticipantGuidance && publishedParticipantGuidance.length > 0 && (
            <div className="bg-purple-950/40 border border-purple-500/50 p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
                <h3 className="text-sm font-extrabold text-purple-300 flex items-center gap-2">
                  <span>📡 AI Contest Master Guidance Intervention</span>
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-200 font-bold px-2.5 py-0.5 rounded border border-purple-500/30">
                  ✓ Intervention Unlocked
                </span>
              </div>

              <div className="space-y-3">
                {publishedParticipantGuidance.map((g: any, idx: number) => (
                  <div key={g.guidanceId || idx} className="bg-black/60 p-4 rounded-xl border border-purple-500/30 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300 font-bold">
                        Level {g.guidanceLevel || 1} Pedagogical Guidance
                      </span>
                      <span className="text-[10px] text-purple-400 font-mono font-semibold">
                        Contest Master AI
                      </span>
                    </div>
                    <p className="text-gray-200 leading-relaxed font-sans">{g.guidanceText}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TIMED PROGRESSIVE AI HINTS CARD (Single Active Timer + Unlocked History) */}
          {(() => {
            const allHintLevels = [
              { level: 1, reqSec: 120, title: "Hint 1: Conceptual Direction" },
              { level: 2, reqSec: 240, title: "Hint 2: Algorithmic Pattern" },
              { level: 3, reqSec: 360, title: "Hint 3: Code Logic Reasoning" },
              { level: 4, reqSec: 480, title: "Hint 4: Structural Insight" },
              { level: 5, reqSec: 600, title: "Hint 5: Near-Solution Guidance" },
            ];

            const currentNextHint = allHintLevels.find((h) => !hintHistory.some((item) => item.hintLevel === h.level));

            return (
              <div className="bg-gray-900 border border-indigo-500/30 p-5 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h3 className="text-sm font-extrabold text-yellow-300 flex items-center gap-2">
                    <span>💡 Timed AI Progressive Hint System</span>
                  </h3>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2.5 py-0.5 rounded border border-indigo-500/30 font-bold">
                    ⏱️ Elapsed: {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Active Upcoming Hint Timer (Shows ONLY 1 active timer at a time) */}
                {currentNextHint ? (
                  <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/40 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-indigo-300">
                        🎯 Next Hint: {currentNextHint.title}
                      </span>
                      {elapsedSeconds >= currentNextHint.reqSec || hintLevel >= currentNextHint.level ? (
                        <button
                          onClick={() => handleRequestTimedHint(currentNextHint.level)}
                          disabled={hintLoading}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg shadow cursor-pointer transition"
                        >
                          {hintLoading ? "Generating..." : "⚡ Unlock Hint Now"}
                        </button>
                      ) : (
                        <span className="text-xs bg-indigo-900/80 text-amber-300 font-mono px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold">
                          ⏳ Unlocks in {formatCountdown(currentNextHint.reqSec)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {elapsedSeconds >= currentNextHint.reqSec || hintLevel >= currentNextHint.level
                        ? "Timer complete! Click above to generate and view your AI progress hint."
                        : `Timer active. Continue solving and Hint ${currentNextHint.level} will unlock when countdown reaches 0:00.`}
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl text-center text-xs text-emerald-300 font-bold">
                    🎉 All 5 progressive hints have been unlocked for this problem!
                  </div>
                )}

                {/* Unlocked Hints List (Appends below as each 2-minute timer completes) */}
                {hintHistory.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-gray-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Unlocked Hints ({hintHistory.length} / 5)
                    </h4>

                    <div className="space-y-3">
                      {hintHistory.map((item) => (
                        <div key={item.hintLevel} className="bg-gray-950 p-4 rounded-xl border border-amber-500/30 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-amber-400 font-bold">{item.hintTitle || `Hint Level ${item.hintLevel}`}</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                              ✓ Unlocked
                            </span>
                          </div>
                          <p className="text-gray-200 leading-relaxed font-sans">{item.hintText}</p>
                          {item.keyConcept && (
                            <div className="text-[11px] bg-indigo-950/40 text-indigo-300 p-2 rounded border border-indigo-500/20 mt-1 font-mono">
                              <strong>Key Concept:</strong> {item.keyConcept}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Console Output */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Execution Output</h3>
            <div className="max-h-48 overflow-auto rounded-xl bg-gray-950 border border-gray-800 text-sm font-mono text-white p-3">
              <OutputConsole output={output} />
            </div>
          </div>

          {/* WRONG SUBMISSION AI DEBUGGER CARD */}
          {wrongDebuggerData && (
            <div className="bg-rose-950/40 border border-rose-500/40 p-5 rounded-xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 text-sm flex items-center gap-1.5">
                  <span>🐞 Wrong Submission AI Debugger</span>
                </span>
                <span className="text-xs px-2.5 py-0.5 bg-rose-500/20 text-rose-300 rounded font-bold">{wrongDebuggerData.category || "Wrong Answer"}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-gray-300">Where Bug Occurs:</span>
                  <p className="text-rose-200 font-mono mt-0.5">{wrongDebuggerData.where}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-300">Why It Failed:</span>
                  <p className="text-gray-300 mt-0.5">{wrongDebuggerData.why}</p>
                </div>
              </div>
            </div>
          )}

          {/* ACCEPTED SUBMISSION AI ANALYSIS CARD */}
          {acceptedAnalysis && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <span className="font-bold text-emerald-400 text-sm">🌟 Accepted Submission AI Code Analysis</span>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">ACCEPTED</span>
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setAnalysisTab("analysis")}
                  className={`px-3 py-1.5 rounded font-bold transition cursor-pointer ${
                    analysisTab === "analysis" ? "bg-emerald-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white"
                  }`}
                >
                  Complexity & Approach
                </button>
                <button
                  onClick={() => setAnalysisTab("alternative")}
                  className={`px-3 py-1.5 rounded font-bold transition cursor-pointer ${
                    analysisTab === "alternative" ? "bg-emerald-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white"
                  }`}
                >
                  Alternative Approach
                </button>
                <button
                  onClick={() => setAnalysisTab("walkthrough")}
                  className={`px-3 py-1.5 rounded font-bold transition cursor-pointer ${
                    analysisTab === "walkthrough" ? "bg-emerald-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white"
                  }`}
                >
                  Walkthrough & Visual
                </button>
              </div>

              {analysisTab === "analysis" && (
                <div className="space-y-3 text-xs">
                  <div className="bg-gray-950 p-3 rounded-lg border border-emerald-500/20">
                    <span className="font-bold text-emerald-300 block mb-1">Algorithm: {acceptedAnalysis.algorithm}</span>
                    <p className="text-gray-300">{acceptedAnalysis.howAndWhyItWorks}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-950 p-3 rounded-lg border border-emerald-500/20">
                      <span className="font-black text-emerald-400 text-base block">{acceptedAnalysis.timeComplexity}</span>
                      <span className="font-bold text-gray-300 block text-[11px] mb-1">Time Complexity</span>
                      <p className="text-gray-400 text-[11px]">{acceptedAnalysis.timeComplexityReasoning}</p>
                    </div>

                    <div className="bg-gray-950 p-3 rounded-lg border border-emerald-500/20">
                      <span className="font-black text-indigo-400 text-base block">{acceptedAnalysis.spaceComplexity}</span>
                      <span className="font-bold text-gray-300 block text-[11px] mb-1">Space Complexity</span>
                      <p className="text-gray-400 text-[11px]">{acceptedAnalysis.spaceComplexityReasoning}</p>
                    </div>
                  </div>
                </div>
              )}

              {analysisTab === "alternative" && alternativeAnalysis && (
                <div className="space-y-3 text-xs">
                  {!alternativeAnalysis.hasAlternative ? (
                    <div className="bg-gray-950 p-4 rounded-lg border border-emerald-500/20 text-center text-emerald-300 font-semibold">
                      {alternativeAnalysis.noAlternativeMessage || "Current approach is already optimal under the given constraints."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-gray-950 p-3 rounded-lg border border-emerald-500/30 space-y-1">
                        <span className="font-bold text-emerald-400 text-xs block">Optimal Alternative: {alternativeAnalysis.alternativeApproach?.algorithm}</span>
                        <p className="text-gray-300 text-[11px]"><strong className="text-indigo-400">Intuition:</strong> {alternativeAnalysis.alternativeApproach?.intuition || alternativeAnalysis.alternativeApproach?.whyItWorks}</p>
                        {alternativeAnalysis.alternativeApproach?.patternToRemember && (
                          <p className="text-amber-300 text-[11px] bg-amber-500/10 p-2 rounded border border-amber-500/20 mt-1">
                            <strong>Pattern Rule to Remember:</strong> {alternativeAnalysis.alternativeApproach.patternToRemember}
                          </p>
                        )}
                      </div>

                      {alternativeAnalysis.alternativeApproach?.codeSnippet && (
                        <pre className="bg-gray-950 p-2.5 rounded text-[11px] font-mono text-emerald-200 overflow-x-auto whitespace-pre border border-emerald-500/20">
                          {alternativeAnalysis.alternativeApproach.codeSnippet}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}

              {analysisTab === "walkthrough" && (
                <div className="space-y-3 text-xs">
                  {acceptedAnalysis.mermaidDiagram && (
                    <div className="bg-gray-950 p-3 rounded-lg border border-emerald-500/20 space-y-1">
                      <span className="font-bold text-emerald-300 block">Visual Execution Flowchart:</span>
                      <pre className="bg-gray-900 p-2 rounded text-[11px] font-mono text-indigo-300 overflow-x-auto">
                        {acceptedAnalysis.mermaidDiagram}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Pane: Code Editor */}
        <div className="flex-[0.5] flex flex-col p-4 md:p-6 h-full overflow-y-auto">
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
        </div>

      </div>
    </div>
  );
}
