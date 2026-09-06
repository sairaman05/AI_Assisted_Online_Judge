import mongoose from 'mongoose';

const agentRecommendationSchema = new mongoose.Schema({
  recommendationId: { type: String, required: true, unique: true },
  contestId: { type: String, required: true },
  problemId: { type: String, default: null },
  type: { 
    type: String, 
    enum: ['problem_issue', 'difficulty_anomaly', 'hint_recommendation', 'general_alert'], 
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  reasoningSummary: { type: String, required: true },
  recommendation: { type: String, required: true },
  suggestedAction: { type: Object, default: {} },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'executed'], 
    default: 'pending' 
  },
  approvedBy: { type: String, default: null },
  resolutionNote: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('AgentRecommendation', agentRecommendationSchema);
