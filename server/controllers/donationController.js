import Donation from '../models/Donation.js'
import Campaign from '../models/Campaign.js'
import Notification from '../models/Notification.js'

/**
 * @desc    Create a new donation (legacy mock mode OR initial record for gateway)
 * @route   POST /api/donations
 * @access  Public (Optional Auth for logged-in donors)
 *
 * In production with Razorpay, use POST /api/payments/create-order instead.
 * This endpoint is kept for backward compatibility and mock/test donations.
 */
export const createDonation = async (req, res) => {
  try {
    const {
      campaignId,
      amount,
      tipAmount = 0,
      donorName,
      donorEmail,
      isAnonymous = false,
      comment = '',
      paymentProvider = 'mock',
    } = req.body

    if (!campaignId || !amount || !donorName || !donorEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide campaign ID, donation amount, donor name, and donor email.',
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
        message: 'Maximum donation is ₹50,00,000 per transaction.',
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

    // Mock mode: only auto-complete if PAYMENT_MODE=test and provider is mock
    const isMockMode =
      paymentProvider === 'mock' &&
      (process.env.PAYMENT_MODE === 'test' || process.env.NODE_ENV === 'development')

    const donation = await Donation.create({
      campaign: campaign._id,
      donor: req.user?._id || null,
      amount: numAmount,
      tipAmount: Number(tipAmount) || 0,
      currency: campaign.currency || 'INR',
      donorName: donorName.trim(),
      donorEmail: donorEmail.toLowerCase().trim(),
      isAnonymous: Boolean(isAnonymous),
      comment: comment.trim(),
      paymentProvider,
      paymentStatus: isMockMode ? 'completed' : 'created',
    })

    // Only update campaign if mock-completed immediately
    if (isMockMode) {
      await Campaign.findByIdAndUpdate(campaign._id, {
        $inc: { raisedAmount: numAmount, donorCount: 1 },
      })

      await Notification.create({
        recipient: campaign.organizer,
        type: 'donation_received',
        title: 'New Donation Received! 🎉',
        message: `${isAnonymous ? 'An anonymous supporter' : donorName} donated ₹${numAmount.toLocaleString('en-IN')} to "${campaign.title}".`,
        relatedCampaign: campaign._id,
        relatedDonation: donation._id,
        actionUrl: `/dashboard`,
      })
    }

    return res.status(201).json({
      success: true,
      message: isMockMode ? 'Donation processed (mock mode).' : 'Donation record created.',
      donation,
    })
  } catch (error) {
    console.error('Donation Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Verify payment callback (legacy mock verification)
 * @route   POST /api/donations/verify
 * @access  Public
 *
 * For real Razorpay payments, use POST /api/payments/verify instead.
 * This endpoint is kept for legacy/test usage only.
 */
export const verifyPayment = async (req, res) => {
  try {
    const { donationId, transactionId } = req.body

    const donation = await Donation.findById(donationId)
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found.' })
    }

    if (donation.paymentStatus === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified.',
        donation,
      })
    }

    // SECURITY: Only allow verification of mock donations via this endpoint
    if (donation.paymentProvider !== 'mock') {
      return res.status(400).json({
        success: false,
        message: 'Use /api/payments/verify for gateway payments.',
      })
    }

    donation.paymentStatus = 'completed'
    if (transactionId) donation.transactionId = transactionId
    await donation.save()

    const campaign = await Campaign.findByIdAndUpdate(
      donation.campaign,
      { $inc: { raisedAmount: donation.amount, donorCount: 1 } },
      { new: true }
    )

    if (campaign) {
      await Notification.create({
        recipient: campaign.organizer,
        type: 'donation_received',
        title: 'Payment Verified! 🎉',
        message: `${donation.isAnonymous ? 'An anonymous supporter' : donation.donorName} donated ₹${donation.amount.toLocaleString('en-IN')} to "${campaign.title}".`,
        relatedCampaign: campaign._id,
        relatedDonation: donation._id,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and donation completed.',
      donation,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get single donation receipt
 * @route   GET /api/donations/:id
 * @access  Public
 */
export const getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('campaign', 'title slug coverImage organizer')
      .populate('donor', 'name')
      .select('-gatewaySignature -donorEmail') // Never expose sensitive fields

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' })
    }

    return res.status(200).json({ success: true, donation })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get all completed donations for a campaign
 * @route   GET /api/campaigns/:id/donations
 * @access  Public
 */
export const getCampaignDonations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 20

    const query = {
      campaign: req.params.id,
      paymentStatus: 'completed',
    }

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .select('donorName amount isAnonymous comment createdAt paymentProvider')
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Donation.countDocuments(query),
    ])

    return res.status(200).json({
      success: true,
      count: donations.length,
      total,
      donations,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get donations made by the current user (with receipt info)
 * @route   GET /api/donations/me
 * @access  Private
 */
export const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({
      $or: [{ donor: req.user._id }, { donorEmail: req.user.email }],
    })
      .populate('campaign', 'title slug coverImage category status')
      .select('-gatewaySignature') // Never expose signature
      .sort('-createdAt')

    return res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
