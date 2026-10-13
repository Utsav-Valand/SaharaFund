import VerificationRequest from '../models/VerificationRequest.js'
import User from '../models/User.js'
import AuditLog from '../models/AuditLog.js'
import Notification from '../models/Notification.js'

/**
 * @desc  Get current user's verification status summary
 * @route GET /api/verification/me
 * @access Private
 */
export const getMyVerificationStatus = async (req, res) => {
  try {
    const verifications = await VerificationRequest.find({ user: req.user._id })
      .sort('-createdAt')

    // Build status summary by type
    const summary = {
      identity: null,
      bank_account: null,
      campaign_beneficiary: [],
    }

    verifications.forEach(v => {
      if (v.verificationType === 'identity') {
        if (!summary.identity || v.createdAt > summary.identity.createdAt) {
          summary.identity = v
        }
      } else if (v.verificationType === 'bank_account') {
        if (!summary.bank_account || v.createdAt > summary.bank_account.createdAt) {
          summary.bank_account = v
        }
      } else if (v.verificationType === 'campaign_beneficiary') {
        summary.campaign_beneficiary.push(v)
      }
    })

    const user = await User.findById(req.user._id).select('kycStatus isVerified')

    return res.status(200).json({
      success: true,
      user: {
        kycStatus: user.kycStatus,
        isVerified: user.isVerified,
      },
      verifications: summary,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc  Submit a new verification request
 * @route POST /api/verification
 * @access Private
 */
export const submitVerification = async (req, res) => {
  try {
    const {
      verificationType,
      campaignId,
      payoutAccountId,
      submittedData = {},
      documentUrls = [],
    } = req.body

    if (!verificationType) {
      return res.status(400).json({ success: false, message: 'verificationType is required.' })
    }

    const validTypes = ['identity', 'bank_account', 'campaign_beneficiary']
    if (!validTypes.includes(verificationType)) {
      return res.status(400).json({
        success: false,
        message: `verificationType must be one of: ${validTypes.join(', ')}.`,
      })
    }

    // For identity verification: check for an existing pending/submitted request
    if (verificationType === 'identity') {
      const existing = await VerificationRequest.findOne({
        user: req.user._id,
        verificationType: 'identity',
        status: { $in: ['submitted', 'under_review', 'verified'] },
      })
      if (existing && existing.status === 'verified') {
        return res.status(400).json({
          success: false,
          message: 'Identity already verified.',
        })
      }
    }

    // SECURITY: never store full Aadhaar or sensitive numbers
    // Only store masked references and document types
    const sanitizedData = {
      legalName: submittedData.legalName?.trim(),
      dateOfBirth: submittedData.dateOfBirth,
      addressLine1: submittedData.addressLine1?.trim(),
      addressLine2: submittedData.addressLine2?.trim(),
      city: submittedData.city?.trim(),
      state: submittedData.state?.trim(),
      pincode: submittedData.pincode?.trim(),
      idDocumentType: submittedData.idDocumentType || '',
      // Only store last 4 digits or masked reference — never full number
      idDocumentReference: submittedData.idDocumentReference
        ? submittedData.idDocumentReference.slice(-4).padStart(
            submittedData.idDocumentReference.length,
            'X'
          )
        : '',
      beneficiaryRelation: submittedData.beneficiaryRelation?.trim(),
      purposeDetails: submittedData.purposeDetails?.trim(),
    }

    const verification = await VerificationRequest.create({
      user: req.user._id,
      verificationType,
      campaign: campaignId || null,
      payoutAccount: payoutAccountId || null,
      submittedData: sanitizedData,
      documentUrls,
      status: 'submitted',
      submittedAt: new Date(),
    })

    // Update user's kycStatus if identity request
    if (verificationType === 'identity') {
      await User.findByIdAndUpdate(req.user._id, { kycStatus: 'pending' })
    }

    await AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.role,
      action: `verification.submitted`,
      entityType: 'verification_request',
      entityId: verification._id,
      metadata: { verificationType },
    })

    return res.status(201).json({
      success: true,
      message: 'Verification request submitted. Our team will review it within 2-3 business days.',
      verification,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc  Get a specific verification request
 * @route GET /api/verification/:id
 * @access Private (own only)
 */
export const getVerificationById = async (req, res) => {
  try {
    const verification = await VerificationRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('campaign', 'title slug').populate('payoutAccount', 'bankName accountNumberLast4')

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification request not found.' })
    }

    return res.status(200).json({ success: true, verification })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc  Resubmit a rejected verification request
 * @route POST /api/verification/:id/resubmit
 * @access Private
 */
export const resubmitVerification = async (req, res) => {
  try {
    const verification = await VerificationRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification request not found.' })
    }

    if (!['rejected', 'action_required'].includes(verification.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only rejected or action_required requests can be resubmitted.',
      })
    }

    const { submittedData = {}, documentUrls = [] } = req.body

    verification.submittedData = { ...verification.submittedData, ...submittedData }
    verification.documentUrls = documentUrls.length > 0 ? documentUrls : verification.documentUrls
    verification.status = 'submitted'
    verification.submittedAt = new Date()
    verification.version = (verification.version || 1) + 1
    verification.reviewer = null
    verification.reviewNotes = ''
    verification.rejectionReason = ''
    verification.reviewedAt = null

    await verification.save()

    return res.status(200).json({
      success: true,
      message: 'Verification resubmitted for review.',
      verification,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
