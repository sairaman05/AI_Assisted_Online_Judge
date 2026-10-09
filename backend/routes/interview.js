import express from 'express';
import multer from 'multer';
import { parseJDPdfBuffer, analyzeJobDescription } from '../services/jdAnalysisService.js';
import { generateInterviewRoadmap, evaluateMockInterviewAnswer, generateLastMinutePrepDoc } from '../services/interviewPreparationService.js';
import { buildPreparationPdfBuffer } from '../services/pdfGeneratorService.js';
import InterviewPrep from '../models/interviewPrep.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// POST /upload-jd — Upload PDF JD and extract skills
router.post('/upload-jd', upload.single('jdFile'), async (req, res) => {
  try {
    const { company, role, jdText: rawJdText } = req.body;
    let extractedText = rawJdText || '';

    if (req.file) {
      const pdfText = await parseJDPdfBuffer(req.file.buffer);
      extractedText += '\n' + pdfText;
    }

    const jdAnalysis = await analyzeJobDescription({
      company,
      role,
      jdText: extractedText
    });

    res.json({
      jdText: extractedText,
      analysis: jdAnalysis
    });
  } catch (error) {
    console.error('Upload JD error:', error);
    res.status(500).json({ error: 'Failed to process JD PDF: ' + error.message });
  }
});

// POST /generate-roadmap — Create personalized preparation roadmap
router.post('/generate-roadmap', async (req, res) => {
  try {
    const { userId, company, role, experience, rounds, extractedSkills, jdText } = req.body;

    const roadmap = await generateInterviewRoadmap({
      company,
      role,
      experience,
      rounds: rounds || ['Coding Assessment', 'Technical Interview', 'Managerial', 'HR'],
      extractedSkills,
      userStats: {}
    });

    let prepRecord;
    if (userId) {
      prepRecord = await InterviewPrep.create({
        userId,
        company,
        role,
        experience,
        rounds: rounds || ['Coding Assessment', 'Technical Interview', 'Managerial', 'HR'],
        jdText,
        extractedSkills,
        roadmap
      });
    }

    res.json({
      prepId: prepRecord ? prepRecord._id : null,
      roadmap
    });
  } catch (error) {
    console.error('Generate roadmap error:', error);
    res.status(500).json({ error: 'Failed to generate roadmap: ' + error.message });
  }
});

// POST /interactive-chat — Mock Interviewer evaluation & follow-up
router.post('/interactive-chat', async (req, res) => {
  try {
    const { prepId, company, role, currentQuestion, userAnswer, chatHistory } = req.body;

    const evalResult = await evaluateMockInterviewAnswer({
      company,
      role,
      currentQuestion,
      userAnswer,
      chatHistory
    });

    if (prepId) {
      await InterviewPrep.findByIdAndUpdate(prepId, {
        $push: {
          history: [
            { sender: 'user', text: userAnswer },
            { sender: 'ai', text: evalResult.followUpQuestion, feedback: evalResult }
          ]
        }
      }).catch(e => console.error('Failed to update prep history:', e.message));
    }

    res.json(evalResult);
  } catch (error) {
    console.error('Interactive chat error:', error);
    res.status(500).json({ error: 'Failed to process mock interview response: ' + error.message });
  }
});

// POST /last-minute-prep — Create last-minute revision summary
router.post('/last-minute-prep', async (req, res) => {
  try {
    const { prepId, company, role, extractedSkills, roadmap } = req.body;

    const docData = await generateLastMinutePrepDoc({
      company,
      role,
      extractedSkills,
      roadmap
    });

    if (prepId) {
      await InterviewPrep.findByIdAndUpdate(prepId, {
        lastMinuteDoc: docData
      }).catch(e => console.error('Failed to save last minute doc:', e.message));
    }

    res.json(docData);
  } catch (error) {
    console.error('Last-minute prep error:', error);
    res.status(500).json({ error: 'Failed to generate last-minute prep doc: ' + error.message });
  }
});

// GET /download-pdf/:prepId — Download revision PDF file
router.get('/download-pdf/:prepId', async (req, res) => {
  try {
    const prepRecord = await InterviewPrep.findById(req.params.prepId);
    if (!prepRecord || !prepRecord.lastMinuteDoc) {
      return res.status(404).json({ error: 'Preparation document not found. Please generate last-minute prep first.' });
    }

    const pdfBuffer = await buildPreparationPdfBuffer(prepRecord.lastMinuteDoc);

    const filename = `${prepRecord.company}_${prepRecord.role}_Interview_Prep.pdf`.replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ error: 'Failed to generate PDF download: ' + error.message });
  }
});

// GET /history/:userId — Fetch user's interview preparation sessions
router.get('/history/:userId', async (req, res) => {
  try {
    const records = await InterviewPrep.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
