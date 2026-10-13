import mongoose from 'mongoose'

/**
 * Immutable audit log for all sensitive actions.
 * Records are append-only — never modified after creation.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system actions
    },
    actorRole: {
      type: String,
      default: 'system',
    },
    action: {
      type: String,
      required: [true, 'Audit log action is required'],
      // e.g. 'payout.approved', 'verification.rejected', 'donation.refunded'
    },
    entityType: {
      type: String,
      required: true,
      enum: [
        'donation', 'campaign', 'user', 'payout_account',
        'verification_request', 'payout_request', 'payment_webhook',
      ],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    // Safe metadata — must not contain secrets, full account numbers, or passwords
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No updatedAt — audit logs are append-only
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
)

auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 })
auditLogSchema.index({ actor: 1, timestamp: -1 })
auditLogSchema.index({ action: 1, timestamp: -1 })

const AuditLog = mongoose.model('AuditLog', auditLogSchema)
export default AuditLog
