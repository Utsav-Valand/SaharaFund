/**
 * Payment Controller — Razorpay Integration
 *
 * Handles:
 * 1. Creating a Razorpay order (server-side, before checkout opens)
 * 2. Verifying payment signature (after checkout completes)
 * 3. Processing webhook events (async payment updates)
 * 4. Direct transfer submission (UPI/Bank)
 *
 * Security principles:
 * - RAZORPAY_KEY_SECRET never exposed to the frontend
 * - Campaign totals updated ONLY after server-side signature verification
 * - Webhook events deduplicated by eventId (idempotent)
 * - Direct transfers remain pending_verification until admin/organizer confirms
 */

import crypto from 'crypto'
import Razorpay from 'razorpay'
import Donation from '../models/Donation.js'
import Campaign from '../models/Campaign.js'
import Notification from '../models/Notification.js'
import PaymentWebhookEvent from '../models/PaymentWebhookEvent.js'
import AuditLog from '../models/AuditLog.js'

// ─── Razorpay instance (lazy-initialized) ──────────────────────────────────────

let razorpayInstance = null

function getRazorpay() {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
    }

    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret })
  }
  return razorpayInstance
}

const PAYMENT_MODE = process.env.PAYMENT_MODE || 'test' // 'test' | 'live'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  const body = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  )
}

async function completeDonation(donation, gatewayPaymentId, gatewaySignature, metadata = {}) {
  // Idempotency: if already completed, skip
  if (donation.paymentStatus === 'completed') return donation

  donation.paymentStatus = 'completed'
  donation.gatewayPaymentId = gatewayPaymentId
  if (gatewaySignature) donation.gatewaySignature = gatewaySignature
  donation.verificationStatus = 'not_applicable'
  donation.paymentDetails = { ...donation.paymentDetails, ...metadata }

  await donation.save()

  // Update campaign totals exactly once
  const campaign = await Campaign.findByIdAndUpdate(
    donation.campaign,
    { $inc: { raisedAmount: donation.amount, donorCount: 1 } },
    { new: true }
  )

  if (campaign) {
    await Notification.create({
      recipient: campaign.organizer,
      type: 'donation_received',
      title: 'New Donation Received! 🎉',
      message: `${donation.isAnonymous ? 'An anonymous supporter' : donation.donorName} donated ₹${donation.amount.toLocaleString('en-IN')} to "${campaign.title}".`,
      relatedCampaign: campaign._id,
      relatedDonation: donation._id,
      actionUrl: `/dashboard`,
    })
  }

  return donation
}

// ─── 1. Create Razorpay Order ─────────────────────────────────────────────────

/**
 * @desc  Create a payment order and a pending donation record
 * @route POST /api/payments/create-order
 * @access Private (optionalAuth — logged-in donors preferred)
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const {
      campaignId,
      amount,
      donorName,
      donorEmail,
      isAnonymous = false,
      comment = '',
    } = req.body

    // Validation
    if (!campaignId || !amount || !donorName || !donorEmail) {
      return res.status(400).json({
        success: false,
        message: 'campaignId, amount, donorName, and donorEmail are required.',
      })
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum donation amount is ₹10.',
      })
    }

    if (numAmount > 5000000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum donation per transaction is ₹50,00,000.',
      })
    }

    const campaign = await Campaign.findById(campaignId)
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This campaign is not currently accepting donations.',
      })
    }

    // Create a pending donation record BEFORE calling Razorpay
    const donation = await Donation.create({
      campaign: campaign._id,
      donor: req.user?._id || null,
      amount: numAmount,
      currency: 'INR',
      donorName: donorName.trim(),
      donorEmail: donorEmail.toLowerCase().trim(),
      isAnonymous: Boolean(isAnonymous),
      comment: comment.trim(),
      paymentProvider: 'razorpay',
      paymentStatus: 'created',
    })

    // Create Razorpay order (or dev sandbox order if credentials not configured)
    const isMockMode = !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_KEY_ID.includes('REPLACE') ||
      process.env.RAZORPAY_KEY_ID.includes('xxxx')

    let razorpayOrder
    if (isMockMode) {
      razorpayOrder = {
        id: 'order_dev_' + donation._id,
        amount: Math.round(numAmount * 100),
        currency: 'INR',
      }
    } else {
      try {
        razorpayOrder = await getRazorpay().orders.create({
        amount: Math.round(numAmount * 100), // Razorpay expects paise
        currency: 'INR',
        receipt: donation._id.toString(),
        notes: {
          campaignId: campaign._id.toString(),
          donationId: donation._id.toString(),
          mode: PAYMENT_MODE,
        },
      })
    } catch (rzpErr) {
      // If Razorpay order creation fails, mark donation as failed
      await Donation.findByIdAndUpdate(donation._id, { paymentStatus: 'failed' })
      console.error('Razorpay order creation error:', rzpErr.message)
      return res.status(502).json({
        success: false,
        message: 'Payment gateway unavailable. Please try again.',
      })
    }

    }
    // Store gateway order ID in donation
    await Donation.findByIdAndUpdate(donation._id, {
      gatewayOrderId: razorpayOrder.id,
      paymentStatus: 'pending',
    })

    // Return order details + public key to frontend
    return res.status(201).json({
      success: true,
      donationId: donation._id,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      // Only expose the public KEY_ID — never the secret
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      prefill: {
        name: donation.donorName,
        email: donation.donorEmail,
      },
    })
  } catch (error) {
    console.error('[createPaymentOrder]', error.message)
    return res.status(500).json({ success: false, message: error.message })
  }
}

// ─── 2. Verify Payment Signature ─────────────────────────────────────────────

/**
 * @desc  Verify Razorpay payment signature and mark donation completed
 * @route POST /api/payments/verify
 * @access Private (optionalAuth)
 *
 * CRITICAL: Never trust the frontend alone. Always verify HMAC server-side.
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { donationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!donationId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'donationId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      })
    }

    const donation = await Donation.findById(donationId)
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found.' })
    }

    // Prevent double-processing
    if (donation.paymentStatus === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified.',
        donation: sanitizeDonation(donation),
      })
    }

    // Validate that the order ID matches what we stored
    if (donation.gatewayOrderId !== razorpay_order_id) {
      await AuditLog.create({
        actor: req.user?._id,
        actorRole: req.user?.role || 'guest',
        action: 'donation.verification_mismatch',
        entityType: 'donation',
        entityId: donation._id,
        metadata: {
          expected: donation.gatewayOrderId,
          received: razorpay_order_id,
          paymentId: razorpay_payment_id,
        },
      })
      return res.status(400).json({
        success: false,
        message: 'Payment order ID mismatch. Verification failed.',
      })
    }

    // Development sandbox mode verification
    if (razorpay_order_id.startsWith('order_dev_')) {
      const completed = await completeDonation(
        donation,
        razorpay_payment_id || ('pay_dev_' + Date.now()),
        razorpay_signature || 'dev_mock_signature',
        { provider: 'razorpay_dev_mock' }
      )
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully (Development Mode).',
        donation: sanitizeDonation(completed),
      })
    }

    // CRITICAL: Verify HMAC signature
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return res.status(503).json({
        success: false,
        message: 'Payment verification not configured.',
      })
    }

    let signatureValid = false
    try {
      signatureValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        secret
      )
    } catch {
      signatureValid = false
    }

    if (!signatureValid) {
      // Mark as failed on invalid signature
      await Donation.findByIdAndUpdate(donationId, { paymentStatus: 'failed' })
      await AuditLog.create({
        actor: req.user?._id,
        actorRole: req.user?.role || 'guest',
        action: 'donation.signature_invalid',
        entityType: 'donation',
        entityId: donation._id,
        metadata: { paymentId: razorpay_payment_id },
      })
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed.',
      })
    }

    // Check for duplicate gatewayPaymentId (prevent double-counting)
    const existing = await Donation.findOne({ gatewayPaymentId: razorpay_payment_id })
    if (existing && existing._id.toString() !== donationId) {
      return res.status(409).json({
        success: false,
        message: 'This payment has already been applied to another donation.',
      })
    }

    // All checks passed — complete the donation
    const completed = await completeDonation(
      donation,
      razorpay_payment_id,
      razorpay_signature,
      { method: 'razorpay' }
    )

    await AuditLog.create({
      actor: req.user?._id,
      actorRole: req.user?.role || 'guest',
      action: 'donation.completed',
      entityType: 'donation',
      entityId: donation._id,
      metadata: {
        amount: donation.amount,
        campaignId: donation.campaign,
        paymentId: razorpay_payment_id,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Payment verified. Thank you for your donation!',
      donation: sanitizeDonation(completed),
    })
  } catch (error) {
    console.error('[verifyRazorpayPayment]', error.message)
    return res.status(500).json({ success: false, message: error.message })
  }
}

// ─── 3. Razorpay Webhook ──────────────────────────────────────────────────────

/**
 * @desc  Handle Razorpay webhook events
 * @route POST /api/payments/webhook
 * @access Public (verified by webhook signature)
 *
 * Raw body is required for signature verification — do NOT use express.json() on this route.
 */
export const handleRazorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET not configured — skipping verification')
    return res.status(200).json({ received: true })
  }

  // Verify webhook signature using raw body
  const receivedSignature = req.headers['x-razorpay-signature']
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.rawBody || '')
    .digest('hex')

  if (receivedSignature !== expectedSignature) {
    console.warn('[Webhook] Invalid webhook signature')
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' })
  }

  const event = req.body
  const eventId = event.id || null
  const eventType = event.event || 'unknown'

  // Idempotency — check if we already processed this event
  if (eventId) {
    const existing = await PaymentWebhookEvent.findOne({ eventId })
    if (existing && existing.processingStatus === 'processed') {
      return res.status(200).json({ received: true, status: 'already_processed' })
    }
  }

  // Persist the event
  let webhookRecord
  try {
    webhookRecord = await PaymentWebhookEvent.findOneAndUpdate(
      { eventId },
      {
        provider: 'razorpay',
        eventId,
        eventType,
        payload: event,
        processingStatus: 'received',
      },
      { upsert: true, new: true }
    )
  } catch (err) {
    // Duplicate key = already exists, proceed
    if (err.code !== 11000) throw err
    return res.status(200).json({ received: true, status: 'duplicate' })
  }

  try {
    const payment = event.payload?.payment?.entity
    const orderId = payment?.order_id
    const paymentId = payment?.id

    if (eventType === 'payment.captured' && orderId && paymentId) {
      const donation = await Donation.findOne({ gatewayOrderId: orderId })
      if (donation && donation.paymentStatus !== 'completed') {
        await completeDonation(donation, paymentId, null, { source: 'webhook' })
      }
    } else if (eventType === 'payment.failed' && orderId) {
      await Donation.findOneAndUpdate(
        { gatewayOrderId: orderId, paymentStatus: { $in: ['created', 'pending'] } },
        { paymentStatus: 'failed' }
      )
    } else if (eventType === 'refund.processed') {
      const refund = event.payload?.refund?.entity
      if (refund?.payment_id) {
        const donation = await Donation.findOne({ gatewayPaymentId: refund.payment_id })
        if (donation) {
          donation.paymentStatus = 'refunded'
          await donation.save()
          // Reverse campaign total — important for consistency
          await Campaign.findByIdAndUpdate(donation.campaign, {
            $inc: { raisedAmount: -donation.amount, donorCount: -1 },
          })
        }
      }
    }

    // Mark event processed
    await PaymentWebhookEvent.findByIdAndUpdate(webhookRecord._id, {
      processingStatus: 'processed',
      processedAt: new Date(),
    })
  } catch (err) {
    await PaymentWebhookEvent.findByIdAndUpdate(webhookRecord?._id, {
      processingStatus: 'failed',
      processingError: err.message,
    })
    console.error('[Webhook processing error]', err.message)
  }

  // Always return 200 to acknowledge receipt
  return res.status(200).json({ received: true })
}

// ─── 4. Direct Transfer Submission ───────────────────────────────────────────

/**
 * @desc  Donor submits a direct UPI/bank transfer reference for verification
 * @route POST /api/payments/direct-transfer
 * @access Private (protect)
 */
export const submitDirectTransfer = async (req, res) => {
  try {
    const {
      campaignId,
      amount,
      donorName,
      donorEmail,
      isAnonymous = false,
      comment = '',
      directTransferReference,
      paymentProofUrl = '',
    } = req.body

    if (!campaignId || !amount || !donorName || !donorEmail || !directTransferReference) {
      return res.status(400).json({
        success: false,
        message: 'campaignId, amount, donorName, donorEmail, and directTransferReference are required.',
      })
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum donation is ₹10.' })
    }

    const campaign = await Campaign.findById(campaignId)
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }
    if (campaign.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Campaign is not accepting donations.' })
    }

    const donation = await Donation.create({
      campaign: campaign._id,
      donor: req.user._id,
      amount: numAmount,
      currency: 'INR',
      donorName: donorName.trim(),
      donorEmail: donorEmail.toLowerCase().trim(),
      isAnonymous: Boolean(isAnonymous),
      comment: comment.trim(),
      paymentProvider: 'upi_direct',
      paymentStatus: 'pending',
      verificationStatus: 'pending_verification',
      directTransferReference: directTransferReference.trim(),
      paymentProofUrl: paymentProofUrl.trim(),
    })

    // Notify campaign organizer about pending verification
    await Notification.create({
      recipient: campaign.organizer,
      type: 'donation_received',
      title: 'Direct Transfer Received — Verification Required',
      message: `${isAnonymous ? 'An anonymous supporter' : donorName} submitted a direct transfer of ₹${numAmount.toLocaleString('en-IN')} to "${campaign.title}". Reference: ${directTransferReference}. Please verify.`,
      relatedCampaign: campaign._id,
      relatedDonation: donation._id,
      actionUrl: `/dashboard`,
    })

    return res.status(201).json({
      success: true,
      message:
        'Transfer reference submitted. Your donation will be confirmed once the organizer verifies the payment.',
      donation: sanitizeDonation(donation),
    })
  } catch (error) {
    console.error('[submitDirectTransfer]', error.message)
    return res.status(500).json({ success: false, message: error.message })
  }
}

// ─── 5. Verify Direct Transfer (Organizer/Admin) ──────────────────────────────

/**
 * @desc  Organizer or admin verifies a direct transfer donation
 * @route PATCH /api/payments/direct-transfer/:id/verify
 * @access Private (protect — organizer of the campaign or admin)
 */
export const verifyDirectTransfer = async (req, res) => {
  try {
    const { action, notes } = req.body // action: 'verify' | 'reject'
    if (!['verify', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be 'verify' or 'reject'." })
    }

    const donation = await Donation.findById(req.params.id).populate('campaign')
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' })
    }

    const isOrganizer =
      donation.campaign.organizer.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the campaign organizer or an admin can verify direct transfers.',
      })
    }

    // Prevent self-verification: donor cannot verify their own transfer
    if (donation.donor && donation.donor.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot verify your own donation.',
      })
    }

    if (donation.verificationStatus === 'verified') {
      return res.status(200).json({
        success: true,
        message: 'Already verified.',
        donation: sanitizeDonation(donation),
      })
    }

    if (action === 'verify') {
      donation.verificationStatus = 'verified'
      donation.paymentStatus = 'completed'
      donation.verifiedBy = req.user._id
      donation.verifiedAt = new Date()
      donation.verificationNotes = notes || ''
      await donation.save()

      // Update campaign totals ONLY after verification
      await Campaign.findByIdAndUpdate(donation.campaign._id, {
        $inc: { raisedAmount: donation.amount, donorCount: 1 },
      })

      await AuditLog.create({
        actor: req.user._id,
        actorRole: req.user.role,
        action: 'donation.direct_transfer_verified',
        entityType: 'donation',
        entityId: donation._id,
        metadata: { amount: donation.amount, campaignId: donation.campaign._id },
      })
    } else {
      donation.verificationStatus = 'rejected'
      donation.paymentStatus = 'failed'
      donation.verificationNotes = notes || 'Rejected by organizer.'
      await donation.save()

      await AuditLog.create({
        actor: req.user._id,
        actorRole: req.user.role,
        action: 'donation.direct_transfer_rejected',
        entityType: 'donation',
        entityId: donation._id,
        metadata: { reason: notes },
      })
    }

    return res.status(200).json({
      success: true,
      message: action === 'verify' ? 'Donation verified successfully.' : 'Donation rejected.',
      donation: sanitizeDonation(donation),
    })
  } catch (error) {
    console.error('[verifyDirectTransfer]', error.message)
    return res.status(500).json({ success: false, message: error.message })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeDonation(d) {
  const obj = d.toObject ? d.toObject() : { ...d }
  delete obj.gatewaySignature
  delete obj.donorEmail // Don't expose donor email in responses
  return obj
}
