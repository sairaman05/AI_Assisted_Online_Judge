// aiService.js
const API_BASE = `${import.meta.env.VITE_BACKEND_IP}/api/ai`; 

// Fetch current AI assistance enabled flag from backend
export async function fetchAiAssistanceEnabled() {
  const res = await fetch(`${API_BASE}/enabled`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch AI assistance flag");
  const data = await res.json();
  return data.enabled === true;
}

// Set AI assistance enabled flag (admin only)
export async function setAiAssistanceEnabled(enabled) {
  const res = await fetch(`${API_BASE}/enabled`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error("Failed to set AI assistance flag");
  const data = await res.json();
  return data.enabled === true;
}

// Generate AI hint for a problem
export async function generateAIHint(problemDescription, codeBase) {
  const res = await fetch(`${API_BASE}/generate-hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ problemDescription, codeBase }),
  });
  if (!res.ok) throw new Error("Failed to generate AI hint");
  const data = await res.json();
  return data.hint || "";
}

// 2-Minute Proactive AI Monitor
export async function fetchProactiveMonitor(payload) {
  const res = await fetch(`${API_BASE}/proactive-monitor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to fetch proactive monitoring guidance");
  return await res.json();
}

// Wrong Submission Analysis & Hints
export async function fetchWrongSubmissionAnalysis(payload) {
  const res = await fetch(`${API_BASE}/analyze-wrong-submission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to fetch wrong submission analysis");
  return await res.json();
}

// Alternative Solutions & Learning View
export async function fetchAlternativeSolutions(payload) {
  const res = await fetch(`${API_BASE}/alternative-solutions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to fetch alternative solutions");
  return await res.json();
}
