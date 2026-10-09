import mongoose from 'mongoose';

const problemSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  problemId: { type: String, required: true },
  sessionId: { type: String, required: true },
  sessionStartedAt: { type: Date, default: Date.now },
  hintLevel: { type: Number, default: 0 },
  hintHistory: [
    {
      hintLevel: { type: Number, required: true },
      hintTitle: { type: String, default: '' },
      hintText: { type: String, required: true },
      keyConcept: { type: String, default: '' },
      generatedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// Compound index to quickly find active user sessions
problemSessionSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export default mongoose.model('ProblemSession', problemSessionSchema);
