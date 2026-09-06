import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  score: { type: Number, required: true, default: 0 },
  codeBase: { type: String, required: false, default: '' },
  testcases: [
    {
      input: { type: String, default: '' },
      output: { type: String, required: false, default: '' }
    }
  ],
  constraintLimit: { type: Number, required: false, default: 0 },
}, { timestamps: true });

export default mongoose.model('Problem', problemSchema);
