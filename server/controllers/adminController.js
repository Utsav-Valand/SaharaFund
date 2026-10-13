import Campaign from '../models/Campaign.js'
import User from '../models/User.js'
import Donation from '../models/Donation.js'
import Report from '../models/Report.js'
import Notification from '../models/Notification.js'
import VerificationRequest from '../models/VerificationRequest.js'
import PayoutRequest from '../models/PayoutRequest.js'
import PayoutAccount from '../models/PayoutAccount.js'
import AuditLog from '../models/AuditLog.js'

/**
 * @desc    Get all campaigns for admin review
 * @route   GET /api/admin/campaigns
 * @access  Private (Admin only)
 */
export const getAdminCampaigns = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query
    const query = {}

    if (status && status !== 'all') query.status = status
    if (category && category !== 'all') query.category = category
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { beneficiaryName: { $regex: search, $options: 'i' } },
      ]
    }

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 20

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('organizer', 'name email phone isVerified')
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Campaign.countDocuments(query),
    ])

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      total,
      campaigns,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Approve a pending campaign
 * @route   PUT /api/admin/campaigns/:id/approve
 * @access  Private (Admin only)
 */
export const approveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    campaign.status = 'active'
    campaign.verificationStatus = 'verified'
    campaign.rejectionReason = ''
    await campaign.save()

    await Notification.create({
      recipient: campaign.organizer,
      type: 'campaign_approved',
      title: 'Campaign Approved! 🎉',
      message: `Your campaign "${campaign.title}" is now live and accepting donations.`,
      relatedCampaign: campaign._id,
      actionUrl: `/campaign/${campaign._id}`,
    })

    await AuditLog.create({
      actor: req.user._id,
      actorRole: 'admin',
      action: 'campaign.approved',
      entityType: 'campaign',
      entityId: campaign._id,
    })

    return res.status(200).json({ success: true, message: 'Campaign approved and published.', campaign })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Reject a campaign
 * @route   PUT /api/admin/campaigns/:id/reject
 * @access  Private (Admin only)
 */
export const rejectCampaign = async (req, res) => {
  try {
    const { reason } = req.body
    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' })

    campaign.status = 'rejected'
    campaign.verificationStatus = 'rejected'
    campaign.rejectionReason = reason || 'Campaign does not meet platform verification guidelines.'
    await campaign.save()

    await Notification.create({
      recipient: campaign.organizer,
      type: 'campaign_rejected',
      title: 'Campaign Requires Revisions',
      message: `Your campaign "${campaign.title}" was not approved. Reason: ${campaign.rejectionReason}`,
      relatedCampaign: campaign._id,
      actionUrl: `/dashboard/campaigns`,
    })

    await AuditLog.create({
      actor: req.user._id,
      actorRole: 'admin',
      action: 'campaign.rejected',
      entityType: 'campaign',
      entityId: campaign._id,
      metadata: { reason },
    })

    return res.status(200).json({ success: true, message: 'Campaign rejected.', campaign })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Suspend an active campaign
 * @route   PUT /api/admin/campaigns/:id/suspend
 * @access  Private (Admin only)
 */
export const suspendCampaign = async (req, res) => {
  try {
    const { reason } = req.body
    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' })

    campaign.status = 'suspended'
    campaign.rejectionReason = reason || 'Suspended pending investigation.'
    await campaign.save()

    await AuditLog.create({
      actor: req.user._id,
      actorRole: 'admin',
      action: 'campaign.suspended',
      entityType: 'campaign',
      entityId: campaign._id,
      metadata: { reason },
    })

    return res.status(200).json({ success: true, message: 'Campaign suspended.', campaign })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get all users for admin management
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getUsers = async (req, res) => {
  try {
    const { role, q, page = 1, limit = 20 } = req.query
    const query = {}
    if (role && role !== 'all') query.role = role
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ]
    }

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 20

    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip((pageNum - 1) * limitNum).limit(limitNum),
      User.countDocuments(query),
    ])

    return res.status(200).json({ success: true, count: users.length, total, users })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Update a user's role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin only)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body
    if (!['donor', 'organizer', 'fundraiser', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: role === 'fundraiser' ? 'organizer' : role },
      { new: true }
    )

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    return res.status(200).json({ success: true, message: 'User role updated.', user })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get user reports
 * @route   GET /api/admin/reports
 * @access  Private (Admin only)
 */
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('campaign', 'title slug status coverImage organizer')
      .populate('reportedBy', 'name email')
      .sort('-createdAt')

    return res.status(200).json({ success: true, count: reports.length, reports })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Resolve a user report
 * @route   PUT /api/admin/reports/:id
 * @access  Private (Admin only)
 */
export const resolveReport = async (req, res) => {
  try {
    const { resolution, status = 'resolved' } = req.body
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' })

    report.status = status
    report.resolutionNotes = resolution || ''
    report.resolvedBy = req.user._id
    report.resolvedAt = new Date()
    await report.save()

    return res.status(200).json({ success: true, message: 'Report resolved.', report })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get platform-wide analytics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin only)
 */
export const getAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalCampaigns, activeCampaigns, donations, pendingVerifications, pendingPayouts] =
      await Promise.all([
        User.countDocuments(),
        Campaign.countDocuments(),
        Campaign.countDocuments({ status: 'active' }),
        Donation.find({ paymentStatus: 'completed' }).select('amount createdAt'),
        VerificationRequest.countDocuments({ status: 'submitted' }),
        PayoutRequest.countDocuments({ status: 'requested' }),
      ])

    const totalDonations = donations.length
    const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0)
    const averageDonation = totalDonations > 0 ? Math.round(totalRaised / totalDonations) : 0

    return res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        totalCampaigns,
        activeCampaigns,
        totalDonations,
        totalRaised,
        averageDonation,
        pendingVerifications,
        pendingPayouts,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// ─── Phase 2: Admin Verification Management ───────────────────────────────────

/**
 * @desc    Get all verification requests for admin review
 * @route   GET /api/admin/verifications
 * @access  Private (Admin only)
 */
export const getAdminVerifications = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query
    const query = {}
    if (status && status !== 'all') query.status = status
    if (type && type !== 'all') query.verificationType = type

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 20

    const [verifications, total] = await Promise.all([
      VerificationRequest.find(query)
        .populate('user', 'name email role')
        .populate('campaign', 'title slug')
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      VerificationRequest.countDocuments(query),
    ])

    return res.status(200).json({ success: true, count: verifications.length, total, verifications })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Review a verification request (approve/reject/request action)
 * @route   PATCH /api/admin/verifications/:id
 * @access  Private (Admin only)
 */
export const reviewVerification = async (req, res) => {
  try {
    const { action, notes, rejectionReason } = req.body
    const validActions = ['verify', 'reject', 'action_required', 'under_review']
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: `action must be one of: ${validActions.join(', ')}` })
    }

    const verification = await VerificationRequest.findById(req.params.id).populate('user', 'name email')
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification request not found.' })
    }

    const statusMap = {
      verify: 'verified',
      reject: 'rejected',
      action_required: 'action_required',
      under_review: 'under_review',
    }

    verification.status = statusMap[action]
    verification.reviewer = req.user._id
    verification.reviewNotes = notes || ''
    verification.rejectionReason = rejectionReason || ''
    verification.reviewedAt = new Date()
    await verification.save()

    // Update user kycStatus if identity verification
    if (verification.verificationType === 'identity') {
      const kycMap = { verified: 'verified', rejected: 'rejected', under_review: 'pending', action_required: 'pending' }
      await User.findByIdAndUpdate(verification.user._id, { kycStatus: kycMap[statusMap[action]] || 'pending' })
    }

    // Update PayoutAccount status if bank verification
    if (verification.verificationType === 'bank_account' && verification.payoutAccount) {
      const paStatusMap = { verify: 'verified', reject: 'rejected', action_required: 'action_required' }
      if (paStatusMap[action]) {
        await PayoutAccount.findByIdAndUpdate(verification.payoutAccount, {
          verificationStatus: paStatusMap[action],
          verificationNotes: notes || '',
          ...(action === 'verify' && { verifiedAt: new Date(), verifiedBy: req.user._id }),
        })
      }
    }

    // Notify the user
    const notifMap = {
      verified: { title: 'Verification Approved ✅', msg: `Your ${verification.verificationType.replace('_', ' ')} verification has been approved.` },
      rejected: { title: 'Verification Rejected', msg: `Your ${verification.verificationType.replace('_', ' ')} verification was rejected. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}` },
      action_required: { title: 'Action Required for Verification', msg: `Additional information is required for your ${verification.verificationType.replace('_', ' ')} verification. ${notes || ''}` },
      under_review: { title: 'Verification Under Review', msg: `Your ${verification.verificationType.replace('_', ' ')} verification is now under review.` },
    }
    const notif = notifMap[statusMap[action]]
    await Notification.create({
      recipient: verification.user._id,
      type: 'system',
      title: notif.title,
      message: notif.msg,
      actionUrl: '/dashboard/verification',
    })

    await AuditLog.create({
      actor: req.user._id,
      actorRole: 'admin',
      action: `verification.${statusMap[action]}`,
      entityType: 'verification_request',
      entityId: verification._id,
      metadata: { verificationType: verification.verificationType, notes, rejectionReason },
    })

    return res.status(200).json({
      success: true,
      message: `Verification ${statusMap[action]}.`,
      verification,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// ─── Phase 2: Admin Payout Management ────────────────────────────────────────

/**
 * @desc    Get all payout requests for admin review
 * @route   GET /api/admin/payouts
 * @access  Private (Admin only)
 */
export const getAdminPayouts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const query = {}
    if (status && status !== 'all') query.status = status

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 20

    const [payouts, total] = await Promise.all([
      PayoutRequest.find(query)
        .populate('user', 'name email')
        .populate('campaign', 'title slug raisedAmount')
        .populate('payoutAccount', 'bankName accountNumberLast4 ifscCode upiId')
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      PayoutRequest.countDocuments(query),
    ])

    return res.status(200).json({ success: true, count: payouts.length, total, payouts })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Admin approves, rejects, or records a completed payout
 * @route   PATCH /api/admin/payouts/:id
 * @access  Private (Admin only)
 */
export const reviewPayoutRequest = async (req, res) => {
  try {
    const { action, notes, rejectionReason, manualTransferReference } = req.body
    const validActions = ['approve', 'reject', 'mark_processing', 'mark_completed', 'mark_failed', 'reverse']
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: `action must be one of: ${validActions.join(', ')}` })
    }

    const payout = await PayoutRequest.findById(req.params.id).populate('user', 'name email')
    if (!payout) return res.status(404).json({ success: false, message: 'Payout request not found.' })

    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      mark_processing: 'processing',
      mark_completed: 'completed',
      mark_failed: 'failed',
      reverse: 'reversed',
    }

    payout.status = statusMap[action]
    payout.reviewer = req.user._id
    payout.reviewNotes = notes || ''
    payout.rejectionReason = rejectionReason || ''
    payout.reviewedAt = new Date()
    if (manualTransferReference) payout.manualTransferReference = manualTransferReference
    if (['completed', 'failed', 'reversed'].includes(payout.status)) payout.processedAt = new Date()
    if (payout.status === 'completed') payout.completedAt = new Date()

    await payout.save()

    // Notify the organizer
    const notifMsg = {
      approved: 'Your payout request has been approved and is being processed.',
      rejected: `Your payout request was rejected. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`,
      processing: 'Your payout is being processed.',
      completed: `Your payout of ₹${payout.requestedAmount.toLocaleString('en-IN')} has been completed.${manualTransferReference ? ' Reference: ' + manualTransferReference : ''}`,
      failed: 'Your payout could not be processed. Please contact support.',
      reversed: 'Your payout has been reversed.',
    }

    await Notification.create({
      recipient: payout.user._id,
      type: 'system',
      title: `Payout ${payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}`,
      message: notifMsg[payout.status] || `Your payout status is now: ${payout.status}`,
      actionUrl: '/dashboard/payout',
    })

    await AuditLog.create({
      actor: req.user._id,
      actorRole: 'admin',
      action: `payout_request.${payout.status}`,
      entityType: 'payout_request',
      entityId: payout._id,
      metadata: {
        amount: payout.requestedAmount,
        campaignId: payout.campaign,
        notes,
        rejectionReason,
        manualTransferReference,
      },
    })

    return res.status(200).json({
      success: true,
      message: `Payout ${payout.status}.`,
      payout,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get admin donations list
 * @route   GET /api/admin/donations
 * @access  Private (Admin only)
 */
export const getAdminDonations = async (req, res) => {
  try {
    const { status, provider, page = 1, limit = 20 } = req.query
    const query = {}
    if (status && status !== 'all') query.paymentStatus = status
    if (provider && provider !== 'all') query.paymentProvider = provider

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 20

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate('campaign', 'title slug')
        .select('-gatewaySignature -donorEmail')
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Donation.countDocuments(query),
    ])

    return res.status(200).json({ success: true, count: donations.length, total, donations })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get audit log
 * @route   GET /api/admin/audit-log
 * @access  Private (Admin only)
 */
export const getAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 50, entityType, action } = req.query
    const query = {}
    if (entityType) query.entityType = entityType
    if (action) query.action = { $regex: action, $options: 'i' }

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 50

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role')
        .sort('-timestamp')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      AuditLog.countDocuments(query),
    ])

    return res.status(200).json({ success: true, count: logs.length, total, logs })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
