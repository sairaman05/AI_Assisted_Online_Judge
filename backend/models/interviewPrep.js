import mongoose from 'mongoose';

const interviewPrepSchema = new mongoose.Schema({
  userId:          { type: String, required: true },
  company:         { type: String, required: true },
  role:            { type: String, required: true },
  experience:      { type: String, default: 'Mid-Level' },
  rounds:          [{ type: String }],
  jdText:          { type: String, default: '' },
  extractedSkills: { type: mongoose.Schema.Types.Mixed, default: {} },
  roadmap:         { type: mongoose.Schema.Types.Mixed, default: {} },
  history:         [
    {
      sender: { type: String, enum: ['ai', 'user'] },
      text: { type: String },
      feedback: { type: mongoose.Schema.Types.Mixed, default: null },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  lastMinuteDoc:   { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

export default mongoose.model('InterviewPrep', interviewPrepSchema);
