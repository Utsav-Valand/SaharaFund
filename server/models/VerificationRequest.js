import mongoose from 'mongoose'

const verificationRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Verification request must belong to a user'],
    },
    verificationType: {
      type: String,
      enum: ['identity', 'bank_account', 'campaign_beneficiary'],
      required: [true, 'Verification type is required'],
    },
    campaign: {
      // For campaign_beneficiary type
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    payoutAccount: {
      // For bank_account type
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayoutAccount',
      default: null,
    },
    // Safe submitted data (NO sensitive identity numbers as plaintext)
    submittedData: {
      // Identity fields
      legalName: { type: String, trim: true },
      dateOfBirth: { type: Date },
      addressLine1: { type: String, trim: true },
      addressLine2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      idDocumentType: {
        type: String,
        enum: ['aadhaar_masked', 'pan', 'passport', 'voter_id', 'driving_license', ''],
        default: '',
      },
      // Only last 4 digits or masked reference — never full Aadhaar number
      idDocumentReference: { type: String, trim: true, maxlength: 50 },
      // Campaign/beneficiary fields
      beneficiaryRelation: { type: String, trim: true },
      purposeDetails: { type: String, trim: true, maxlength: 2000 },
    },
    // References to uploaded documents (private storage URLs)
    documentUrls: [
      {
        docType: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['not_submitted', 'submitted', 'under_review', 'verified', 'rejected', 'action_required'],
      default: 'submitted',
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNotes: {
      type: String,
      maxlength: [2000, 'Review notes cannot exceed 2000 characters'],
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
)

verificationRequestSchema.index({ user: 1, verificationType: 1 })
verificationRequestSchema.index({ status: 1, createdAt: -1 })

const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema)
export default VerificationRequest
