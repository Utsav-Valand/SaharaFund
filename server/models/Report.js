import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Report must be linked to a campaign'],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporterName: {
      type: String,
      trim: true,
      default: 'Anonymous Reporter',
    },
    reporterEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    reason: {
      type: String,
      required: [true, 'Please select a reason for reporting'],
      enum: [
        'fraudulent_activity',
        'misleading_information',
        'inappropriate_content',
        'impersonation',
        'unauthorized_fundraiser',
        'other',
      ],
    },
    description: {
      type: String,
      required: [true, 'Please provide details for the report'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    evidenceUrls: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: Date,
    resolutionNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

reportSchema.index({ campaign: 1, status: 1 })
reportSchema.index({ status: 1, createdAt: -1 })

const Report = mongoose.model('Report', reportSchema)

export default Report
