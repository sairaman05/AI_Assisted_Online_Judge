import mongoose from 'mongoose';

const aiInteractionSchema = new mongoose.Schema({
  userId:          { type: String, required: true },
  problemId:       { type: String, default: null },
  submissionId:    { type: String, default: null },
  interactionType: { 
    type: String, 
    enum: ['progressive-hint', 'debug', 'code-analysis', 'alternative-approaches', 'explanation', 'visual-diagram', 'testcase-walkthrough', 'contest-analysis', 'interview-chat'],
    required: true 
  },
  requestContext:  { type: mongoose.Schema.Types.Mixed, default: {} },
  response:        { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('AIInteraction', aiInteractionSchema);
