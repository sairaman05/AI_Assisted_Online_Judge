// contestSchema.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const contestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  problems: [{ type: String }],
  participants: [{ type: String }],
  password: { type: String },
  duration: { type: Number },
  aiGenerated: { type: Boolean, default: false },
  aiHintsAllowed: { type: Boolean, default: true },
  generationMetadata: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['draft', 'published', 'active', 'ended'], default: 'published' }
}, { timestamps: true });

contestSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    try {
      const hash = await bcrypt.hash(this.password, 10);
      this.password = hash;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

contestSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Contest', contestSchema);
