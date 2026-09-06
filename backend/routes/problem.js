import express from 'express';
import * as problemController from '../controllers/ProblemController.js';

const router = express.Router();

router.post('/',problemController.createProblem); 
router.get('/', problemController.getProblems); 
router.get('/:id', problemController.getProblemById); 
router.put('/:id',problemController.updateProblem); 
router.delete('/:id',  problemController.deleteProblem);

export default router;
