import express from 'express';
import * as contestController from '../controllers/ContestController.js';
import { generateContestPerformanceReport, analyzeUserWeaknesses, getPersonalizedRecommendations } from '../services/contestAnalysisService.js';

const router = express.Router();

router.post('/', contestController.createContest);
router.get('/', contestController.getContests);
router.get('/user-weaknesses/:userId', async (req, res) => {
  try {
    const data = await analyzeUserWeaknesses(req.params.userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const data = await getPersonalizedRecommendations(req.params.userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analysis', async (req, res) => {
  try {
    const { userId } = req.body;
    const report = await generateContestPerformanceReport(req.params.id, userId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-ai-contest', contestController.generateAIContestController);
router.post('/regenerate-problem', contestController.regenerateContestProblemController);
router.get('/:id/analytics', contestController.analyzeControlCenterController);
router.post('/:id/analyze-control-center', contestController.analyzeControlCenterController);
router.post('/publish-guidance', contestController.publishContestGuidanceController);
router.get('/:id/participant-guidance', contestController.getParticipantGuidanceController);

router.get('/:id', contestController.getContestById);
router.put('/:id', contestController.updateContest);
router.delete('/:id', contestController.deleteContest);
router.post('/register', contestController.registerUserForContest);
router.post('/unregister', contestController.unregisterUserFromContest);
router.post('/addProblem', contestController.addProblemToContest);
router.post('/removeProblem', contestController.removeProblemFromContest);
router.post('/validate-password', contestController.validateContestPassword);

export default router;
