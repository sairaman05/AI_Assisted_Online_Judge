import express from 'express';
import * as submissionController from '../controllers/SubmissionController.js';

const router = express.Router();

router.post('/', submissionController.createSubmission);
router.get('/',submissionController.getSubmissions); 
router.get('/:id', submissionController.getSubmissionById); 
router.put('/:id', submissionController.updateSubmission);
router.delete('/:id', submissionController.deleteSubmission); 

export default router;
