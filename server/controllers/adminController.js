import Campaign from '../models/Campaign.js'
import User from '../models/User.js'
import Donation from '../models/Donation.js'
import Report from '../models/Report.js'
import Notification from '../models/Notification.js'

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

    // Notify organizer
    await Notification.create({
      recipient: campaign.organizer,
      type: 'campaign_approved',
      title: 'Campaign Approved! 🎉',
      message: `Your campaign "${campaign.title}" is now live and accepting donations.`,
      relatedCampaign: campaign._id,
      actionUrl: `/campaign/${campaign._id}`,
    })

    return res.status(200).json({
      success: true,
      message: 'Campaign approved and published.',
      campaign,
    })
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

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    campaign.status = 'rejected'
    campaign.verificationStatus = 'rejected'
    campaign.rejectionReason = reason || 'Campaign does not meet platform verification guidelines.'
    await campaign.save()

    // Notify organizer
    await Notification.create({
      recipient: campaign.organizer,
      type: 'campaign_rejected',
      title: 'Campaign Requires Revisions',
      message: `Your campaign "${campaign.title}" was not approved. Reason: ${campaign.rejectionReason}`,
      relatedCampaign: campaign._id,
      actionUrl: `/dashboard/campaigns`,
    })

    return res.status(200).json({
      success: true,
      message: 'Campaign rejected.',
      campaign,
    })
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

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    campaign.status = 'suspended'
    campaign.rejectionReason = reason || 'Suspended pending investigation.'
    await campaign.save()

    return res.status(200).json({
      success: true,
      message: 'Campaign suspended.',
      campaign,
    })
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
      User.find(query)
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(query),
    ])

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      users,
    })
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

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    return res.status(200).json({
      success: true,
      message: 'User role updated.',
      user,
    })
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
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' })
    }

    report.status = status
    report.resolutionNotes = resolution || ''
    report.resolvedBy = req.user._id
    report.resolvedAt = new Date()
    await report.save()

    return res.status(200).json({
      success: true,
      message: 'Report resolved.',
      report,
    })
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
    const [totalUsers, totalCampaigns, activeCampaigns, donations] = await Promise.all([
      User.countDocuments(),
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'active' }),
      Donation.find({ paymentStatus: 'completed' }).select('amount createdAt'),
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
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
