import FraudCheck from '../models/FraudCheck.js'
import Campaign from '../models/Campaign.js'
import { assessCampaignRisk } from '../utils/fraudDetector.js'

/**
 * @desc    Trigger/Create a fraud check on a campaign
 * @route   POST /api/fraud/check
 * @access  Private (Admin or System)
 */
export const createFraudCheck = async (req, res) => {
  try {
    const { campaignId } = req.body

    if (!campaignId) {
      return res.status(400).json({ success: false, message: 'Please provide campaignId.' })
    }

    const campaign = await Campaign.findById(campaignId).populate('organizer')
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    const assessment = assessCampaignRisk(campaign, campaign.organizer)

    const fraudCheck = await FraudCheck.findOneAndUpdate(
      { campaign: campaign._id },
      {
        campaign: campaign._id,
        user: campaign.organizer._id,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        textRisk: assessment.textRisk,
        identityRisk: assessment.identityRisk,
        imageRisk: assessment.imageRisk,
        checks: assessment.checks,
        reasons: assessment.reasons,
        status: assessment.riskLevel === 'critical' ? 'flagged' : 'pending',
      },
      { upsert: true, new: true }
    )

    return res.status(200).json({
      success: true,
      message: 'Fraud risk assessment completed.',
      fraudCheck,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get all fraud checks / queue
 * @route   GET /api/fraud
 * @access  Private (Admin only)
 */
export const getFraudQueue = async (req, res) => {
  try {
    const { status, riskLevel, page = 1, limit = 20 } = req.query
    const query = {}

    if (status && status !== 'all') {
      query.status = status
    }
    if (riskLevel && riskLevel !== 'all') {
      query.riskLevel = riskLevel
    }

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 20

    const [fraudChecks, total] = await Promise.all([
      FraudCheck.find(query)
        .populate('campaign', 'title goalAmount raisedAmount coverImage status organizer')
        .populate('user', 'name email isVerified')
        .populate('reviewedBy', 'name email')
        .sort('-riskScore -createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      FraudCheck.countDocuments(query),
    ])

    return res.status(200).json({
      success: true,
      count: fraudChecks.length,
      total,
      fraudChecks,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get single fraud check details
 * @route   GET /api/fraud/:id
 * @access  Private (Admin only)
 */
export const getFraudCheck = async (req, res) => {
  try {
    const fraudCheck = await FraudCheck.findById(req.params.id)
      .populate('campaign')
      .populate('user', 'name email phone isVerified')
      .populate('reviewedBy', 'name email')

    if (!fraudCheck) {
      return res.status(404).json({ success: false, message: 'Fraud check record not found.' })
    }

    return res.status(200).json({ success: true, fraudCheck })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Review & update fraud check status
 * @route   PUT /api/fraud/:id/review
 * @access  Private (Admin only)
 */
export const reviewFraudCheck = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body

    if (!status || !['pending', 'approved', 'flagged', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: pending, approved, flagged, rejected.',
      })
    }

    const fraudCheck = await FraudCheck.findById(req.params.id)
    if (!fraudCheck) {
      return res.status(404).json({ success: false, message: 'Fraud check record not found.' })
    }

    fraudCheck.status = status
    fraudCheck.reviewNotes = reviewNotes || ''
    fraudCheck.reviewedBy = req.user._id
    fraudCheck.reviewedAt = new Date()

    await fraudCheck.save()

    // If approved or rejected, update corresponding campaign
    if (fraudCheck.campaign) {
      if (status === 'approved') {
        await Campaign.findByIdAndUpdate(fraudCheck.campaign, {
          status: 'active',
          verificationStatus: 'verified',
        })
      } else if (status === 'rejected') {
        await Campaign.findByIdAndUpdate(fraudCheck.campaign, {
          status: 'rejected',
          verificationStatus: 'rejected',
          rejectionReason: reviewNotes || 'Automated fraud check and administrative review failed.',
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: `Fraud check marked as ${status}.`,
      fraudCheck,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
