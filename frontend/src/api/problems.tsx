const BACKEND_URL = import.meta.env.VITE_BACKEND_IP || "http://localhost:5174";
const API_BASE = `${BACKEND_URL}/api/problems`;

//Create a new problem
export function addProblem(problemData) {
    return fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(problemData),
    })
        .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `Failed to add problem (${res.status})`);
            return data;
        });
}

// Import problem from LeetCode
export function importLeetCodeProblem(urlOrSlug, customDifficulty) {
    return fetch(`${API_BASE}/import-leetcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ urlOrSlug, customDifficulty }),
    })
        .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `Failed to import problem from LeetCode (${res.status})`);
            return data;
        });
}

// Get a single problem by ID
export function readProblem(problemId) {
    return fetch(`${API_BASE}/${problemId}`, {credentials: "include",})
        .then((res) => {
            if (!res.ok) throw new Error("Problem not found");
            return res.json();
        })
        .catch((err) => {
            console.error("Error reading problem:", err);
        });
}

//Get all problems
export function readProblems() {
    return fetch(API_BASE, {credentials: "include",})
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch problems");
            return res.json();
        })
        .catch((err) => {
            console.error("Error fetching problems:", err);
        });
}

//Update a problem
export function updateProblem(problemId, updatedData) {
    return fetch(`${API_BASE}/${problemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedData),
    })
        .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `Failed to update problem (${res.status})`);
            return data;
        });
}

//Delete a problem
export function deleteProblem(problemId) {
    return fetch(`${API_BASE}/${problemId}`, {
        method: "DELETE",
        credentials: "include",
    })
        .then((res) => {
            if (!res.ok) throw new Error("Failed to delete problem");
            return res.json();
        })
        .catch((err) => {
            console.error("Error deleting problem:", err);
        });
}

