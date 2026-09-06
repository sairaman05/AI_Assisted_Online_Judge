const API_BASE = `${import.meta.env.VITE_BACKEND_IP || 'http://localhost:5174'}/api/agents`;

/**
 * Start an autonomous debugging session for a submission or code
 */
export async function startDebugSession(data: {
  submissionId?: string;
  problemId?: string;
  sourceCode?: string;
  language?: string;
  verdict?: string;
}) {
  const res = await fetch(`${API_BASE}/debug`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Debugging session failed (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch debugging session state
 */
export async function getDebugSession(sessionId: string) {
  const res = await fetch(`${API_BASE}/debug/${sessionId}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch debug session (${res.status})`);
  }
  return res.json();
}

/**
 * Trigger AI Contest Master analysis
 */
export async function analyzeContest(contestId: string) {
  const res = await fetch(`${API_BASE}/contest/${contestId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Contest analysis failed (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch recommendations for a contest
 */
export async function getContestRecommendations(contestId: string = 'all') {
  const res = await fetch(`${API_BASE}/contest/${contestId}/recommendations`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch recommendations (${res.status})`);
  }
  return res.json();
}

/**
 * Approve recommendation (Human-in-the-loop)
 */
export async function approveRecommendation(recommendationId: string, note?: string) {
  const res = await fetch(`${API_BASE}/recommendations/${recommendationId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Approval failed (${res.status})`);
  }
  return res.json();
}

/**
 * Reject recommendation (Human-in-the-loop)
 */
export async function rejectRecommendation(recommendationId: string, reason?: string) {
  const res = await fetch(`${API_BASE}/recommendations/${recommendationId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Rejection failed (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch agent audit logs
 */
export async function getAgentAuditLogs(limit: number = 30) {
  const res = await fetch(`${API_BASE}/audit?limit=${limit}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch audit logs (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch recent debugging sessions
 */
export async function getAgentSessions(limit: number = 20) {
  const res = await fetch(`${API_BASE}/sessions?limit=${limit}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch agent sessions (${res.status})`);
  }
  return res.json();
}
