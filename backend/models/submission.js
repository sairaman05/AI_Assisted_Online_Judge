import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true },
  problem:      { type: String, required: true },
  user:         { type: String, required: true },
  contestId:    { type: mongoose.Schema.Types.ObjectId, ref: 'contest', default: null },
  username:     { type: String, required: true },
  score:        { type: Number, required: true, default: 0 },
  result:       { 
    type: String, 
    enum: ['Accepted', 'Wrong Answer', 'Pending', 'Judging', 'Runtime Error', 'Time Limit Exceeded', 'Compilation Error'], 
    default: 'Pending' 
  },
  time:         { type: Number },
  memory:       { type: Number },
  code:         { type: String, default: '' },
  language:     { type: String, default: 'py' },
  errorDetails: { type: String, default: '' },
}, { timestamps: { createdAt: 'submittedAt', updatedAt: false } });

export default mongoose.model('Submission', submissionSchema);
