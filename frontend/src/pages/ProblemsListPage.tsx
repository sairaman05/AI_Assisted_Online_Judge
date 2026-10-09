import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { readProblems, importLeetCodeProblem } from "../api/problems";
import { AuthContext } from "../api/authuser";

interface ProblemItem {
  _id: string;
  id: string;
  title: string;
  description: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  tags?: string[];
  score?: number;
  acceptanceRate?: number;
  solvedCount?: number;
  createdAt?: string;
}

const POPULAR_LEETCODE_PRESETS = [
  { title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "Hard", icon: "💧" },
  { title: "Coin Change", slug: "coin-change", difficulty: "Medium", icon: "🪙" },
  { title: "Merge Intervals", slug: "merge-intervals", difficulty: "Medium", icon: "🔀" },
  { title: "LRU Cache", slug: "lru-cache", difficulty: "Medium", icon: "🔄" },
  { title: "Longest Palindromic Substring", slug: "longest-palindromic-substring", difficulty: "Medium", icon: "🔤" },
  { title: "Subarray Sum Equals K", slug: "subarray-sum-equals-k", difficulty: "Medium", icon: "🧩" },
];

export default function ProblemsListPage() {
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const [solvedProblemIds, setSolvedProblemIds] = useState<string[]>([]);

  // Newly Added Tag tracking
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("oj_newly_added_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [dismissedTagIds, setDismissedTagIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("oj_dismissed_tag_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Action status banner
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // LeetCode Import modal state
  const [showLeetCodeModal, setShowLeetCodeModal] = useState(false);
  const [leetCodeInput, setLeetCodeInput] = useState("");
  const [leetCodeDifficulty, setLeetCodeDifficulty] = useState("Auto");
  const [importingLeetCode, setImportingLeetCode] = useState(false);

  // Seeding state
  const [seedingRecent, setSeedingRecent] = useState(false);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const backendIp = import.meta.env.VITE_BACKEND_IP || "http://localhost:5174";

  useEffect(() => {
    fetchProblems();
    if (user?.id || user?.email) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const data = await readProblems();
      if (Array.isArray(data)) {
        setProblems(data);
      }
    } catch (err) {
      console.error("Failed to load problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const userId = user?.id || user?.email;
      const res = await fetch(`${backendIp}/api/users/profile/${userId}`, { credentials: "include" });
      if (res.ok) {
        const profileData = await res.json();
        setSolvedProblemIds(profileData.solvedProblemIds || []);
      }
    } catch (err) {
      console.error("Failed to fetch user profile for solved checkmarks:", err);
    }
  };

  // Helper to determine if a problem should carry the "Newly Added" badge
  const isNewlyAdded = (prob: ProblemItem) => {
    const probKey = prob.id || prob._id;
    if (dismissedTagIds.includes(probKey)) return false;
    if (newlyAddedIds.includes(probKey)) return true;
    // Default flag for newly seeded/imported problems created during recent executions
    if (prob.id?.startsWith("recent_") || prob.id?.startsWith("leetcode_")) return true;
    return false;
  };

  // Dismiss "Newly Added" tag upon click
  const handleDismissTag = (probId: string) => {
    const updatedDismissed = Array.from(new Set([...dismissedTagIds, probId]));
    setDismissedTagIds(updatedDismissed);
    localStorage.setItem("oj_dismissed_tag_ids", JSON.stringify(updatedDismissed));

    const updatedNew = newlyAddedIds.filter((id) => id !== probId);
    setNewlyAddedIds(updatedNew);
    localStorage.setItem("oj_newly_added_ids", JSON.stringify(updatedNew));
  };

  // Seed algorithmic problems from recent technical interviews
  const handleSeedRecentProblems = async () => {
    try {
      setSeedingRecent(true);
      setActionMessage(null);
      const res = await fetch(`${backendIp}/api/problems/seed-recent`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const addedItems = data.added || [];
        const addedIds = addedItems.map((p: any) => p.id || p._id);

        // Update newly added IDs in state & persistence
        const updatedNew = Array.from(new Set([...newlyAddedIds, ...addedIds]));
        setNewlyAddedIds(updatedNew);
        localStorage.setItem("oj_newly_added_ids", JSON.stringify(updatedNew));

        // Immediately update problem list in UI so the user sees them without delay
        if (addedItems.length > 0) {
          setProblems((prev) => {
            const existingKeys = new Set(prev.map((p) => p.id || p._id));
            const freshItems = addedItems.filter((p: any) => !existingKeys.has(p.id || p._id));
            return [...freshItems, ...prev];
          });
        }

        setActionMessage({
          text: data.message || `Successfully added ${addedItems.length} new problem(s) to the practice set!`,
          type: "success",
        });

        // Background refetch to ensure synchronized state
        fetchProblems();
      } else {
        setActionMessage({ text: "Failed to seed recent problems from server.", type: "error" });
      }
    } catch (err: any) {
      console.error("Seed error:", err);
      setActionMessage({ text: "Error seeding recent problems: " + err.message, type: "error" });
    } finally {
      setSeedingRecent(false);
    }
  };

  // Import question from LeetCode
  const handleImportLeetCode = async (overrideSlug?: string) => {
    const targetInput = overrideSlug || leetCodeInput;
    if (!targetInput.trim()) {
      setActionMessage({ text: "Please enter a LeetCode URL, slug, or problem title.", type: "error" });
      return;
    }

    try {
      setImportingLeetCode(true);
      setActionMessage(null);

      const diffParam = leetCodeDifficulty === "Auto" ? undefined : leetCodeDifficulty;
      const data = await importLeetCodeProblem(targetInput, diffParam);

      if (data?.problem) {
        const prob = data.problem;
        const probKey = prob.id || prob._id;

        // Mark as newly added
        const updatedNew = Array.from(new Set([...newlyAddedIds, probKey]));
        setNewlyAddedIds(updatedNew);
        localStorage.setItem("oj_newly_added_ids", JSON.stringify(updatedNew));

        // Immediately prepend to local problems list
        setProblems((prev) => {
          const filtered = prev.filter((p) => (p.id || p._id) !== probKey);
          return [prob, ...filtered];
        });

        setActionMessage({
          text: data.message || `🎉 Successfully imported "${prob.title}" from LeetCode!`,
          type: "success",
        });

        setShowLeetCodeModal(false);
        setLeetCodeInput("");

        // Refetch in background to persist
        fetchProblems();
      } else {
        throw new Error(data?.error || "Failed to import problem from LeetCode.");
      }
    } catch (err: any) {
      console.error("LeetCode import error:", err);
      setActionMessage({ text: "Import error: " + err.message, type: "error" });
    } finally {
      setImportingLeetCode(false);
    }
  };

  // Filter & sort: Newly added problems are prioritized at the top
  const filteredProblems = problems
    .filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesDifficulty =
        difficultyFilter === "All" || (p.difficulty || "Medium").toLowerCase() === difficultyFilter.toLowerCase();

      return matchesSearch && matchesDifficulty;
    })
    .sort((a, b) => {
      const aNew = isNewlyAdded(a) ? 1 : 0;
      const bNew = isNewlyAdded(b) ? 1 : 0;
      if (aNew !== bNew) return bNew - aNew; // Newly added problems first!
      return 0;
    });

  const getDifficultyBadge = (difficulty: string = "Medium") => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">Easy</span>;
      case "hard":
        return <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-md">Hard</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">Medium</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-gray-900 border border-indigo-500/20 p-6 sm:p-8 rounded-2xl mb-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Practice Arena
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                LeetCode Enabled 🌐
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              Practice Algorithmic Problems 📚
            </h1>
            <p className="text-gray-300 max-w-2xl text-sm sm:text-base">
              Solve competitive programming and LeetCode challenges with real-time AI assistance, auto-generated judge testcases, and alternative optimal solution learning!
            </p>
          </div>

          {/* Action Buttons: Add Recent & Import from LeetCode */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            {/* Import from LeetCode Button */}
            <button
              onClick={() => setShowLeetCodeModal(true)}
              className="px-4 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-gray-950 font-black text-sm rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <span>📥 Import from LeetCode</span>
            </button>

            {/* Seed Recent Problems Button */}
            <button
              onClick={handleSeedRecentProblems}
              disabled={seedingRecent}
              className="px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50 active:scale-95"
            >
              <span>{seedingRecent ? "⏳ Adding..." : "➕ Add Recent Problems"}</span>
            </button>
          </div>
        </div>

        {/* Action Status Notification */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center justify-between text-sm font-medium border animate-fadeIn ${
              actionMessage.type === "success"
                ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/60 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{actionMessage.type === "success" ? "✅" : "⚠️"}</span>
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-gray-400 hover:text-white font-bold ml-4 text-base cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 bg-gray-900 p-4 rounded-xl border border-gray-800">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search problems, LeetCode, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Difficulty Filter Tabs */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {["All", "Easy", "Medium", "Hard"].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  difficultyFilter === diff
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Problems Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-gray-400 font-medium">Loading problem set...</div>
          ) : filteredProblems.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-medium">
              No problems found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-950/80 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="py-4 px-6 w-16 text-center">Status</th>
                    <th className="py-4 px-6">Title & Tags</th>
                    <th className="py-4 px-6">Difficulty</th>
                    <th className="py-4 px-6">Points</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm">
                  {filteredProblems.map((prob) => {
                    const probKey = prob.id || prob._id;
                    const isSolved = solvedProblemIds.includes(prob.id) || solvedProblemIds.includes(prob._id);
                    const newlyAdded = isNewlyAdded(prob);
                    const isLeetCode = prob.tags?.includes("LeetCode") || prob.id?.startsWith("leetcode_");

                    return (
                      <tr
                        key={probKey}
                        className={`hover:bg-gray-800/40 transition ${
                          newlyAdded ? "bg-emerald-950/15" : ""
                        }`}
                      >
                        <td className="py-4 px-6 text-center">
                          {isSolved ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs" title="Solved">
                              ✓
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              onClick={() => navigate(`/editor?problemId=${prob.id}`)}
                              className="font-bold text-gray-100 hover:text-indigo-400 cursor-pointer transition text-base"
                            >
                              {prob.title}
                            </span>

                            {/* "Newly Added" Interactive Tag - Click to disappear */}
                            {newlyAdded && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDismissTag(probKey);
                                }}
                                title="Newly added question! Click to dismiss tag"
                                className="group inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 rounded-full cursor-pointer hover:bg-emerald-500/30 hover:border-emerald-300 transition-all shadow-[0_0_10px_rgba(16,185,129,0.25)] animate-pulse"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                <span>Newly Added</span>
                                <span className="text-emerald-400/80 group-hover:text-white transition-colors ml-0.5 text-xs font-bold">
                                  ×
                                </span>
                              </button>
                            )}

                            {/* LeetCode platform indicator badge */}
                            {isLeetCode && (
                              <span className="text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span>🌐</span> LeetCode
                              </span>
                            )}
                          </div>

                          {prob.tags && prob.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {prob.tags.map((tag, idx) => (
                                <span key={idx} className="text-[11px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {getDifficultyBadge(prob.difficulty)}
                        </td>
                        <td className="py-4 px-6 text-gray-300 font-medium">
                          {prob.score || 100} pts
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => navigate(`/editor?problemId=${prob.id}`)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition cursor-pointer shadow"
                          >
                            Solve Problem ➔
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* LeetCode Import Modal */}
      {showLeetCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative">
            
            {/* Close Button */}
            <button
              onClick={() => setShowLeetCodeModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
            >
              ×
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📥</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Import from LeetCode
              </h2>
            </div>
            <p className="text-gray-300 text-sm mb-6">
              Paste any LeetCode problem link or slug. The Online Judge will automatically fetch the description and generate starter code with full judge testcases!
            </p>

            {/* Input URL or Slug */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                LeetCode URL, Slug, or Problem Name
              </label>
              <input
                type="text"
                placeholder="e.g. https://leetcode.com/problems/trapping-rain-water/ or coin-change"
                value={leetCodeInput}
                onChange={(e) => setLeetCodeInput(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Difficulty Override */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Difficulty Preference
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["Auto", "Easy", "Medium", "Hard"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setLeetCodeDifficulty(d)}
                    className={`py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      leetCodeDifficulty === d
                        ? "bg-amber-500/20 text-amber-400 border-amber-500"
                        : "bg-gray-950 text-gray-400 border-gray-800 hover:bg-gray-800"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick 1-Click Import Presets */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                ⚡ Quick 1-Click Popular Classics
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POPULAR_LEETCODE_PRESETS.map((preset) => (
                  <button
                    key={preset.slug}
                    type="button"
                    disabled={importingLeetCode}
                    onClick={() => {
                      setLeetCodeInput(preset.slug);
                      handleImportLeetCode(preset.slug);
                    }}
                    className="p-2.5 bg-gray-950 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl text-left transition cursor-pointer group disabled:opacity-50"
                  >
                    <div className="text-sm font-semibold text-gray-200 group-hover:text-amber-400 flex items-center gap-1.5 truncate">
                      <span>{preset.icon}</span>
                      <span className="truncate">{preset.title}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">{preset.difficulty}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowLeetCodeModal(false)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importingLeetCode || !leetCodeInput.trim()}
                onClick={() => handleImportLeetCode()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-gray-950 font-black text-xs rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span>{importingLeetCode ? "⏳ Importing & Preparing Testcases..." : "Import Problem ➔"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
