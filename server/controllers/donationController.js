import Donation from '../models/Donation.js'
import Campaign from '../models/Campaign.js'
import Notification from '../models/Notification.js'

/**
 * @desc    Create a new donation
 * @route   POST /api/donations
 * @access  Public (Optional Auth for logged-in donors)
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
      autoComplete = true, // Set to true for mock / direct sandboxes
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

    const campaign = await Campaign.findById(campaignId)
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    if (campaign.status !== 'active' && campaign.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This campaign is not currently accepting donations.',
      })
    }

    const initialStatus = autoComplete ? 'completed' : 'pending'

    const donation = await Donation.create({
      campaign: campaign._id,
      donor: req.user ? req.user._id : null,
      amount: numAmount,
      tipAmount: Number(tipAmount) || 0,
      currency: campaign.currency || 'INR',
      donorName: donorName.trim(),
      donorEmail: donorEmail.toLowerCase().trim(),
      isAnonymous: Boolean(isAnonymous),
      comment: comment ? comment.trim() : '',
      paymentProvider,
      paymentStatus: initialStatus,
    })

    // If completed immediately, update campaign statistics
    if (initialStatus === 'completed') {
      await Campaign.findByIdAndUpdate(campaign._id, {
        $inc: { raisedAmount: numAmount, donorCount: 1 },
      })

      // Send in-app notification to the campaign organizer
      await Notification.create({
        recipient: campaign.organizer,
        type: 'donation_received',
        title: 'New Donation Received! 🎉',
        message: `${isAnonymous ? 'An anonymous supporter' : donorName} donated ₹${numAmount.toLocaleString('en-IN')} to "${campaign.title}".`,
        relatedCampaign: campaign._id,
        relatedDonation: donation._id,
        actionUrl: `/campaign/${campaign._id}`,
      })
    }

    return res.status(201).json({
      success: true,
      message: 'Donation processed successfully.',
      donation,
    })
  } catch (error) {
    console.error('Donation Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Verify payment callback
 * @route   POST /api/donations/verify
 * @access  Public
 */
export const verifyPayment = async (req, res) => {
  try {
    const { donationId, transactionId, paymentDetails } = req.body

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

    donation.paymentStatus = 'completed'
    if (transactionId) donation.transactionId = transactionId
    if (paymentDetails) donation.paymentDetails = paymentDetails

    await donation.save()

    // Update campaign raisedAmount
    const campaign = await Campaign.findByIdAndUpdate(
      donation.campaign,
      { $inc: { raisedAmount: donation.amount, donorCount: 1 } },
      { new: true }
    )

    // Notify organizer
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
      .populate('donor', 'name email')

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
        .select('donorName amount isAnonymous comment createdAt')
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
 * @desc    Get donations made by the current user
 * @route   GET /api/donations/me
 * @access  Private
 */
export const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({
      $or: [{ donor: req.user._id }, { donorEmail: req.user.email }],
    })
      .populate('campaign', 'title slug coverImage category status')
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
