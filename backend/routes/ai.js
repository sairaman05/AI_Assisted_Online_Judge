import express from 'express';
import dotenv from 'dotenv';
import { generateTimedProgressiveHint } from '../services/hintService.js';
import { analyzeFailedSubmission } from '../services/debugService.js';
import { analyzeAcceptedCode } from '../services/codeAnalysisService.js';
import { analyzeAlternativeApproaches } from '../services/alternativeApproachService.js';
import AIInteraction from '../models/aiInteraction.js';
import ProblemSession from '../models/problemSession.js';

dotenv.config();

const router = express.Router();

let aiAssistanceEnabled = true;

router.get('/enabled', (req, res) => {
  res.json({ enabled: aiAssistanceEnabled });
});

router.post('/enabled', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: "'enabled' must be a boolean" });
  }
  aiAssistanceEnabled = enabled;
  res.json({ enabled: aiAssistanceEnabled });
});

// GET/START PROBLEM HINT SESSION (Persists timer across page reloads per user + problem)
router.post('/session', async (req, res) => {
  try {
    const { userId, problemId } = req.body;
    if (!userId || !problemId) {
      return res.status(400).json({ error: "userId and problemId are required." });
    }

    let session = await ProblemSession.findOne({ userId, problemId });
    if (!session) {
      const sessionId = `sess_${userId}_${problemId}_${Date.now()}`;
      session = await ProblemSession.create({
        userId,
        problemId,
        sessionId,
        sessionStartedAt: new Date(),
        hintLevel: 0,
        hintHistory: []
      });
    }

    const elapsedSeconds = Math.floor((Date.now() - new Date(session.sessionStartedAt).getTime()) / 1000);

    res.json({
      sessionId: session.sessionId,
      sessionStartedAt: session.sessionStartedAt,
      elapsedSeconds,
      hintLevel: session.hintLevel,
      hintHistory: session.hintHistory
    });
  } catch (error) {
    console.error('Session init error:', error);
    res.status(500).json({ error: 'Failed to initialize session: ' + error.message });
  }
});

// TIMED PROGRESSIVE HINT ENDPOINT (2, 4, 6, 8, 10 Minutes, Max 5 Hints)
router.post('/timed-hint', async (req, res) => {
  try {
    const { userId, problemId, problemTitle, problemDescription, constraints, userCode, language, requestedLevel } = req.body;

    if (!userId || !problemId) {
      return res.status(400).json({ error: "userId and problemId are required." });
    }

    let session = await ProblemSession.findOne({ userId, problemId });
    if (!session) {
      const sessionId = `sess_${userId}_${problemId}_${Date.now()}`;
      session = await ProblemSession.create({
        userId,
        problemId,
        sessionId,
        sessionStartedAt: new Date(),
        hintLevel: 0,
        hintHistory: []
      });
    }

    const elapsedSeconds = Math.floor((Date.now() - new Date(session.sessionStartedAt).getTime()) / 1000);
    const targetLevel = requestedLevel || (session.hintLevel + 1);

    if (targetLevel > 5) {
      return res.status(400).json({ error: "Maximum of 5 progressive hints reached for this problem." });
    }

    const requiredElapsedSeconds = targetLevel * 120; // 2 min (120s), 4 min (240s), 6 min (360s), 8 min (480s), 10 min (600s)

    // Allow hint if elapsed time threshold is met OR if previously unlocked
    if (elapsedSeconds < requiredElapsedSeconds && targetLevel > session.hintLevel) {
      const remainingSeconds = requiredElapsedSeconds - elapsedSeconds;
      return res.status(403).json({
        error: `Hint ${targetLevel} is locked. Available in ${Math.ceil(remainingSeconds / 60)} minute(s).`,
        remainingSeconds,
        requiredElapsedSeconds
      });
    }

    // Check if hint for targetLevel already generated in session
    const existingHint = session.hintHistory.find(h => h.hintLevel === targetLevel);
    if (existingHint) {
      return res.json(existingHint);
    }

    // Generate new timed hint with previous hints in prompt context to prevent repetition
    const previousHintTexts = session.hintHistory.map(h => `Level ${h.hintLevel}: ${h.hintText}`);
    
    const hintData = await generateTimedProgressiveHint({
      problemTitle,
      problemDescription,
      constraints,
      userCode,
      language,
      hintLevel: targetLevel,
      previousHints: previousHintTexts
    });

    const newHintRecord = {
      hintLevel: targetLevel,
      hintTitle: hintData.title || `Level ${targetLevel} Hint`,
      hintText: hintData.hint,
      keyConcept: hintData.keyConcept || "Algorithmic Reasoning",
      generatedAt: new Date()
    };

    session.hintLevel = Math.max(session.hintLevel, targetLevel);
    session.hintHistory.push(newHintRecord);
    await session.save();

    await AIInteraction.create({
      userId,
      problemId,
      interactionType: 'timed-hint',
      requestContext: { hintLevel: targetLevel, language },
      response: newHintRecord
    }).catch(e => console.error('Failed to log AI interaction:', e.message));

    res.json(newHintRecord);
  } catch (error) {
    console.error('Timed hint error:', error);
    res.status(500).json({ error: 'Failed to generate timed hint: ' + error.message });
  }
});

// Wrong Submission AI Debugger Endpoint
router.post('/debug-submission', async (req, res) => {
  try {
    const { problemTitle, problemDescription, constraints, userCode, language, verdict, errorLog, expectedOutput, actualOutput, testcaseInfo, provideCodeFix, userId, problemId, submissionId } = req.body;

    const debugData = await analyzeFailedSubmission({
      problemTitle,
      problemDescription,
      constraints,
      userCode,
      language,
      verdict,
      errorLog,
      expectedOutput,
      actualOutput,
      testcaseInfo,
      provideCodeFix
    });

    if (userId) {
      await AIInteraction.create({
        userId,
        problemId,
        submissionId,
        interactionType: 'debug',
        requestContext: { verdict, language },
        response: debugData
      }).catch(e => console.error('Failed to log AI interaction:', e.message));
    }

    res.json(debugData);
  } catch (error) {
    console.error('Debug submission error:', error);
    res.status(500).json({ error: 'Failed to debug submission: ' + error.message });
  }
});

// Accepted Submission AI Code Analysis Endpoint
router.post('/analyze-accepted-code', async (req, res) => {
  try {
    const { problemTitle, problemDescription, acceptedCode, language, sampleTestcase, userId, problemId } = req.body;

    const analysisData = await analyzeAcceptedCode({
      problemTitle,
      problemDescription,
      acceptedCode,
      language,
      sampleTestcase
    });

    if (userId) {
      await AIInteraction.create({
        userId,
        problemId,
        interactionType: 'code-analysis',
        requestContext: { language },
        response: analysisData
      }).catch(e => console.error('Failed to log AI interaction:', e.message));
    }

    res.json(analysisData);
  } catch (error) {
    console.error('Accepted code analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze accepted code: ' + error.message });
  }
});

// Alternative Approaches Analysis Endpoint
router.post('/alternative-approaches', async (req, res) => {
  try {
    const { problemTitle, problemDescription, acceptedCode, language, userId, problemId } = req.body;

    const altData = await analyzeAlternativeApproaches({
      problemTitle,
      problemDescription,
      acceptedCode,
      language
    });

    if (userId) {
      await AIInteraction.create({
        userId,
        problemId,
        interactionType: 'alternative-approaches',
        requestContext: { language },
        response: altData
      }).catch(e => console.error('Failed to log AI interaction:', e.message));
    }

    res.json(altData);
  } catch (error) {
    console.error('Alternative approaches error:', error);
    res.status(500).json({ error: 'Failed to generate alternative approaches: ' + error.message });
  }
});

export default router;
