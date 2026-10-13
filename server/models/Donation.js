import mongoose from 'mongoose'

const donationSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Donation must be linked to a campaign'],
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Optional for guest donations
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the donation amount'],
      min: [10, 'Donation amount must be at least ₹10'],
      max: [5000000, 'Donation amount cannot exceed ₹50,00,000 in a single transaction'],
    },
    tipAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tip amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },

    // ─── Payment Status & Provider ───────────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: ['created', 'pending', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'created',
    },
    paymentProvider: {
      type: String,
      enum: ['mock', 'razorpay', 'stripe', 'upi_direct', 'bank_direct'],
      default: 'mock',
    },

    // ─── Razorpay / Gateway Fields ───────────────────────────────────────────
    // Unique Razorpay order ID (created server-side)
    gatewayOrderId: {
      type: String,
      sparse: true,
      index: true,
    },
    // Razorpay payment ID (returned after payment success)
    gatewayPaymentId: {
      type: String,
      sparse: true,
      unique: true,
    },
    // Razorpay signature (verified server-side, not exposed publicly)
    gatewaySignature: {
      type: String,
      select: false, // never returned by default
    },

    // ─── Direct Transfer Fields ───────────────────────────────────────────────
    // For UPI/bank direct transfers: donor-supplied transaction reference
    directTransferReference: {
      type: String,
      trim: true,
    },
    // Proof of payment upload URL (private storage)
    paymentProofUrl: {
      type: String,
      default: '',
    },
    // Admin/organizer verification status for direct transfers
    verificationStatus: {
      type: String,
      enum: ['not_applicable', 'pending_verification', 'under_review', 'verified', 'rejected', 'disputed'],
      default: 'not_applicable',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: { type: Date },
    verificationNotes: { type: String, default: '' },

    // ─── Receipt & Transaction ────────────────────────────────────────────────
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    receiptGeneratedAt: { type: Date },

    // ─── Donor Info ───────────────────────────────────────────────────────────
    donorName: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
      default: 'Generous Supporter',
    },
    donorEmail: {
      type: String,
      required: [true, 'Donor email is required'],
      lowercase: true,
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    comment: {
      type: String,
      maxlength: [500, 'Words of encouragement cannot exceed 500 characters'],
      default: '',
    },

    // ─── Legacy / Misc ────────────────────────────────────────────────────────
    paymentDetails: {
      method: { type: String, default: '' },
      bank: { type: String, default: '' },
      gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    },
  },
  {
    timestamps: true,
  }
)

// ─── Pre-save hooks ────────────────────────────────────────────────────────────

// Generate receipt number ONLY when donation is completed/verified
donationSchema.pre('save', function (next) {
  const isSuccessful =
    this.paymentStatus === 'completed' ||
    (this.paymentStatus === 'completed' && this.verificationStatus === 'verified')

  if (isSuccessful && !this.receiptNumber) {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    this.receiptNumber = `SF-${timestamp}-${random}`
    this.receiptGeneratedAt = new Date()
  }

  if (!this.transactionId) {
    const randomTxn = Math.random().toString(36).substring(2, 10).toUpperCase()
    this.transactionId = `TXN-${Date.now()}-${randomTxn}`
  }

  next()
})

// ─── Indexes ──────────────────────────────────────────────────────────────────
donationSchema.index({ campaign: 1, paymentStatus: 1, createdAt: -1 })
donationSchema.index({ donor: 1, createdAt: -1 })
donationSchema.index({ paymentStatus: 1, createdAt: -1 })
donationSchema.index({ verificationStatus: 1, createdAt: -1 })
donationSchema.index({ receiptNumber: 1 }, { sparse: true })

const Donation = mongoose.model('Donation', donationSchema)

export default Donation
