import PayoutRequest from '../models/PayoutRequest.js'
import PayoutAccount from '../models/PayoutAccount.js'
import Campaign from '../models/Campaign.js'
import Donation from '../models/Donation.js'
import Notification from '../models/Notification.js'
import AuditLog from '../models/AuditLog.js'

const MIN_PAYOUT = 100
const MAX_PAYOUT = 10000000

/**
 * Calculate the eligible payout balance for a campaign.
 *
 * Eligible = sum of completed gateway donations
 * (Direct transfers that are "verified" are also included)
 *
 * Already withdrawn = sum of completed/approved payout amounts
 *
 * IMPORTANT: Only online (completed) and verified direct transfers count.
 * Pending donations must NOT be included in available balance.
 */
async function getCampaignBalance(campaignId) {
  // Total verified/completed donations
  const donationsAgg = await Donation.aggregate([
    {
      $match: {
        campaign: campaignId,
        $or: [
          { paymentStatus: 'completed', paymentProvider: { $in: ['razorpay', 'stripe', 'mock'] } },
          { paymentStatus: 'completed', verificationStatus: 'verified' }, // verified direct transfers
        ],
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])

  const totalReceived = donationsAgg[0]?.total || 0

  // Already withdrawn (completed or approved payouts)
  const payoutsAgg = await PayoutRequest.aggregate([
    {
      $match: {
        campaign: campaignId,
        status: { $in: ['approved', 'processing', 'completed'] },
      },
    },
    { $group: { _id: null, total: { $sum: '$requestedAmount' } } },
  ])

  const totalWithdrawn = payoutsAgg[0]?.total || 0
  const available = Math.max(0, totalReceived - totalWithdrawn)

  return { totalReceived, totalWithdrawn, available }
}

/**
 * @desc  Get payout request history for current user
 * @route GET /api/payouts
 * @access Private
 */
export const getMyPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 20

    const [payouts, total] = await Promise.all([
      PayoutRequest.find({ user: req.user._id })
        .populate('campaign', 'title slug')
        .populate('payoutAccount', 'bankName accountNumberLast4 upiId')
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      PayoutRequest.countDocuments({ user: req.user._id }),
    ])

    return res.status(200).json({
      success: true,
      count: payouts.length,
      total,
      payouts,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc  Get balance overview for the payout dashboard
 * @route GET /api/payouts/balance
 * @access Private
 */
export const getPayoutBalance = async (req, res) => {
  try {
    // Get all campaigns for this user
    const campaigns = await Campaign.find({
      organizer: req.user._id,
      status: { $in: ['active', 'completed'] },
    }).select('_id title raisedAmount')

    let totalReceived = 0
    let totalWithdrawn = 0
    let campaignBalances = []

    for (const c of campaigns) {
      const bal = await getCampaignBalance(c._id)
      totalReceived += bal.totalReceived
      totalWithdrawn += bal.totalWithdrawn
      campaignBalances.push({
        campaign: { _id: c._id, title: c.title },
        ...bal,
      })
    }

    // Pending payout requests
    const pendingAgg = await PayoutRequest.aggregate([
      {
        $match: {
          user: req.user._id,
          status: { $in: ['requested', 'under_review'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$requestedAmount' } } },
    ])

    const pendingPayouts = pendingAgg[0]?.total || 0

    return res.status(200).json({
      success: true,
      balance: {
        totalReceived,
        totalWithdrawn,
        availableBalance: Math.max(0, totalReceived - totalWithdrawn - pendingPayouts),
        pendingPayouts,
      },
      campaignBalances,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc  Request a payout from a campaign
 * @route POST /api/payouts
 * @access Private
 */
export const requestPayout = async (req, res) => {
  try {
    const { campaignId, payoutAccountId, amount, notes = '' } = req.body

    if (!campaignId || !payoutAccountId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'campaignId, payoutAccountId, and amount are required.',
      })
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount < MIN_PAYOUT) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout amount is ₹${MIN_PAYOUT}.`,
      })
    }

    if (numAmount > MAX_PAYOUT) {
      return res.status(400).json({
        success: false,
        message: `Maximum payout amount per request is ₹${MAX_PAYOUT.toLocaleString('en-IN')}.`,
      })
    }

    // Verify campaign belongs to this user
    const campaign = await Campaign.findOne({
      _id: campaignId,
      organizer: req.user._id,
    })
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found or access denied.' })
    }

    // Verify payout account is verified and belongs to this user
    const payoutAccount = await PayoutAccount.findOne({
      _id: payoutAccountId,
      user: req.user._id,
      isActive: true,
    })
    if (!payoutAccount) {
      return res.status(404).json({ success: false, message: 'Payout account not found.' })
    }

    if (payoutAccount.verificationStatus !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Payout account must be verified before requesting a withdrawal.',
      })
    }

    // Check available balance (server-side — never trust frontend amount)
    const balance = await getCampaignBalance(campaign._id)

    // Also subtract any pending payout requests for this campaign
    const pendingForCampaign = await PayoutRequest.aggregate([
      {
        $match: {
          campaign: campaign._id,
          status: { $in: ['requested', 'under_review'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$requestedAmount' } } },
    ])
    const pendingAmount = pendingForCampaign[0]?.total || 0
    const trueAvailable = Math.max(0, balance.available - pendingAmount)

    if (numAmount > trueAvailable) {
      return res.status(400).json({
        success: false,
        message: `Requested amount ₹${numAmount.toLocaleString('en-IN')} exceeds available balance ₹${trueAvailable.toLocaleString('en-IN')}.`,
      })
    }

    const payoutRequest = await PayoutRequest.create({
      user: req.user._id,
      campaign: campaign._id,
      payoutAccount: payoutAccount._id,
      requestedAmount: numAmount,
      notes: notes.trim(),
      status: 'requested',
      balanceAtRequest: trueAvailable,
    })

    await AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'payout_request.created',
      entityType: 'payout_request',
      entityId: payoutRequest._id,
      metadata: {
        campaignId: campaign._id,
        amount: numAmount,
        payoutAccountId: payoutAccount._id,
        balanceAtRequest: trueAvailable,
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Payout request submitted for admin review.',
      payoutRequest,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc  Get a specific payout request
 * @route GET /api/payouts/:id
 * @access Private (own only)
 */
export const getPayoutById = async (req, res) => {
  try {
    const payout = await PayoutRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('campaign', 'title slug')
      .populate('payoutAccount', 'bankName accountNumberLast4 upiId')

    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout request not found.' })
    }

    return res.status(200).json({ success: true, payout })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
