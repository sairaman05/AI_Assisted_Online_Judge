import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  tags: [{ type: String }],
  acceptanceRate: { type: Number, default: 0 },
  solvedCount: { type: Number, default: 0 },
  totalSubmissions: { type: Number, default: 0 },
  score: { type: Number, required: true, default: 0 },
  codeBase: { type: String, required: false, default: '' },
  problemFingerprint: { type: String, unique: true, sparse: true },
  publicTestcases: [
    {
      input: { type: String, default: '' },
      output: { type: String, default: '' },
      explanation: { type: String, default: '' }
    }
  ],
  hiddenTestcases: [
    {
      input: { type: String, default: '' },
      output: { type: String, default: '' },
      category: { type: String, default: 'normal' }
    }
  ],
  testcases: [
    {
      input: { type: String, default: '' },
      output: { type: String, required: false, default: '' }
    }
  ],
  referenceSolution: { type: String, default: '' },
  constraintLimit: { type: Number, required: false, default: 0 },
  generatedByAI: { type: Boolean, default: false },
  difficultyJustification: { type: String, default: '' },
  expectedTimeComplexity: { type: String, default: '' },
  expectedSpaceComplexity: { type: String, default: '' },
  generationMetadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model('Problem', problemSchema);
