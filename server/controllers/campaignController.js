import mongoose from 'mongoose'
import Campaign from '../models/Campaign.js'
import Donation from '../models/Donation.js'
import FraudCheck from '../models/FraudCheck.js'
import Report from '../models/Report.js'
import Notification from '../models/Notification.js'
import { assessCampaignRisk } from '../utils/fraudDetector.js'

/**
 * @desc    Get all public campaigns (with filtering, search, pagination)
 * @route   GET /api/campaigns
 * @access  Public
 */
export const getCampaigns = async (req, res) => {
  try {
    const {
      category,
      search,
      state,
      urgent,
      featured,
      status,
      sort = '-createdAt',
      page = 1,
      limit = 12,
    } = req.query

    const query = {}

    // Public only sees 'active' campaigns by default unless specified otherwise by admin
    query.status = status || 'active'

    if (category && category !== 'all') {
      query.category = category.toLowerCase()
    }

    if (state && state !== 'all') {
      query['location.state'] = new RegExp(state, 'i')
    }

    if (urgent === 'true') {
      query.isUrgent = true
    }

    if (featured === 'true') {
      query.isFeatured = true
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { beneficiaryName: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
      ]
    }

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 12
    const skip = (pageNum - 1) * limitNum

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('organizer', 'name profileImage isVerified')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Campaign.countDocuments(query),
    ])

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      campaigns,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get single campaign by ID or Slug
 * @route   GET /api/campaigns/:id
 * @access  Public
 */
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params
    let campaign

    if (mongoose.Types.ObjectId.isValid(id)) {
      campaign = await Campaign.findById(id).populate('organizer', 'name email profileImage isVerified phone bio')
    } else {
      campaign = await Campaign.findOne({ slug: id }).populate('organizer', 'name email profileImage isVerified phone bio')
    }

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    // Fetch recent completed donations for this campaign
    const recentDonations = await Donation.find({
      campaign: campaign._id,
      paymentStatus: 'completed',
    })
      .select('donorName amount isAnonymous comment createdAt')
      .sort('-createdAt')
      .limit(10)

    return res.status(200).json({
      success: true,
      campaign,
      recentDonations,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Create a new campaign
 * @route   POST /api/campaigns
 * @access  Private (Organizer / Fundraiser / Admin)
 */
export const createCampaign = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      goalAmount,
      currency,
      coverImage,
      images,
      beneficiaryName,
      beneficiaryRelation,
      location,
      deadline,
      isUrgent,
    } = req.body

    if (!title || !description || !category || !goalAmount || !beneficiaryName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required campaign fields: title, description, category, goal amount, beneficiary name.',
      })
    }

    const campaign = await Campaign.create({
      organizer: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category.toLowerCase().trim(),
      goalAmount: Number(goalAmount),
      currency: currency || 'INR',
      coverImage: coverImage || undefined,
      images: images || [],
      beneficiaryName: beneficiaryName.trim(),
      beneficiaryRelation: beneficiaryRelation || 'Self',
      location: location || {},
      deadline: deadline ? new Date(deadline) : undefined,
      isUrgent: Boolean(isUrgent),
      status: 'draft',
    })

    // Perform automated background fraud check
    const assessment = assessCampaignRisk(campaign, req.user)
    await FraudCheck.create({
      campaign: campaign._id,
      user: req.user._id,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      textRisk: assessment.textRisk,
      identityRisk: assessment.identityRisk,
      imageRisk: assessment.imageRisk,
      checks: assessment.checks,
      reasons: assessment.reasons,
      status: assessment.riskLevel === 'critical' ? 'flagged' : 'pending',
    })

    return res.status(201).json({
      success: true,
      message: 'Campaign created successfully as Draft.',
      campaign,
    })
  } catch (error) {
    console.error('Create Campaign Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Update existing campaign
 * @route   PUT /api/campaigns/:id
 * @access  Private (Organizer of campaign or Admin)
 */
export const updateCampaign = async (req, res) => {
  try {
    let campaign = await Campaign.findById(req.params.id)

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    // Check ownership
    if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this campaign.' })
    }

    // Prohibit critical field changes on active campaigns with existing donations
    const allowedUpdates = [
      'title',
      'description',
      'coverImage',
      'images',
      'beneficiaryRelation',
      'location',
      'isUrgent',
      'deadline',
    ]

    // Goal amount can only be updated if not active with donations, or by admin
    if (campaign.raisedAmount === 0 || req.user.role === 'admin') {
      allowedUpdates.push('goalAmount', 'category', 'beneficiaryName')
    }

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field]
      }
    })

    await campaign.save()

    return res.status(200).json({
      success: true,
      message: 'Campaign updated successfully.',
      campaign,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Delete a campaign
 * @route   DELETE /api/campaigns/:id
 * @access  Private (Organizer of campaign or Admin)
 */
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this campaign.' })
    }

    if (campaign.raisedAmount > 0 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a campaign that has already received donations.',
      })
    }

    await Campaign.findByIdAndDelete(req.params.id)

    return res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully.',
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Submit campaign for review/publishing
 * @route   POST /api/campaigns/:id/submit
 * @access  Private
 */
export const submitCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' })
    }

    // Run risk assessment
    const assessment = assessCampaignRisk(campaign, req.user)
    
    // Auto-activate low risk, or set pending for high risk
    if (assessment.riskLevel === 'low') {
      campaign.status = 'active'
      campaign.verificationStatus = 'verified'
    } else {
      campaign.status = 'pending'
      campaign.verificationStatus = 'pending'
    }

    await campaign.save()

    // Update fraud check record
    await FraudCheck.findOneAndUpdate(
      { campaign: campaign._id },
      {
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        textRisk: assessment.textRisk,
        identityRisk: assessment.identityRisk,
        imageRisk: assessment.imageRisk,
        checks: assessment.checks,
        reasons: assessment.reasons,
        status: assessment.riskLevel === 'critical' ? 'flagged' : 'pending',
      },
      { upsert: true }
    )

    return res.status(200).json({
      success: true,
      message: campaign.status === 'active' ? 'Campaign published successfully!' : 'Campaign submitted for verification.',
      campaign,
      riskLevel: assessment.riskLevel,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Upload campaign cover image
 * @route   POST /api/campaigns/:id/cover
 * @access  Private
 */
export const uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' })
    }

    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' })
    }

    campaign.coverImage = `/uploads/${req.file.filename}`
    await campaign.save()

    return res.status(200).json({
      success: true,
      message: 'Cover image uploaded.',
      coverImage: campaign.coverImage,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get updates timeline for a campaign
 * @route   GET /api/campaigns/:id/updates
 * @access  Public
 */
export const getUpdates = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).select('updates title')
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }
    return res.status(200).json({ success: true, updates: campaign.updates || [] })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Post a new update to campaign timeline
 * @route   POST /api/campaigns/:id/updates
 * @access  Private (Organizer only)
 */
export const postUpdate = async (req, res) => {
  try {
    const { title, content, images } = req.body
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please provide update title and content.' })
    }

    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' })
    }

    campaign.updates.unshift({
      title: title.trim(),
      content: content.trim(),
      images: images || [],
    })

    await campaign.save()

    return res.status(201).json({
      success: true,
      message: 'Update posted successfully.',
      updates: campaign.updates,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get campaigns belonging to the current user
 * @route   GET /api/campaigns/me
 * @access  Private
 */
export const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ organizer: req.user._id }).sort('-createdAt')
    return res.status(200).json({ success: true, count: campaigns.length, campaigns })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Report a campaign for violation/fraud
 * @route   POST /api/campaigns/:id/report
 * @access  Public
 */
export const reportCampaign = async (req, res) => {
  try {
    const { reason, description, reporterName, reporterEmail, evidenceUrls } = req.body

    if (!reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reason and description for reporting this campaign.',
      })
    }

    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    const report = await Report.create({
      campaign: campaign._id,
      reportedBy: req.user ? req.user._id : null,
      reporterName: reporterName || (req.user ? req.user.name : 'Anonymous Reporter'),
      reporterEmail: reporterEmail || (req.user ? req.user.email : ''),
      reason,
      description,
      evidenceUrls: evidenceUrls || [],
    })

    return res.status(201).json({
      success: true,
      message: 'Report submitted. Our Trust & Safety team will review this campaign promptly.',
      report,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get campaign analytics
 * @route   GET /api/campaigns/:id/analytics
 * @access  Private (Organizer only)
 */
export const getCampaignAnalytics = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' })
    }

    const donations = await Donation.find({
      campaign: campaign._id,
      paymentStatus: 'completed',
    }).sort('createdAt')

    const totalDonations = donations.length
    const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0)
    const averageDonation = totalDonations > 0 ? Math.round(totalRaised / totalDonations) : 0

    return res.status(200).json({
      success: true,
      analytics: {
        totalRaised,
        goalAmount: campaign.goalAmount,
        progressPercentage: campaign.progressPercentage,
        totalDonations,
        averageDonation,
        donations,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
