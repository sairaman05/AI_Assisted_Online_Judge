import React, { useEffect, useState, useContext } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { setAiAssistanceEnabled, fetchAiAssistanceEnabled } from "../api/aiService";
import { AuthContext } from "../api/authuser";
import { useNavigate} from "react-router-dom";
import {
  addUser,
  readUsers,
  deleteUser,
  updateUser,
} from "../api/users";

import {
  addProblem,
  readProblems,
  deleteProblem,
  updateProblem,
} from "../api/problems";

import {
  addContest,
  readContests,
  deleteContest,
  updateContest,
  addProblemToContest,
  generateAIContest,
  regenerateContestProblem,
  fetchControlCenterAnalytics,
  publishContestGuidance,
} from "../api/contests";

import {
  analyzeContest,
  getContestRecommendations,
  approveRecommendation,
  rejectRecommendation,
  getAgentAuditLogs,
  getAgentSessions,
} from "../api/agents";

import { v4 as uuidv4 } from "uuid";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [problems, setProblems] = useState([]);
  const [contests, setContests] = useState([]);
  const [error, setError] = useState("");
  const [view, setView] = useState("users");
  const [selectedContestId, setSelectedContestId] = useState("practice");
  const auth = useContext(AuthContext);
  console.log(auth.type);

  const [aiAssistanceEnabled, setAiAssistanceEnabledState] = useState(false);
  const [aiToggleLoading, setAiToggleLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch AI toggle status from backend on mount
  useEffect(() => {
    async function loadAiStatus() {
      try {
        const enabled = await fetchAiAssistanceEnabled();
        setAiAssistanceEnabledState(enabled);
        setError("");
      } catch (err) {
        console.error("Failed to load AI assistance status", err);
        setError("Failed to load AI assistance status");
      }
    }
    loadAiStatus();
  }, []);

  // Update backend and local state on toggle 
  const toggleAiAssistance = async () => {
    const newValue = !aiAssistanceEnabled;
    setAiToggleLoading(true);
    try {
      await setAiAssistanceEnabled(newValue);
      setAiAssistanceEnabledState(newValue);
      setError("");
    } catch (err) {
      console.error("Failed to update AI assistance status", err);
      setError("Failed to update AI assistance status");
    } finally {
      setAiToggleLoading(false);
    }
  };

  // Users state
  const [newUser, setNewUser] = useState({
    id: "",
    name: "",
    email: "",
    type: "user",
  });
  const [editUserId, setEditUserId] = useState(null);

  // Problems state
  const [newProblem, setNewProblem] = useState({
    id: "",
    title: "",
    description: "",
    score: 0,
    codeBase: "",
    testcases: [{ input: "", output: "" }],
    constraintLimit: 0,
  });
  const [editProblemId, setEditProblemId] = useState(null);

  // Contests state
  const [newContest, setNewContest] = useState({
    id: "",
    name: "",
    start: null as Date | null,
    end: null as Date | null,
    password: "",
    duration: 0,
    problems: [] as string[],
  });
  const [editContestId, setEditContestId] = useState(null);

  // Problem to Contest Selections state
  const [problemContestSelections, setProblemContestSelections] = useState<Record<string, Set<string>>>({});

  // AI Contest Creator state
  const [aiContestForm, setAiContestForm] = useState({
    name: "",
    start: null as Date | null,
    end: null as Date | null,
    easyCount: 2,
    mediumCount: 2,
    hardCount: 1,
    duration: 120,
    password: "",
  });
  const [isGeneratingAiContest, setIsGeneratingAiContest] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [generatedContestResult, setGeneratedContestResult] = useState<any>(null);
  const [regeneratingProblemId, setRegeneratingProblemId] = useState<string | null>(null);

  // AI Control Center Guidance Intervention State
  const [targetScope, setTargetScope] = useState<"targeted" | "global">("targeted");
  const [minAttemptsThreshold, setMinAttemptsThreshold] = useState<number>(3);
  const [publishingGuidance, setPublishingGuidance] = useState(false);
  const [publishedSuccessMsg, setPublishedSuccessMsg] = useState("");
  const [selectedGuidanceLevel, setSelectedGuidanceLevel] = useState<number>(1);
  const [selectedProblemForGuidance, setSelectedProblemForGuidance] = useState<string>("");
  const [showParticipantInspector, setShowParticipantInspector] = useState(false);

  // Agent Control Center state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [agentSessions, setAgentSessions] = useState<any[]>([]);
  const [analyzingContest, setAnalyzingContest] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisContestId, setAnalysisContestId] = useState("");
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchAgentData = async () => {
    try {
      const [recs, logs, sessions] = await Promise.all([
        getContestRecommendations("all").catch(() => []),
        getAgentAuditLogs(30).catch(() => []),
        getAgentSessions(20).catch(() => []),
      ]);
      setRecommendations(recs || []);
      setAuditLogs(logs || []);
      setAgentSessions(sessions || []);
    } catch (err) {
      console.error("Failed to load agent data", err);
    }
  };

  const fetchData = async () => {
    try {
      const [usersData, problemsData, contestsData] = await Promise.all([
        readUsers(),
        readProblems(),
        readContests(),
      ]);

      const contestsWithProblems = (contestsData || []).map((c) => ({
        ...c,
        problems: c.problems || [],
      }));

      setUsers(usersData || []);
      setProblems(problemsData || []);
      setContests(contestsWithProblems);
      if (contestsWithProblems.length > 0 && !analysisContestId) {
        setAnalysisContestId(contestsWithProblems[0].id || contestsWithProblems[0]._id);
      }
      await fetchAgentData();
      setError("");
    } catch {
      setError("Failed to load data");
    }
  };

  // -------- User Handlers --------
  const handleUserSave = async () => {
    const { id, name, email, type } = newUser;
    if (!id.trim() || !name.trim() || !email.trim() || !type.trim()) {
      setError("Fill all user fields.");
      return;
    }
    try {
      if (editUserId) {
        await updateUser(editUserId, newUser);
      } else {
        await addUser(newUser);
      }
      setNewUser({ id: "", name: "", email: "", type: "user" });
      setEditUserId(null);
      await fetchData();
      setError("");
    } catch {
      setError("Error saving user.");
    }
  };

  const handleEditUser = (user) => {
    setNewUser(user);
    setEditUserId(user.id);
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id);
      await fetchData();
    } catch {
      setError("Error deleting user");
    }
  };

  // -------- Problem Handlers --------
  const handleProblemSave = async () => {
    const { title, description, score, codeBase, testcases, constraintLimit } = newProblem;

    if (!title.trim() || !description.trim() || !score) {
      setError("Fill all problem and testcase fields.");
      return;
    }

    try {
      if (editProblemId) {
        const problemToUpdate = { ...newProblem };
        delete (problemToUpdate as any).contestId;
        await updateProblem(editProblemId, problemToUpdate);
      } else {
        const newId = uuidv4();
        const problemToAdd = { ...newProblem };
        delete (problemToAdd as any).contestId;
        problemToAdd.id = newId;
        await addProblem(problemToAdd);
        try {
          const stored = JSON.parse(localStorage.getItem("oj_newly_added_ids") || "[]");
          localStorage.setItem("oj_newly_added_ids", JSON.stringify([...stored, newId]));
        } catch {}
      }
      setNewProblem({
        id: "",
        title: "",
        description: "",
        score: 0,
        codeBase: "",
        testcases: [{ input: "", output: "" }],
        constraintLimit: 0,
      });
      setEditProblemId(null);
      setError("");
      await fetchData();
    } catch (err) {
      setError("Error saving problem.");
      console.error(err);
    }
  };

  const handleEditProblem = (problem) => {
    const { contestId, ...rest } = problem;
    setNewProblem(rest);
    setEditProblemId(problem.id);
  };

  const handleDeleteProblem = async (id) => {
    try {
      await deleteProblem(id);

      const contestsToUpdate = contests.filter((contest) =>
        contest.problems?.includes(id)
      );

      for (const contest of contestsToUpdate) {
        const updatedProblems = contest.problems.filter((pid) => pid !== id);
        const updatedContest = { ...contest, problems: updatedProblems };
        await updateContest(contest.id || contest._id, updatedContest);
      }

      await fetchData();
    } catch {
      setError("Error deleting problem");
    }
  };

  // -------- Contest Handlers --------
  const handleContestSave = async () => {
    const { name, start, end, password, duration } = newContest;

    if (!name.trim() || !start || !end) {
      setError("Fill all contest fields.");
      return;
    }

    if (start >= end) {
      setError("Start date/time must be before end date/time.");
      return;
    }
    const contestToSave = {
      ...newContest,
      start: start.toISOString(),
      end: end.toISOString(),
      problems: newContest.problems || [],
      password: password,
      duration: duration,
    };
    try {
      if (editContestId) {
        await updateContest(editContestId, contestToSave);
      } else {
        const newId = uuidv4();
        await addContest({ ...contestToSave, id: newId });
      }
      setNewContest({ id: "", name: "", start: null, end: null, password: "", duration: 0, problems: [] });
      setEditContestId(null);
      await fetchData();
      setError("");
    } catch {
      setError("Error saving contest.");
    }
  };

  const handleEditContest = (contest) => {
    setNewContest({
      id: contest.id || contest._id || "",
      name: contest.name || "",
      start: contest.start ? new Date(contest.start) : null,
      end: contest.end ? new Date(contest.end) : null,
      problems: contest.problems || [],
      password: contest.password || "",
      duration: contest.duration || 0,
    });
    setEditContestId(contest.id || contest._id);
  };

  const handleDeleteContest = async (id) => {
    try {
      await deleteContest(id);
      if (selectedContestId === id) setSelectedContestId("practice");
      await fetchData();
    } catch {
      setError("Error deleting contest");
    }
  };

  // AI Contest Generation Handler
  const handleGenerateAIContest = async () => {
    if (!aiContestForm.name.trim() || !aiContestForm.start || !aiContestForm.end) {
      setError("Please fill Contest Name, Start Date/Time, and End Date/Time.");
      return;
    }
    if (aiContestForm.start >= aiContestForm.end) {
      setError("Start Date/Time must be before End Date/Time.");
      return;
    }
    const total = Number(aiContestForm.easyCount) + Number(aiContestForm.mediumCount) + Number(aiContestForm.hardCount);
    if (total <= 0) {
      setError("Please request at least 1 Easy, Medium, or Hard problem.");
      return;
    }

    setError("");
    setIsGeneratingAiContest(true);
    setGenerationSteps([
      "✓ Initializing AI Contest Configuration...",
      `✓ Dispatching request to Ollama (DeepSeek-R1 14B) for ${total} problems (${aiContestForm.easyCount} Easy, ${aiContestForm.mediumCount} Medium, ${aiContestForm.hardCount} Hard)...`,
      "⏳ Generating problem statements, constraints, and testcase suites...",
      "⏳ Testing reference solutions against compiler sandbox...",
      "⏳ Checking duplicate question fingerprints..."
    ]);

    try {
      const res = await generateAIContest({
        name: aiContestForm.name,
        start: aiContestForm.start.toISOString(),
        end: aiContestForm.end.toISOString(),
        easyCount: aiContestForm.easyCount,
        mediumCount: aiContestForm.mediumCount,
        hardCount: aiContestForm.hardCount,
        duration: aiContestForm.duration,
        password: aiContestForm.password,
      });

      setGenerationSteps(prev => [
        ...prev,
        `✓ All ${res.problems?.length || total} problems generated & reference solutions validated!`,
        `✓ Contest "${res.contest.name}" published to database!`
      ]);
      setGeneratedContestResult(res);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "AI Contest generation failed.");
      setGenerationSteps(prev => [...prev, `❌ Error: ${err.message || 'Generation failed'}`]);
    } finally {
      setIsGeneratingAiContest(false);
    }
  };

  // Single Problem Regeneration Handler for Admin Preview
  const handleRegenerateProblem = async (oldProblemId: string, difficulty: string) => {
    if (!generatedContestResult?.contest?._id && !generatedContestResult?.contest?.id) return;
    const cid = generatedContestResult.contest._id || generatedContestResult.contest.id;
    setRegeneratingProblemId(oldProblemId);
    try {
      const res = await regenerateContestProblem({
        contestId: cid,
        oldProblemId,
        difficulty
      });
      setGeneratedContestResult((prev: any) => ({
        ...prev,
        problems: (prev.problems || []).map((p: any) => (p.id === oldProblemId || p._id === oldProblemId) ? res.newProblem : p)
      }));
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to regenerate problem.");
    } finally {
      setRegeneratingProblemId(null);
    }
  };

  // Publish AI Control Center Guidance Intervention Handler
  const handlePublishGuidanceIntervention = async (guidanceId?: string) => {
    if (!analysisContestId) {
      setError("Please select a contest first.");
      return;
    }
    setPublishingGuidance(true);
    setPublishedSuccessMsg("");
    setError("");
    try {
      const res = await publishContestGuidance({
        contestId: analysisContestId,
        guidanceId,
        targetScope,
        minAttemptsThreshold: Number(minAttemptsThreshold) || 3,
      });
      setPublishedSuccessMsg("✅ AI Guidance Intervention successfully published to participants!");
      if (res?.analytics) {
        setAnalysisResult(res.analytics);
      }
    } catch (err: any) {
      setError(err.message || "Failed to publish guidance intervention.");
    } finally {
      setPublishingGuidance(false);
    }
  };

  // Filter problems by selected contest or practice (unassigned)
  const filteredProblems = problems.filter((p) => {
    if (selectedContestId === "practice") {
      const assignedProblemIds = new Set();
      contests.forEach((c) => {
        (c.problems || []).forEach((pid) => assignedProblemIds.add(pid));
      });
      return !assignedProblemIds.has(p.id);
    } else {
      const contest = contests.find((c) => (c.id || c._id) === selectedContestId);
      if (!contest) return false;
      return (contest.problems || []).includes(p.id);
    }
  });

  // Toggle checkbox selection for assigning problem to contests
  const toggleProblemContestSelection = (problemId, contestId) => {
    setProblemContestSelections((prev) => {
      const prevSet = prev[problemId] || new Set();
      const newSet = new Set(prevSet);
      if (newSet.has(contestId)) {
        newSet.delete(contestId);
      } else {
        newSet.add(contestId);
      }
      return { ...prev, [problemId]: newSet };
    });
  };

  // Assign problem to selected contests
  const handleAssignProblemToContests = async (problemId) => {
    const selectedContestIds = problemContestSelections[problemId];
    if (!selectedContestIds || selectedContestIds.size === 0) {
      setError("Select at least one contest.");
      return;
    }
    try {
      let updatedAny = false;
      for (const contestId of selectedContestIds) {
        await addProblemToContest(contestId, problemId);
        updatedAny = true;
      }
      if (updatedAny) {
        setError("");
        setProblemContestSelections((prev) => ({ ...prev, [problemId]: new Set() }));
        await fetchData();
      }
    } catch (err) {
      setError("Error assigning problem to contests.");
      console.error(err);
    }
  };

  // Remove problem from contest
  const handleRemoveProblemFromContest = async (contestId, problemId) => {
    try {
      const contest = contests.find((c) => (c.id || c._id) === contestId);
      if (!contest) return;

      const updatedProblems = (contest.problems || []).filter((pid) => pid !== problemId);
      const updatedContest = { ...contest, problems: updatedProblems };

      await updateContest(contest.id || contest._id, updatedContest);
      await fetchData();
      setError("");
    } catch (err) {
      setError("Error removing problem from contest.");
      console.error(err);
    }
  };

  // Check if problem already assigned to contest
  const isProblemAssignedToContest = (problemId, contestId) => {
    const contest = contests.find((c) => (c.id || c._id) === contestId);
    if (!contest) return false;
    return (contest.problems || []).includes(problemId);
  };

  // ----- Render Sections -----

  const renderUserSection = () => (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4 text-white">👤 Manage Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <input
          className="p-2 bg-zinc-900 text-white rounded"
          placeholder="ID (auth0|...)"
          value={newUser.id}
          onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
        />
        <input
          className="p-2 bg-zinc-900 text-white rounded"
          placeholder="Name"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          className="p-2 bg-zinc-900 text-white rounded"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <select
          className="p-2 bg-zinc-900 text-white rounded"
          value={newUser.type}
          onChange={(e) => setNewUser({ ...newUser, type: e.target.value })}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={handleUserSave}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-white"
        >
          {editUserId ? "Update User" : "Add User"}
        </button>
      </div>
      <ul className="space-y-2">
        {users.map((user) => (
          <li
            key={user.id}
            className="bg-zinc-800 text-white p-3 rounded flex justify-between items-center"
          >
            <span>
              {user.name} ({user.email}) - {user.type}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleEditUser(user)}
                className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  const renderProblemSection = () => (
    <section>
      <h2 className="text-2xl font-semibold mb-4 text-white">📘 Manage Problems</h2>

      {/* 👇 ADD THIS BUTTON */}
      <div className="mb-8 p-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-2 border-indigo-500/50 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-500/80 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">🧪</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-indigo-300">Admin Test Mode</h3>
              <p className="text-indigo-200 text-sm">Test ALL {problems.length} problems → No contest restrictions</p>
            </div>
          </div>
          <button
            onClick={() => {
              console.log("🚀 Navigating to editor...");
              navigate(`/editor?isAdminTest=true`);
            }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center space-x-3"
          >
            <span>🚀 Open Code Editor</span>
            <span className="text-sm font-normal">(Admin Mode)</span>
          </button>
        </div>
      </div>

      {/* Contest selector for filtering */}
      <div className="mb-4">
        <label className="mr-2 text-white font-semibold">Filter Problems by Contest:</label>
        <select
          className="p-2 bg-zinc-900 text-white rounded"
          value={selectedContestId}
          onChange={(e) => setSelectedContestId(e.target.value)}
        >
          <option value="practice">Problems Not Assigned</option>
          {contests.map((contest) => (
            <option key={contest.id || contest._id} value={contest.id || contest._id}>
              {contest.name}
            </option>
          ))}
        </select>
      </div>

      {/* Problem input fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {/* Title */}
        <div className="flex flex-col">
          <label htmlFor="title" className="mb-1 text-white font-semibold select-none">
            Title
          </label>
          <input
            id="title"
            type="text"
            className="p-2 bg-zinc-900 text-white rounded placeholder-gray-400"
            placeholder="Enter problem title"
            value={newProblem.title}
            onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col md:col-span-2">
          <label htmlFor="description" className="mb-1 text-white font-semibold select-none">
            Description
          </label>
          <textarea
            id="description"
            rows={1}
            className="p-2 bg-zinc-900 text-white rounded resize-y placeholder-gray-400 w-full"
            placeholder="Enter problem description"
            value={newProblem.description}
            onChange={(e) => {
              // Update state
              setNewProblem({ ...newProblem, description: e.target.value });
            }}
            onInput={(e: any) => {
              // Auto-expand vertically
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e: any) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const { selectionStart, selectionEnd, value } = e.target;
                const newVal = value.slice(0, selectionStart) + "\n" + value.slice(selectionEnd);
                setNewProblem({ ...newProblem, description: newVal });
                setTimeout(() => {
                  e.target.selectionStart = e.target.selectionEnd = selectionStart + 1;
                });
              }
            }}
          />
        </div>

        {/* Score */}
        <div className="flex flex-col col-span-1 md:col-span-1">
          <label htmlFor="score" className="mb-1 text-white font-semibold select-none">
            Score
          </label>
          <input
            id="score"
            type="number"
            className="p-2 bg-zinc-900 text-white rounded placeholder-gray-400 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter problem score"
            value={newProblem.score}
            onChange={e => setNewProblem({ ...newProblem, score: Number(e.target.value) })}
            onWheel={e => e.currentTarget.blur()} // prevent scroll wheel change
            min={0}
          />
          <small className="text-gray-400 mt-1">Points awarded for solving this problem</small>
        </div>

        {/* Code Base File Upload */}
        <div className="col-span-1 md:col-span-3">
          <label className="block mb-1 text-white">Code Base File:</label>
          <input
            type="file"
            accept=".js,.py,.txt,.java,.cpp,*"
            className="p-2 bg-zinc-900 text-white rounded"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const text = await file.text();
              setNewProblem((prev) => ({ ...prev, codeBase: text }));
            }}
          />
          {newProblem.codeBase && (
            <div className="text-xs mt-2 text-green-500">
              File loaded, {newProblem.codeBase.length} characters
            </div>
          )}
        </div>

        {/* Testcases input */}
        <div className="col-span-1 md:col-span-3">
          <label className="block mb-2 font-semibold text-white">Testcases:</label>
          {newProblem.testcases.map((tc, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2">
              <textarea
                rows={1}
                className="p-2 bg-zinc-900 text-white rounded flex-1 resize-none"
                placeholder={`Input ${idx + 1}`}
                value={tc.input}
                onKeyDown={(e: any) => {
                  e.stopPropagation();
                }}
                onInput={(e: any) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";

                  const testcases = [...newProblem.testcases];
                  testcases[idx].input = e.target.value;
                  setNewProblem({ ...newProblem, testcases });
                }}
              />

              <textarea
                rows={1}
                className="p-2 bg-zinc-900 text-white rounded flex-1 resize-none"
                placeholder={`Output ${idx + 1}`}
                value={tc.output}
                onKeyDown={(e: any) => e.stopPropagation()}
                onInput={(e: any) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";

                  const testcases = [...newProblem.testcases];
                  testcases[idx].output = e.target.value;
                  setNewProblem({ ...newProblem, testcases });
                }}
              />

              <button
                type="button"
                onClick={() => {
                  const testcases = newProblem.testcases.filter((_, i) => i !== idx);
                  setNewProblem({
                    ...newProblem,
                    testcases: testcases.length ? testcases : [{ input: "", output: "" }],
                  });
                }}
                className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded self-start"
                disabled={newProblem.testcases.length === 1}
                title="Remove this testcase"
              >
                -
              </button>
            </div>
          ))}

          <button
            type="button"
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white mt-2"
            onClick={() =>
              setNewProblem({
                ...newProblem,
                testcases: [...newProblem.testcases, { input: "", output: "" }],
              })
            }
          >
            + Add Testcase
          </button>
        </div>

        {/* Constraint Limit */}
        <div className="flex flex-col col-span-1 md:col-span-1">
          <label htmlFor="constraintLimit" className="mb-1 text-white font-semibold select-none">
            Constraint Limit
          </label>
          <input
            id="constraintLimit"
            type="number"
            className="p-2 bg-zinc-900 text-white rounded placeholder-gray-400 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter constraint limit"
            value={newProblem.constraintLimit}
            onChange={e => setNewProblem({ ...newProblem, constraintLimit: Number(e.target.value) })}
            onWheel={e => e.currentTarget.blur()}
            min={0}
          />
          <small className="text-gray-400 mt-1">
            Minimum allowed similarity in percentage
          </small>
        </div>

        {/* Save Problem button */}
        <button
          onClick={handleProblemSave}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white col-span-1 md:col-span-3"
        >
          {editProblemId ? "Update Problem" : "Add Problem"}
        </button>
      </div>

      {/* Assign Problems to Contests Section */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-3">🔗 Assign Problems to Contests</h3>
        {problems.length === 0 && <p className="text-gray-400">No problems available yet.</p>}
        <ul className="space-y-4 max-h-[400px] overflow-auto">
          {problems.map((problem) => (
            <li
              key={problem.id}
              className="bg-zinc-700 p-4 rounded flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <strong>{problem.title}</strong> — Score: {problem.score}
                <div className="text-xs mt-1 text-gray-400">ID: {problem.id}</div>
              </div>

              <div className="mt-2 md:mt-0 flex flex-wrap gap-3 max-w-lg">
                {contests.map((contest) => {
                  const contestId = contest.id || contest._id;
                  const isAssigned = isProblemAssignedToContest(problem.id, contestId);
                  const isSelected = problemContestSelections[problem.id]?.has(contestId) || false;

                  return (
                    <label
                      key={contestId}
                      title={contest.name}
                      className={`inline-flex items-center px-2 py-1 rounded cursor-pointer select-none ${isSelected ? "bg-indigo-600" : "bg-zinc-900"
                        }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isAssigned}
                        checked={isAssigned || isSelected}
                        onChange={() => toggleProblemContestSelection(problem.id, contestId)}
                        className="mr-1"
                      />
                      <span className={isAssigned ? "line-through text-gray-400" : ""}>
                        {contest.name}
                      </span>
                    </label>
                  );
                })}
              </div>

              <button
                disabled={
                  !problemContestSelections[problem.id] || problemContestSelections[problem.id].size === 0
                }
                onClick={() => handleAssignProblemToContests(problem.id)}
                className={`ml-0 md:ml-4 mt-3 md:mt-0 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white ${!problemContestSelections[problem.id] ||
                  problemContestSelections[problem.id].size === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
                  }`}
              >
                Assign Selected Contests
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Problems filtered */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-3">
          📄 {selectedContestId === "practice" ? "Practice Problems (No Contest Assigned)" : `Problems in Contest`}
        </h3>
        {filteredProblems.length === 0 && (
          <p className="text-gray-400">No problems to show for the selected filter.</p>
        )}
        <ul className="space-y-2">
          {filteredProblems.map((problem) => (
            <li
              key={problem.id}
              className="bg-zinc-800 text-white p-3 rounded flex justify-between items-center"
            >
              <span>
                <strong>{problem.title}</strong> — Score: {problem.score} | Limit: {problem.constraintLimit}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => handleEditProblem(problem)}
                  className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProblem(problem.id)}
                  className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );

  const renderContestSection = () => (
    <section className="mb-12 space-y-8">
      
      {/* 🤖 FEATURE 1: CREATE CONTEST WITH AI CARD */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-zinc-900 border border-indigo-500/40 p-6 md:p-8 rounded-2xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">⚡ AI Contest Generator</span>
            <h2 className="text-2xl font-extrabold text-white mt-0.5 flex items-center gap-2">
              <span>🤖</span> Create Contest with AI (Qwen2.5)
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              Specify contest dates and problem counts ($X$ Easy, $Y$ Medium, $Z$ Hard). The AI pipeline generates statements, 3 public examples, 5 hidden test cases, reference solutions, and validates them against the judge sandbox automatically.
            </p>
          </div>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-3 py-1 rounded border border-indigo-500/30 font-bold">
            Model: Ollama (Qwen2.5 3B)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Contest Name</label>
            <input
              type="text"
              placeholder="e.g. Weekly Coding Challenge #12"
              value={aiContestForm.name}
              onChange={(e) => setAiContestForm({ ...aiContestForm, name: e.target.value })}
              className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Start Date & Time</label>
            <DatePicker
              selected={aiContestForm.start}
              onChange={(date: any) => setAiContestForm((prev) => ({ ...prev, start: date }))}
              showTimeSelect
              timeIntervals={15}
              dateFormat="yyyy-MM-dd HH:mm"
              className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm"
              placeholderText="Select start time"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">End Date & Time</label>
            <DatePicker
              selected={aiContestForm.end}
              onChange={(date: any) => setAiContestForm((prev) => ({ ...prev, end: date }))}
              showTimeSelect
              timeIntervals={15}
              dateFormat="yyyy-MM-dd HH:mm"
              className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm"
              placeholderText="Select end time"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">Easy Problems</label>
            <input
              type="number"
              min={0}
              value={aiContestForm.easyCount}
              onChange={(e) => setAiContestForm({ ...aiContestForm, easyCount: Number(e.target.value) })}
              className="w-full p-2.5 bg-zinc-950 border border-emerald-500/40 rounded-lg text-white text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase mb-1">Medium Problems</label>
            <input
              type="number"
              min={0}
              value={aiContestForm.mediumCount}
              onChange={(e) => setAiContestForm({ ...aiContestForm, mediumCount: Number(e.target.value) })}
              className="w-full p-2.5 bg-zinc-950 border border-amber-500/40 rounded-lg text-white text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-400 uppercase mb-1">Hard Problems</label>
            <input
              type="number"
              min={0}
              value={aiContestForm.hardCount}
              onChange={(e) => setAiContestForm({ ...aiContestForm, hardCount: Number(e.target.value) })}
              className="w-full p-2.5 bg-zinc-950 border border-rose-500/40 rounded-lg text-white text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={0}
              value={aiContestForm.duration}
              onChange={(e) => setAiContestForm({ ...aiContestForm, duration: Number(e.target.value) })}
              className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm font-bold"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-400 font-mono">
            Total Request: <strong className="text-white">{Number(aiContestForm.easyCount) + Number(aiContestForm.mediumCount) + Number(aiContestForm.hardCount)}</strong> problems
          </div>

          <button
            onClick={handleGenerateAIContest}
            disabled={isGeneratingAiContest}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-xl transition transform hover:scale-[1.02] cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isGeneratingAiContest ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Generating Contest with Qwen2.5...
              </>
            ) : (
              <>⚡ Generate Contest with AI</>
            )}
          </button>
        </div>

        {/* Real-time Generation Steps Output */}
        {generationSteps.length > 0 && (
          <div className="bg-black/80 border border-indigo-500/30 p-4 rounded-xl space-y-1.5 font-mono text-xs text-indigo-300">
            <span className="font-bold text-amber-400 block mb-1">AI Generation Pipeline Progress:</span>
            {generationSteps.map((step, idx) => (
              <div key={idx} className="leading-relaxed">{step}</div>
            ))}
          </div>
        )}

        {/* Generated Contest Preview & Individual Problem Regeneration */}
        {generatedContestResult && (
          <div className="bg-zinc-950 border border-emerald-500/30 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div>
                <h3 className="font-bold text-emerald-400 text-sm">🎉 AI Contest Published: {generatedContestResult.contest?.name}</h3>
                <span className="text-xs text-gray-400">Total Problems Generated: {generatedContestResult.problems?.length}</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">PUBLISHED</span>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Generated Problems Review</h4>
              {generatedContestResult.problems?.map((prob: any) => (
                <div key={prob.id || prob._id} className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{prob.title}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        prob.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : prob.difficulty === 'Hard' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {prob.difficulty}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRegenerateProblem(prob.id || prob._id, prob.difficulty)}
                      disabled={regeneratingProblemId === (prob.id || prob._id)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 rounded font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {regeneratingProblemId === (prob.id || prob._id) ? "Regenerating..." : "🔄 Regenerate Problem"}
                    </button>
                  </div>

                  <p className="text-gray-300 line-clamp-2">{prob.description}</p>
                  
                  {prob.difficultyJustification && (
                    <div className="text-[11px] bg-indigo-950/40 text-indigo-300 p-2 rounded border border-indigo-500/20">
                      <strong>AI Difficulty Justification:</strong> {prob.difficultyJustification}
                    </div>
                  )}

                  <div className="flex gap-4 text-[10px] text-gray-400 font-mono pt-1">
                    <span>Public Testcases: 3</span>
                    <span>Hidden Testcases: 5 (Protected Server-Side)</span>
                    <span>Ref Solution: Verified ✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <span>🏆</span> Active & AI-Generated Contests
      </h2>

      <ul className="space-y-2">
        {contests.map((contest) => (
          <li
            key={contest.id || contest._id}
            className="bg-zinc-800 text-white p-3 rounded flex flex-col md:flex-row md:justify-between md:items-center"
          >
            <div>
              <strong>{contest.name}</strong> — {new Date(contest.start).toLocaleString()} to{" "}
              {new Date(contest.end).toLocaleString()}
            </div>
            <div className="mt-2 md:mt-0">
              {contest.problems && contest.problems.length > 0 ? (
                <details className="cursor-pointer bg-zinc-700 rounded p-2">
                  <summary className="font-semibold text-sm mb-1 text-white">
                    Problems ({contest.problems.length})
                  </summary>
                  <ul className="list-decimal list-inside max-h-48 overflow-auto text-sm">
                    {contest.problems.map((pid) => {
                      const problem = problems.find((p) => p.id === pid);
                      return (
                        <li key={pid} className="flex justify-between items-center">
                          <span>{problem ? problem.title : `Unknown Problem: ${pid}`}</span>
                          {problem && (
                            <button
                              onClick={() => handleRemoveProblemFromContest(contest.id || contest._id, pid)}
                              className="ml-4 bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-xs"
                              title="Remove Problem from Contest"
                            >
                              Remove
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </details>
              ) : (
                <span className="text-sm italic text-gray-400">No problems assigned</span>
              )}
            </div>
            <div className="space-x-2 mt-2 md:mt-0">
              <button
                onClick={() => handleEditContest(contest)}
                className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteContest(contest.id || contest._id)}
                className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  // -------- Agent Control Center Handlers --------
  const handleContestSelect = async (contestId: string) => {
    setAnalysisContestId(contestId);
    setAnalysisResult(null);
    setPublishedSuccessMsg("");
    if (!contestId) return;

    try {
      const res = await fetchControlCenterAnalytics(contestId);
      if (res?.result || res?.contestId) {
        setAnalysisResult(res.result || res);
      }
    } catch (err) {
      // Ignored if no previous snapshot
    }
  };

  const handleRunContestAnalysis = async () => {
    if (!analysisContestId) {
      setError("Please select a contest to analyze.");
      return;
    }
    setAnalyzingContest(true);
    setError("");
    setPublishedSuccessMsg("");
    try {
      const res = await analyzeContest(analysisContestId);
      setAnalysisResult(res?.result || res);
      await fetchAgentData();
    } catch (err: any) {
      setError(err.message || "Failed to execute Contest Master analysis.");
    } finally {
      setAnalyzingContest(false);
    }
  };

  const handleApprove = async (recId: string) => {
    setAdminActionLoading(true);
    try {
      await approveRecommendation(recId, "Approved via AI Agent Control Center");
      await fetchAgentData();
    } catch (err: any) {
      setError(err.message || "Failed to approve recommendation");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleReject = async (recId: string) => {
    setAdminActionLoading(true);
    try {
      await rejectRecommendation(recId, "Dismissed by Admin");
      await fetchAgentData();
    } catch (err: any) {
      setError(err.message || "Failed to reject recommendation");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const renderAgentControlCenter = () => (
    <div className="space-y-10">
      {/* 1. AI Contest Master Monitor */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
              <span>🤖</span> AI Contest Master (Qwen2.5)
            </h2>
            <p className="text-xs text-gray-400">
              Autonomous contest telemetry monitoring, struggle analysis, and 5-level pedagogical AI guidance interventions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={analysisContestId}
              onChange={(e) => handleContestSelect(e.target.value)}
              className="p-2.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select Contest...</option>
              {contests.map((c: any) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleRunContestAnalysis}
              disabled={analyzingContest || !analysisContestId}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-white font-bold text-sm transition shadow disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {analyzingContest ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing Telemetry...
                </>
              ) : (
                <>🚀 Run AI Telemetry Analysis</>
              )}
            </button>
          </div>
        </div>

        {/* Live Contest Overview & Health Badge if available */}
        {analysisResult && (
          <div className="space-y-6">
            {/* EXECUTIVE SUMMARY: WHAT IS HAPPENING RIGHT NOW? */}
            <div className="bg-gradient-to-r from-zinc-950 via-indigo-950/40 to-zinc-950 border border-indigo-500/40 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Live Contest Intelligence Summary</span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                    <span>🔍</span> What Is Happening Right Now?
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    analysisResult.contestHealth === 'healthy'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                      : analysisResult.contestHealth === 'attention_required'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}>
                    {analysisResult.contestHealth === 'healthy' ? '🟢 Healthy Progress' : analysisResult.contestHealth === 'attention_required' ? '⚠️ Struggling Solvers Detected' : '🔴 Critical Anomaly'}
                  </span>

                  <button
                    onClick={() => setShowParticipantInspector(!showParticipantInspector)}
                    className="px-3.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🔍</span> {showParticipantInspector ? "Hide Inspector" : "Inspect Active Participants"}
                  </button>
                </div>
              </div>

              {/* Human-Readable Narrative Breakdown */}
              <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                <div className="font-semibold text-gray-200 leading-relaxed text-sm">
                  {analysisResult.contestHealth === 'healthy' ? (
                    <p className="text-emerald-300">
                      ✅ <strong>Contest Overview:</strong> All participants are progressing normally. Solve rates across assigned problems meet difficulty expectations with no systemic bottleneck detected.
                    </p>
                  ) : (
                    <p className="text-amber-300">
                      ⚠️ <strong>Contest Overview:</strong> Systemic struggle detected. Solvers are encountering significant difficulty on one or more problems. Qwen2.5 live analysis shows elevated failure rates due to algorithm complexity or edge case oversight.
                    </p>
                  )}
                </div>

                {analysisResult.problemStatistics && analysisResult.problemStatistics.some((p: any) => p.isStruggling) && (
                  <div className="mt-3 p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-200 text-xs space-y-1">
                    <strong>🔥 Struggle Breakdown:</strong>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 mt-1">
                      {analysisResult.problemStatistics.filter((p: any) => p.isStruggling).map((prob: any) => (
                        <li key={prob.problemId}>
                          <span className="font-bold text-white">{prob.problemTitle}:</span> {prob.primaryFailurePattern} (Avg attempts: {prob.averageAttempts}, WA: {prob.wrongAnswerCount}, TLE: {prob.tleCount})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Contest Telemetry Quick Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-gray-400 text-[11px] font-bold uppercase">Total Participants</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {analysisResult.participantStatistics?.totalParticipants || 0}
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-gray-400 text-[11px] font-bold uppercase">Active Solvers</div>
                  <div className="text-xl font-bold text-indigo-400 mt-1">
                    {analysisResult.participantStatistics?.activeParticipants || 0}
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-gray-400 text-[11px] font-bold uppercase">Struggling Problems</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {analysisResult.participantStatistics?.stuckParticipantsCount || (analysisResult.problemStatistics ? analysisResult.problemStatistics.filter((p: any) => p.isStruggling).length : 0)}
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-gray-400 text-[11px] font-bold uppercase">Avg Problems Solved</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {analysisResult.participantStatistics?.averageSolved || 0}
                  </div>
                </div>
              </div>

              {analysisResult.anomalies && analysisResult.anomalies.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Detected Anomaly Patterns:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysisResult.anomalies.map((an: any, idx: number) => (
                      <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{an.type}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            an.severity === 'high' || an.severity === 'critical' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {an.severity}
                          </span>
                        </div>
                        <p className="text-gray-300">{an.reasoning}</p>
                        <p className="text-indigo-300 font-semibold mt-1">Proposal: {an.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Problem Performance & Failure Pattern Telemetry Table */}
            {analysisResult.problemStatistics && analysisResult.problemStatistics.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">📊 Live Problem Performance & Anomaly Telemetry</span>
                  <span className="text-xs text-gray-400 font-normal">Real-time aggregate submission analysis</span>
                </h3>

                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                  <table className="w-full text-xs text-left text-gray-300">
                    <thead className="bg-zinc-900 text-gray-400 uppercase font-semibold border-b border-zinc-800">
                      <tr>
                        <th className="px-4 py-3">Problem Title</th>
                        <th className="px-4 py-3">Difficulty</th>
                        <th className="px-4 py-3 text-center">Attempted / Solved</th>
                        <th className="px-4 py-3 text-center">Success Rate</th>
                        <th className="px-4 py-3 text-center">Avg Attempts</th>
                        <th className="px-4 py-3">Verdicts (WA / TLE / RE)</th>
                        <th className="px-4 py-3">Primary Failure Pattern</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
                      {analysisResult.problemStatistics.map((stat: any) => (
                        <tr key={stat.problemId} className="hover:bg-zinc-900/40 transition">
                          <td className="px-4 py-3 font-bold text-white">
                            {stat.problemTitle}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              stat.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300' : stat.difficulty === 'Hard' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {stat.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            <span className="text-white font-bold">{stat.attemptedCount}</span> / <span className="text-emerald-400 font-bold">{stat.solvedCount}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            <span className={`font-bold ${stat.successRate >= 50 ? 'text-emerald-400' : stat.successRate >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
                              {stat.successRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-indigo-300">
                            {stat.averageAttempts}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px]">
                            <span className="text-red-400">WA: {stat.wrongAnswerCount}</span> | <span className="text-amber-400">TLE: {stat.tleCount}</span> | <span className="text-purple-400">RE: {stat.runtimeErrorCount}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-200 max-w-xs">
                            <span className="font-semibold text-indigo-300">{stat.primaryFailurePattern}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {stat.isStruggling ? (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
                                🔥 Struggling
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                                🟢 On Track
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. 5-Level AI Participant Guidance & Intervention Publishing Card */}
            {analysisResult.aiGuidance && analysisResult.aiGuidance.length > 0 && (
              <div className="bg-zinc-950 border border-purple-500/30 rounded-xl p-6 space-y-6 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                      <span>💡</span> Struggling Participant AI Guidance & Interventions
                    </h3>
                    <p className="text-xs text-gray-400">
                      Qwen2.5 5-Level Pedagogical Progressive Hints (Level 1: Conceptual $\to$ Level 5: Pseudocode).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold">Select Problem:</span>
                    <select
                      value={selectedProblemForGuidance}
                      onChange={(e) => setSelectedProblemForGuidance(e.target.value)}
                      className="p-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                    >
                      <option value="">All Problems</option>
                      {Array.from(new Set(analysisResult.aiGuidance.map((g: any) => g.problemId))).map((pid: any) => {
                        const item = analysisResult.aiGuidance.find((g: any) => g.problemId === pid);
                        return (
                          <option key={pid} value={pid}>
                            {item?.problemTitle || pid}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* 5 Guidance Level Selector Tabs */}
                <div className="flex gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
                  {[
                    { level: 1, label: "Level 1: Conceptual Direction", icon: "🧠" },
                    { level: 2, label: "Level 2: Algorithmic Pattern", icon: "📐" },
                    { level: 3, label: "Level 3: Structural Insight", icon: "⚡" },
                    { level: 4, label: "Level 4: Detailed Reasoning", icon: "🔍" },
                    { level: 5, label: "Level 5: Near-Solution / Pseudocode", icon: "📝" },
                  ].map((lvl) => (
                    <button
                      key={lvl.level}
                      onClick={() => setSelectedGuidanceLevel(lvl.level)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        selectedGuidanceLevel === lvl.level
                          ? "bg-purple-600 text-white shadow-lg"
                          : "bg-zinc-900 text-gray-400 hover:bg-zinc-800"
                      }`}
                    >
                      <span>{lvl.icon}</span> {lvl.label}
                    </button>
                  ))}
                </div>

                {/* Display Guidance Text for Active Level */}
                <div className="space-y-4">
                  {analysisResult.aiGuidance
                    .filter((g: any) => g.guidanceLevel === selectedGuidanceLevel && (!selectedProblemForGuidance || g.problemId === selectedProblemForGuidance))
                    .map((item: any) => (
                      <div key={item.guidanceId} className="bg-zinc-900 border border-purple-500/30 p-4 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-purple-300 text-sm">{item.problemTitle || "Problem Guidance"}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.publishedToParticipants ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-gray-400'
                          }`}>
                            {item.publishedToParticipants ? '✓ Published to Participants' : 'Draft / Unpublished'}
                          </span>
                        </div>
                        <p className="text-gray-200 leading-relaxed font-sans text-sm bg-black/40 p-3 rounded-lg border border-zinc-800">
                          {item.guidanceText}
                        </p>
                      </div>
                    ))}
                </div>

                {/* Intervention Publishing Controls */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>📡</span> Publish Guidance Intervention Controls
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-1">Intervention Target Scope:</label>
                      <select
                        value={targetScope}
                        onChange={(e: any) => setTargetScope(e.target.value)}
                        className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded text-xs text-white"
                      >
                        <option value="targeted">Targeted: Only participants with attempts ≥ Threshold</option>
                        <option value="global">Global: Broadcast to all contest participants immediately</option>
                      </select>
                    </div>

                    {targetScope === "targeted" && (
                      <div>
                        <label className="text-xs text-gray-400 font-bold block mb-1">Min Failed Attempts Threshold:</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={minAttemptsThreshold}
                          onChange={(e) => setMinAttemptsThreshold(parseInt(e.target.value) || 3)}
                          className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded text-xs text-white"
                        />
                      </div>
                    )}
                  </div>

                  {publishedSuccessMsg && (
                    <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 p-3 rounded-lg text-xs font-bold">
                      {publishedSuccessMsg}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handlePublishGuidanceIntervention()}
                      disabled={publishingGuidance}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg shadow-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {publishingGuidance ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Publishing...
                        </>
                      ) : (
                        <>🚀 Publish Guidance Intervention to Live Contest</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Participant Inspector Drawer / View */}
            {showParticipantInspector && (
              <div className="bg-zinc-950 border border-indigo-500/40 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <span>👥</span> Active Participant Telemetry Inspector
                </h4>
                <p className="text-xs text-gray-400">
                  Individual struggle indicators and guidance delivery status per participant.
                </p>
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-xs text-gray-300">
                  <p>Active participants recorded for this contest: <strong className="text-white">{analysisResult.participantStatistics?.activeParticipants || 0}</strong></p>
                  <p className="mt-1 text-gray-400">Guidance condition: Delivery active for users exceeding {minAttemptsThreshold} failed attempts on struggling problems.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Pending Human-in-the-Loop AI Recommendations */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>⚖️</span> Pending AI Recommendations (Human-in-the-Loop)
        </h2>
        <p className="text-xs text-gray-400">
          Privileged contest interventions require explicit administrator approval before execution.
        </p>

        {recommendations.filter(r => r.status === 'pending').length === 0 ? (
          <div className="bg-zinc-950 p-6 rounded-xl text-center text-gray-400 text-sm border border-zinc-800">
            No pending recommendations. Run Contest Analysis above to generate telemetry-driven recommendations.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recommendations.filter(r => r.status === 'pending').map((rec: any) => (
              <div key={rec.recommendationId} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      rec.severity === 'critical' || rec.severity === 'high'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                    }`}>
                      {rec.severity} Severity
                    </span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                      {rec.type}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    ID: {rec.recommendationId}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white mb-1">AI Reasoning Summary:</h4>
                  <p className="text-sm text-gray-300">{rec.reasoningSummary}</p>
                </div>

                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-sm text-indigo-200">
                  <strong>Recommended Action:</strong> {rec.recommendation}
                  {rec.suggestedAction?.hintText && (
                    <div className="mt-2 text-xs text-green-300 font-mono bg-black/40 p-2 rounded">
                      💡 Hint Payload: "{rec.suggestedAction.hintText}"
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleReject(rec.recommendationId)}
                    disabled={adminActionLoading}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-semibold text-xs rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    Dismiss / Reject
                  </button>
                  <button
                    onClick={() => handleApprove(rec.recommendationId)}
                    disabled={adminActionLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-lg transition shadow disabled:opacity-50 cursor-pointer"
                  >
                    ✅ Approve & Execute
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">🛠 Admin Dashboard</h1>

      {/* AI Assistance Toggle */}
      <div className="flex justify-center mb-6">
        <button
          onClick={toggleAiAssistance}
          disabled={aiToggleLoading}
          className={`px-4 py-2 rounded ${aiAssistanceEnabled ? "bg-green-600" : "bg-red-600"
            } ${aiToggleLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          title="Toggle AI Assistance for Code Editor users"
        >
          {aiToggleLoading ? "Updating..." : (aiAssistanceEnabled ? "Disable AI Assistance" : "Enable AI Assistance")}
        </button>
      </div>

      {/* View tabs & Logout */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <button
          onClick={() => setView("users")}
          className={`px-4 py-2 rounded ${view === "users" ? "bg-indigo-600" : "bg-zinc-800"}`}
        >
          Users
        </button>
        <button
          onClick={() => setView("problems")}
          className={`px-4 py-2 rounded ${view === "problems" ? "bg-blue-600" : "bg-zinc-800"}`}
        >
          Problems
        </button>
        <button
          onClick={() => setView("contests")}
          className={`px-4 py-2 rounded ${view === "contests" ? "bg-green-600" : "bg-zinc-800"}`}
        >
          Contests
        </button>
        <button
          onClick={() => {
            setView("agents");
            fetchAgentData();
          }}
          className={`px-4 py-2 rounded flex items-center gap-1.5 ${view === "agents" ? "bg-purple-600" : "bg-zinc-800"}`}
        >
          <span>🤖</span> AI Control Center
        </button>
        <button
          onClick={() => auth?.logout()}
          className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 font-bold transition cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* Error message */}
      {error && <div className="bg-red-600 text-white p-3 mb-6 rounded text-center">{error}</div>}

      {/* View sections */}
      {view === "users"
        ? renderUserSection()
        : view === "problems"
          ? renderProblemSection()
          : view === "contests"
            ? renderContestSection()
            : renderAgentControlCenter()}
    </div>
  );
}
