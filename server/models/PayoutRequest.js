import mongoose from 'mongoose'

const payoutRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payout request must belong to a user'],
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Payout request must be linked to a campaign'],
    },
    payoutAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayoutAccount',
      required: [true, 'Payout request must specify a destination account'],
    },
    requestedAmount: {
      type: Number,
      required: [true, 'Payout amount is required'],
      min: [100, 'Minimum payout amount is ₹100'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: [
        'requested',
        'under_review',
        'approved',
        'processing',
        'completed',
        'rejected',
        'failed',
        'reversed',
      ],
      default: 'requested',
    },
    // Reference from payment provider or manual transfer
    providerReference: {
      type: String,
      default: '',
    },
    manualTransferReference: {
      type: String,
      default: '',
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: { type: Date },
    processedAt: { type: Date },
    completedAt: { type: Date },
    // Snapshot of the available balance at time of request (for audit)
    balanceAtRequest: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

payoutRequestSchema.index({ user: 1, status: 1, createdAt: -1 })
payoutRequestSchema.index({ campaign: 1, status: 1 })
payoutRequestSchema.index({ status: 1, createdAt: -1 })

const PayoutRequest = mongoose.model('PayoutRequest', payoutRequestSchema)
export default PayoutRequest
