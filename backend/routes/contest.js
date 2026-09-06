import express from 'express';
import * as contestController from '../controllers/ContestController.js';

const router = express.Router();

router.post('/', contestController.createContest);
router.get('/', contestController.getContests);
router.get('/:id', contestController.getContestById);
router.put('/:id', contestController.updateContest);
router.delete('/:id', contestController.deleteContest);
router.post('/register', contestController.registerUserForContest);
router.post('/unregister', contestController.unregisterUserFromContest);
router.post('/addProblem', contestController.addProblemToContest);
router.post('/removeProblem', contestController.removeProblemFromContest);
router.post('/validate-password', contestController.validateContestPassword);

export default router;
