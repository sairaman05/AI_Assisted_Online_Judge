import mongoose from 'mongoose';

const agentSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  agentType: { type: String, enum: ['debugging', 'contest-master'], required: true },
  userId: { type: String, required: true },
  submissionId: { type: String, default: null },
  problemId: { type: String, default: null },
  contestId: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['pending', 'running', 'diagnosed', 'completed', 'failed', 'max_iterations_reached'], 
    default: 'running' 
  },
  iterations: { type: Number, default: 0 },
  state: { type: Object, default: {} },
  finalDiagnosis: { type: Object, default: null },
  error: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('AgentSession', agentSessionSchema);
