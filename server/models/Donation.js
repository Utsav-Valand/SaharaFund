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
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentProvider: {
      type: String,
      enum: ['mock', 'razorpay', 'stripe', 'upi', 'paytm'],
      default: 'mock',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
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
    paymentDetails: {
      method: { type: String, default: 'UPI' },
      bank: { type: String, default: '' },
      gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    },
  },
  {
    timestamps: true,
  }
)

// Auto-generate unique receipt number before save
donationSchema.pre('save', function (next) {
  if (!this.receiptNumber) {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    this.receiptNumber = `REC-${timestamp}-${random}`
  }
  if (!this.transactionId) {
    const randomTxn = Math.random().toString(36).substring(2, 10).toUpperCase()
    this.transactionId = `TXN-${Date.now()}-${randomTxn}`
  }
  next()
})

// Indexes for fast lookup of campaign donations and user receipts
donationSchema.index({ campaign: 1, paymentStatus: 1, createdAt: -1 })
donationSchema.index({ donor: 1, createdAt: -1 })
donationSchema.index({ transactionId: 1 })
donationSchema.index({ paymentStatus: 1, createdAt: -1 })

const Donation = mongoose.model('Donation', donationSchema)

export default Donation
