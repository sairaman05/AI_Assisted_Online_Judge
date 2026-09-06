import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: false },
  type:     { type: String, required: true, default: 'user' },
  contest:  { type: mongoose.Schema.Types.ObjectId, ref: 'contest', default: null }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
