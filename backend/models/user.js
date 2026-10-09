import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id:                { type: String, required: true, unique: true },
  name:              { type: String, required: true },
  email:             { type: String, required: true, unique: true },
  password:          { type: String, required: false },
  type:              { type: String, required: true, default: 'user' },
  contest:           { type: mongoose.Schema.Types.ObjectId, ref: 'contest', default: null },
  solvedProblems:    [{ type: String }],
  attemptedProblems: [{ type: String }],
  streak:            { type: Number, default: 1 },
  rating:            { type: Number, default: 1200 },
  weakTopics:        [{ type: String }],
  topicProgress:     { type: Map, of: Number, default: {} },
  stats: {
    easySolved:   { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved:   { type: Number, default: 0 }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
