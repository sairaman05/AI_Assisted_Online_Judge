import mongoose from 'mongoose';

const contestAnalyticsSchema = new mongoose.Schema({
  contestId: { type: String, required: true, index: true },
  dataSnapshotHash: { type: String, required: true },
  analysisVersion: { type: Number, default: 1 },
  contestHealth: { type: String, enum: ['healthy', 'attention_required', 'critical_anomaly'], default: 'healthy' },
  problemStatistics: [
    {
      problemId: String,
      problemTitle: String,
      difficulty: String,
      totalParticipants: Number,
      attemptedCount: Number,
      solvedCount: Number,
      failedCount: Number,
      successRate: Number,
      averageAttempts: Number,
      averageSolveTime: Number,
      wrongAnswerCount: Number,
      runtimeErrorCount: Number,
      tleCount: Number,
      compilationErrorCount: Number,
      primaryFailurePattern: String,
      isStruggling: Boolean
    }
  ],
  commonMistakes: [
    {
      problemId: String,
      failurePattern: String,
      conceptualGap: String,
      failureCategory: String,
      evidenceSummary: String
    }
  ],
  aiGuidance: [
    {
      guidanceId: String,
      problemId: String,
      problemTitle: String,
      targetScope: { type: String, enum: ['global', 'targeted'], default: 'targeted' },
      guidanceText: String,
      guidanceLevel: { type: Number, default: 1 }, // 1: Conceptual, 2: Pattern, 3: Insight, 4: Reasoning, 5: Pseudocode
      publishedToParticipants: { type: Boolean, default: false },
      publishedAt: Date,
      minAttemptsThreshold: { type: Number, default: 3 }
    }
  ],
  participantStatistics: {
    totalParticipants: { type: Number, default: 0 },
    activeParticipants: { type: Number, default: 0 },
    averageSolved: { type: Number, default: 0 },
    stuckParticipantsCount: { type: Number, default: 0 }
  },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('ContestAnalytics', contestAnalyticsSchema);
