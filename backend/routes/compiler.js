import express from 'express';
import fetch from 'node-fetch';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
const router = express.Router();

const compilerIp = (process.env.COMPILER_IP || 'http://localhost:5175').trim();
const API_URL = compilerIp.startsWith('http') ? compilerIp : `http://${compilerIp}`;

const backendIp = (process.env.BACKEND_IP || 'http://localhost:5174').trim();
const BACKEND_BASE = backendIp.startsWith('http') ? backendIp : `http://${backendIp}`;
const PROBLEM_API_BASE = `${BACKEND_BASE}/api/problems`;

function handleApiError(res, error, defaultMsg = "Server error") {
  console.error(error);
  if (!res.headersSent) {
    res.status(500).json({ error: defaultMsg });
  }
}

// POST /submit — fetch problem testcases, forward to compiler, then save submission record here
router.post('/submit', async (req, res) => {
  const { lang, code, problemId, userId, contestId, userName, input = '' } = req.body;
  if (!lang || !code || !problemId) {
    return res.status(400).json({ error: "Missing required fields: 'lang', 'code', 'problemId'." });
  }

  try {
    const problemResponse = await fetch(`${PROBLEM_API_BASE}/${problemId}`);
    if (!problemResponse.ok) {
      return res.status(502).json({ error: "Failed to fetch problem details" });
    }
    const problemData = await problemResponse.json();
    const testcases = problemData.testcases || [];
    const score = problemData.score;
    const submitPayload = {
      format: lang,
      code,
      problemId,
      userId,
      contestId,
      userName,
      input,
      testcases,
      score,
    };

    const compilerResponse = await fetch(`${API_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitPayload),
    });

    if (!compilerResponse.ok) {
      const text = await compilerResponse.text();
      return res.status(502).json({ error: "Compiler service error", detail: text });
    }

    const data = await compilerResponse.json();
    const submissionId = data.uuid || data.submissionId || data.id || `sub_${uuidv4().substring(0, 8)}`;
    data.uuid = submissionId;
    data.submissionId = submissionId;

    const finalScore = problemData.score || 0;
    const finalResult = (data.output ? "Accepted" : "Wrong Answer");
    const totalTime = data.totalTime || null;

    try {
      await axios.post(`${BACKEND_BASE}/api/submissions`, {
        problem: problemId,
        user: userId,
        contestId,
        submissionId,
        username: userName,
        score: String(finalResult).trim().toLowerCase() === "accepted" ? finalScore : 0,
        result: finalResult,
        time: totalTime,
        memory: null,
        code: code,
        language: lang,
        errorDetails: data.error || data.detail || (finalResult !== "Accepted" ? "Testcase evaluation failed" : ""),
      });
    } catch (submissionSaveError) {
      console.error("Error saving submission record:", submissionSaveError.message);
    }

    res.json(data);

  } catch (error) {
    handleApiError(res, error, "Submission failed");
  }
});

// /run 
router.post('/run', async (req, res) => {
  const { lang, code, input = '' } = req.body;

  if (!lang || !code) {
    return res.status(400).json({ error: "Missing required fields: 'lang', 'code'." });
  }

  try {
    const response = await fetch(`${API_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: lang, code, input }),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    handleApiError(res, error, "Execution failed");
  }
});

export default router;
