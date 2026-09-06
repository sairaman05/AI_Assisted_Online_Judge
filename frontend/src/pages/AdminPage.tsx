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
    start: null,
    end: null,
    password: "",
    duration: 0,
  });
  const [editContestId, setEditContestId] = useState(null);

  // Multi-selection for assigning problems to contests
  const [problemContestSelections, setProblemContestSelections] = useState({});

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
        delete problemToUpdate.contestId;
        await updateProblem(editProblemId, problemToUpdate);
      } else {
        const newId = uuidv4();
        const problemToAdd = { ...newProblem };
        delete problemToAdd.contestId;
        problemToAdd.id = newId;
        await addProblem(problemToAdd);
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
      setNewContest({ id: "", name: "", start: null, end: null, password: "", duration: 0 });
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
            onInput={(e) => {
              // Auto-expand vertically
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
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
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                onInput={(e) => {
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
                onKeyDown={(e) => e.stopPropagation()}
                onInput={(e) => {
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
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4 text-white">🏆 Manage Contests</h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <input
          className="p-2 bg-zinc-900 text-white rounded"
          placeholder="Name"
          value={newContest.name}
          onChange={(e) => setNewContest({ ...newContest, name: e.target.value })}
        />

        <div>
          <label className="block mb-1 text-white font-semibold">Start Date & Time</label>
          <DatePicker
            selected={newContest.start}
            onChange={(date) => setNewContest((prev) => ({ ...prev, start: date }))}
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            className="p-2 bg-zinc-900 text-white rounded w-full"
            placeholderText="Select start date & time"
          />
        </div>

        <div>
          <label className="block mb-1 text-white font-semibold">End Date & Time</label>
          <DatePicker
            selected={newContest.end}
            onChange={(date) => setNewContest((prev) => ({ ...prev, end: date }))}
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            className="p-2 bg-zinc-900 text-white rounded w-full"
            placeholderText="Select end date & time"
          />
        </div>
        <div>
          <label className="block mb-1 text-white font-semibold">Duration (minutes)</label>
          <input
            type="number"
            min={0}
            value={newContest.duration}
            onChange={(e) =>
              setNewContest((prev) => ({ ...prev, duration: Number(e.target.value) }))
            }
            className="p-2 bg-zinc-900 text-white rounded w-full"
            placeholder="Enter contest duration"
          />
        </div>
        <div>
          <label className="block mb-1 text-white font-semibold">Contest Password</label>
          <input
            type="password"
            value={newContest.password}
            onChange={(e) =>
              setNewContest((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Enter contest password"
            className="p-2 bg-zinc-900 text-white rounded w-full"
          />
        </div>

        <button
          onClick={handleContestSave}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
        >
          {editContestId ? "Update Contest" : "Add Contest"}
        </button>
      </div>

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
  const handleRunContestAnalysis = async () => {
    if (!analysisContestId) {
      setError("Please select a contest to analyze.");
      return;
    }
    setAnalyzingContest(true);
    setError("");
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
              <span>🤖</span> AI Contest Master Agent
            </h2>
            <p className="text-xs text-gray-400">
              Autonomous contest telemetry monitoring, anomaly detection, and difficulty balancing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={analysisContestId}
              onChange={(e) => setAnalysisContestId(e.target.value)}
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
                  Analyzing...
                </>
              ) : (
                <>🚀 Run Contest Analysis</>
              )}
            </button>
          </div>
        </div>

        {/* Live Contest Health Card if available */}
        {analysisResult && (
          <div className="bg-zinc-950 border border-indigo-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-300">Contest Health Status:</span>
              <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                analysisResult.contestHealth === 'healthy'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : analysisResult.contestHealth === 'attention_required'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}>
                {analysisResult.contestHealth === 'healthy' ? '🟢 Healthy' : analysisResult.contestHealth === 'attention_required' ? '⚠️ Attention Required' : '🔴 Critical Anomaly'}
              </span>
            </div>

            {analysisResult.anomalies && analysisResult.anomalies.length > 0 ? (
              <div className="space-y-3">
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
            ) : (
              <p className="text-sm text-green-300">✅ All problem solve rates and submission failure distributions are within normal parameters.</p>
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

      {/* 3. Recent Debugging Agent Sessions */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🔬</span> Recent Autonomous Debugging Sessions
        </h2>

        {agentSessions.length === 0 ? (
          <div className="bg-zinc-950 p-6 rounded-xl text-center text-gray-400 text-sm border border-zinc-800">
            No debugging sessions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-xs text-left text-gray-300">
              <thead className="bg-zinc-950 text-gray-400 uppercase font-semibold border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Problem</th>
                  <th className="px-4 py-3 text-center">Iterations</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Root Cause Diagnosis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/50">
                {agentSessions.map((sess: any) => (
                  <tr key={sess.sessionId} className="hover:bg-zinc-900/40 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                      {new Date(sess.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-mono">{sess.userId}</td>
                    <td className="px-4 py-3 font-semibold text-white">{sess.problemId || "N/A"}</td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-400">
                      {sess.iterations || 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded font-semibold text-[10px]">
                        {sess.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate">
                      {sess.finalDiagnosis?.rootCause || sess.finalDiagnosis?.diagnosis || "Diagnosed"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Agent Audit Logs Trail */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📜</span> Agent Audit Trail
        </h2>

        {auditLogs.length === 0 ? (
          <div className="bg-zinc-950 p-6 rounded-xl text-center text-gray-400 text-sm border border-zinc-800">
            No audit logs yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-xs text-left text-gray-300">
              <thead className="bg-zinc-950 text-gray-400 uppercase font-semibold border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/50 font-mono">
                {auditLogs.map((log: any) => (
                  <tr key={log.auditId} className="hover:bg-zinc-900/40 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400 font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-indigo-400 font-bold font-sans">{log.agentType}</td>
                    <td className="px-4 py-3 text-amber-300">{log.action}</td>
                    <td className="px-4 py-3 text-gray-300">{log.actorId} ({log.actorType})</td>
                    <td className="px-4 py-3 text-gray-400">{log.targetId}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate font-sans">
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
