import mongoose from 'mongoose';

const agentAuditLogSchema = new mongoose.Schema({
  auditId: { type: String, required: true, unique: true },
  agentType: { type: String, required: true },
  action: { type: String, required: true },
  actorType: { type: String, enum: ['system', 'admin', 'user'], required: true },
  actorId: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  metadata: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('AgentAuditLog', agentAuditLogSchema);
