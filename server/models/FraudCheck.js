import mongoose from 'mongoose'

const fraudCheckSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null,
    },
    riskScore: {
      type: Number,
      required: true,
      min: [0, 'Risk score cannot be less than 0'],
      max: [100, 'Risk score cannot exceed 100'],
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    textRisk: {
      type: Number,
      default: 0,
    },
    identityRisk: {
      type: Number,
      default: 0,
    },
    imageRisk: {
      type: Number,
      default: 0,
    },
    checks: {
      suspiciousKeywords: { type: Boolean, default: false },
      unverifiedIdentity: { type: Boolean, default: false },
      duplicateImages: { type: Boolean, default: false },
      unrealisticGoal: { type: Boolean, default: false },
      rapidTransactions: { type: Boolean, default: false },
      details: { type: mongoose.Schema.Types.Mixed },
    },
    reasons: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

// Automatically set riskLevel based on numeric riskScore
fraudCheckSchema.pre('save', function (next) {
  if (this.riskScore !== undefined) {
    if (this.riskScore >= 75) {
      this.riskLevel = 'critical'
    } else if (this.riskScore >= 50) {
      this.riskLevel = 'high'
    } else if (this.riskScore >= 25) {
      this.riskLevel = 'medium'
    } else {
      this.riskLevel = 'low'
    }
  }
  next()
})

fraudCheckSchema.index({ status: 1, riskLevel: 1, createdAt: -1 })
fraudCheckSchema.index({ campaign: 1 })
fraudCheckSchema.index({ user: 1 })

const FraudCheck = mongoose.model('FraudCheck', fraudCheckSchema)

export default FraudCheck
