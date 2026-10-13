import mongoose from 'mongoose'

/**
 * Persists raw webhook events from Razorpay (or other providers) for idempotency.
 * We store eventId as a unique sparse index so duplicate webhooks are ignored.
 */
const paymentWebhookEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['razorpay', 'stripe', 'paytm', 'upi'],
      required: true,
    },
    eventId: {
      type: String,
      // Unique per provider to prevent duplicate processing
      unique: true,
      sparse: true,
    },
    eventType: {
      type: String,
      required: true,
      // e.g. "payment.captured", "payment.failed", "refund.processed"
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
    processingStatus: {
      type: String,
      enum: ['received', 'processed', 'failed', 'skipped'],
      default: 'received',
    },
    processingError: {
      type: String,
      default: '',
    },
    relatedDonation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null,
    },
    processedAt: { type: Date },
  },
  {
    timestamps: true,
  }
)

paymentWebhookEventSchema.index({ provider: 1, eventType: 1, createdAt: -1 })
paymentWebhookEventSchema.index({ processingStatus: 1 })

const PaymentWebhookEvent = mongoose.model('PaymentWebhookEvent', paymentWebhookEventSchema)
export default PaymentWebhookEvent
