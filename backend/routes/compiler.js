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

import Problem from '../models/problem.js';

// POST /submit — fetch problem testcases (public + hidden), forward to compiler, then save submission record
router.post('/submit', async (req, res) => {
  const { lang, code, problemId, userId, contestId, userName, input = '' } = req.body;
  if (!lang || !code || !problemId) {
    return res.status(400).json({ error: "Missing required fields: 'lang', 'code', 'problemId'." });
  }

  const effectiveUserId = userId || 'user_guest';

  try {
    const problem = await Problem.findOne({
      $or: [
        { id: problemId },
        ...(problemId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: problemId }] : [])
      ]
    });

    let combinedTestcases = [];
    if (problem) {
      const pubCases = (problem.publicTestcases || []).map((t, idx) => ({
        input: t.input || '',
        output: t.output || '',
        isPublic: true,
        label: `Visible Testcase ${idx + 1}`
      }));
      const hidCases = (problem.hiddenTestcases || []).map((t, idx) => ({
        input: t.input || '',
        output: t.output || '',
        isPublic: false,
        label: `Hidden Testcase ${idx + 1}`
      }));
      const fallbackCases = (problem.testcases || []).map((t, idx) => ({
        input: t.input || '',
        output: t.output || '',
        isPublic: false,
        label: `Testcase ${idx + 1}`
      }));

      if (pubCases.length > 0 || hidCases.length > 0) {
        combinedTestcases = [...pubCases, ...hidCases];
      } else {
        combinedTestcases = fallbackCases;
      }
    }

    if (combinedTestcases.length === 0) {
      combinedTestcases = [{ input: input || '', output: '', isPublic: true, label: 'Default Testcase' }];
    }

    const submitPayload = {
      format: lang,
      code,
      problemId,
      userId: effectiveUserId,
      contestId,
      userName: userName || 'Competitor',
      input,
      testcases: combinedTestcases,
      score: problem?.score || 100,
    };

    const compilerResponse = await fetch(`${API_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitPayload),
    });

    let data;
    if (!compilerResponse.ok) {
      const text = await compilerResponse.text();
      let detailMsg = text;
      try {
        const parsed = JSON.parse(text);
        detailMsg = parsed.error || parsed.detail || text;
      } catch (e) {}
      return res.status(200).json({
        success: false,
        error: `Compiler Execution Error: ${detailMsg}`,
        detail: detailMsg
      });
    } else {
      data = await compilerResponse.json();
    }

    const submissionId = data.uuid || data.submissionId || data.id || `sub_${uuidv4().substring(0, 8)}`;
    data.uuid = submissionId;
    data.submissionId = submissionId;

    const finalScore = problem?.score || 100;
    const finalResult = data.success ? "Accepted" : (data.error || "Wrong Answer");
    const totalTime = data.totalTime || null;

    // Formatted text output for UI Console
    if (data.success) {
      data.output = `🎉 ACCEPTED\nAll ${data.totalCount || combinedTestcases.length} testcases passed! (${totalTime ? totalTime + 'ms' : 'Executed successfully'})`;
    } else {
      data.output = `❌ REJECTED\nVerdict: ${finalResult}\nPassed: ${data.passedCount || 0} / ${data.totalCount || combinedTestcases.length} testcases.\n\nDetail:\n${data.detail || ''}`;
    }

    try {
      await axios.post(`${BACKEND_BASE}/api/submissions`, {
        problem: problemId,
        user: effectiveUserId,
        contestId,
        submissionId,
        username: userName || 'Competitor',
        score: finalResult === "Accepted" ? finalScore : 0,
        result: finalResult.startsWith("Wrong Answer") ? "Wrong Answer" : finalResult,
        time: totalTime,
        memory: null,
        code: code,
        language: lang,
        errorDetails: data.error || data.detail || (finalResult !== "Accepted" ? "Testcase evaluation failed" : ""),
      });

      if (finalResult === "Accepted" && effectiveUserId) {
        const User = (await import('../models/user.js')).default;
        await User.findOneAndUpdate(
          { $or: [{ id: effectiveUserId }, { email: effectiveUserId }] },
          { $addToSet: { solvedProblems: problemId } }
        );
      }
    } catch (submissionSaveError) {
      console.error("Error saving submission record:", submissionSaveError.message);
    }

    res.json(data);

  } catch (error) {
    handleApiError(res, error, "Submission failed");
  }
});

// POST /run — evaluate code against visible testcases or provided input
router.post('/run', async (req, res) => {
  const { lang, code, input = '', problemId } = req.body;

  if (!lang || !code) {
    return res.status(400).json({ error: "Missing required fields: 'lang', 'code'." });
  }

  try {
    let visibleTestcases = [];
    if (problemId) {
      const problem = await Problem.findOne({
        $or: [
          { id: problemId },
          ...(problemId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: problemId }] : [])
        ]
      });
      if (problem && Array.isArray(problem.publicTestcases) && problem.publicTestcases.length > 0) {
        visibleTestcases = problem.publicTestcases;
      }
    }

    if (visibleTestcases.length > 0) {
      let results = [];
      let passedCount = 0;

      for (let i = 0; i < visibleTestcases.length; i++) {
        const tc = visibleTestcases[i];
        const tcInput = tc.input || '';
        const expected = (tc.output || '').trim().replace(/\r\n/g, '\n');

        const response = await fetch(`${API_URL}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: lang, code, input: tcInput }),
        });

        const data = await response.json();
        let actual = '';
        let status = 'PASSED';
        let errorMsg = null;

        if (!data.success) {
          status = 'ERROR';
          errorMsg = data.error || data.detail || 'Execution error';
        } else {
          actual = (data.output || '').trim().replace(/\r\n/g, '\n');
          if (actual !== expected) {
            status = 'FAILED';
          } else {
            passedCount++;
          }
        }

        results.push({
          index: i + 1,
          input: tcInput,
          expected,
          actual: data.success ? actual : errorMsg,
          status,
          explanation: tc.explanation || ''
        });
      }

      // Build formatted output string
      let reportLines = ['=== 🧪 VISIBLE TEST CASES RESULT ===\n'];
      results.forEach(r => {
        const icon = r.status === 'PASSED' ? '✓' : '❌';
        reportLines.push(`Testcase ${r.index}: ${r.status} ${icon}`);
        reportLines.push(`  Input: ${r.input.trim() || '(empty)'}`);
        reportLines.push(`  Expected Output: ${r.expected || '(empty)'}`);
        reportLines.push(`  Actual Output:   ${r.actual || '(empty)'}`);
        if (r.explanation) {
          reportLines.push(`  Explanation:     ${r.explanation}`);
        }
        reportLines.push('----------------------------------------');
      });

      const total = visibleTestcases.length;
      reportLines.push(`\n📊 Verdict: ${passedCount} / ${total} Visible Test Cases Passed.`);

      return res.json({
        success: passedCount === total,
        output: reportLines.join('\n'),
        results,
        passedCount,
        totalCount: total
      });
    } else {
      // Standard run with provided input
      const response = await fetch(`${API_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: lang, code, input }),
      });
      const data = await response.json();

      if (data.success && (!data.output || String(data.output).trim() === '')) {
        data.output = "(Code executed successfully with 0 output produced. Add print statements or call your function.)";
      }

      return res.json(data);
    }
  } catch (error) {
    handleApiError(res, error, "Execution failed");
  }
});

export default router;
