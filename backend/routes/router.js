import express from 'express';
import problemRoutes from './problem.js';
import submissionRoutes from './submission.js';
import userRoutes from './user.js';
import authRoutes from './auth.js';
import contestRoutes from './contest.js';
import aiAssistanceRoutes from './ai.js';
import compilerRoutes from './compiler.js';
import agentRoutes from './agents.js';
import interviewRoutes from './interview.js';

const router = express.Router();

router.use('/problems', problemRoutes);
router.use('/submissions', submissionRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/contests', contestRoutes);
router.use('/ai', aiAssistanceRoutes);
router.use('/compiler', compilerRoutes);
router.use('/agents', agentRoutes);
router.use('/interview', interviewRoutes);

export default router;
