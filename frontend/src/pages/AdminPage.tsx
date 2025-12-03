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

  useEffect(() => {
    fetchData();
  }, []);

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
              {/* Input textarea */}
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

              {/* Output textarea */}
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

              {/* Remove testcase button */}
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

          {/* Add Testcase button */}
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
            onWheel={e => e.currentTarget.blur()}  // prevent scroll wheel changing value
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


        <div></div>

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

      {/* View tabs */}
      <div className="flex justify-center gap-6 mb-8">
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
      </div>

      {/* Error message */}
      {error && <div className="bg-red-600 text-white p-3 mb-6 rounded text-center">{error}</div>}

      {/* View sections */}
      {view === "users"
        ? renderUserSection()
        : view === "problems"
          ? renderProblemSection()
          : renderContestSection()}
    </div>
  );
}
