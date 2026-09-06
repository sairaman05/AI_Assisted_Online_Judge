import express from 'express';
import dotenv from 'dotenv';
import { getAgentLLM } from '../agents/shared/llm.js';

dotenv.config();

const router = express.Router();

// In-memory AI assistance toggle flag.
let aiAssistanceEnabled = true;

// GET endpoint to get current AI assistance flag
router.get('/enabled', (req, res) => {
  res.json({ enabled: aiAssistanceEnabled });
});

// POST endpoint to update AI assistance flag (Protected by admin)
router.post('/enabled', (req, res) => {
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: "'enabled' must be a boolean" });
  }

  aiAssistanceEnabled = enabled;
  res.json({ enabled: aiAssistanceEnabled });
});

// POST endpoint to generate AI hint
router.post('/generate-hint', async (req, res) => {
  const { problemDescription, codeBase } = req.body;

  if (typeof problemDescription !== 'string' || typeof codeBase !== 'string') {
    return res.status(400).json({ error: "'problemDescription' and 'codeBase' must be strings" });
  }

  try {
    const prompt = `You are a helpful coding tutor assisting a challenge participant. Provide a minimal, constructive, non-spoiler hint for the problem.\n\nProblem Description:\n${problemDescription}\n\nBase Code:\n${codeBase}\n\nHint (max 2-3 sentences):`;

    const llm = getAgentLLM({ temperature: 0.7, maxTokens: 250 });
    const completion = await llm.invoke([
      { role: 'system', content: 'You provide minimal, non-spoiler hints for algorithmic coding problems.' },
      { role: 'user', content: prompt }
    ]);

    let hint = (typeof completion?.content === 'string' ? completion.content : JSON.stringify(completion?.content || '')).trim();

    if (!hint || hint.includes('{}') || hint === 'No hint generated.') {
      hint = "Carefully check edge cases, array boundaries, and variable data types for potential overflows or off-by-one errors.";
    }

    res.json({ hint });
  } catch (error) {
    console.error('AI hint generation error:', error);
    res.status(500).json({ error: 'Failed to generate hint: ' + error.message });
  }
});

export default router;
