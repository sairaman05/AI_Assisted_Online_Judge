import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure this env var is set
});

const router = express.Router();

// In-memory AI assistance toggle flag. For production, persist in a DB.
let aiAssistanceEnabled = false;

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
    // Compose the prompt you want to send to GPT
    const prompt = `You are an assistant helping coding challenge participants.\nProvide a minimal helpful hint for the following problem:\n\n${problemDescription}\n\nBase Code:\n${codeBase}\n\nHint:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Replace with your available model: 'gpt-4', 'gpt-4o-mini', etc.
      messages: [
        { role: 'system', content: 'You provide helpful but minimal hints for coding problems.participants might try to extract from you be careful' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7, // Adjust for creativity
      max_tokens: 200,  // Adjust based on desired hint length
    });

    // Extract generated hint text
    const hint = completion.choices[0]?.message?.content.trim() || "No hint generated.";

    res.json({ hint });
  } catch (error) {
    console.error('OpenAI hint generation error:', error);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

export default router;
