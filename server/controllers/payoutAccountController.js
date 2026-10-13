import PayoutAccount from '../models/PayoutAccount.js'
import AuditLog from '../models/AuditLog.js'
import Notification from '../models/Notification.js'

/**
 * @desc  Get all payout accounts for the current user
 * @route GET /api/payout-accounts
 * @access Private
 */
export const getMyPayoutAccounts = async (req, res) => {
  try {
    const accounts = await PayoutAccount.find({ user: req.user._id, isActive: true })
      .sort('-createdAt')

    return res.status(200).json({
      success: true,
      count: accounts.length,
      accounts,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc  Add a new payout account (bank + optional UPI)
 * @route POST /api/payout-accounts
 * @access Private
 */
export const addPayoutAccount = async (req, res) => {
  try {
    const {
      accountHolderName,
      accountNumber,
      confirmAccountNumber,
      ifscCode,
      bankName,
      accountType = 'savings',
      upiId = '',
      upiQrCodeUrl = '',
      isPrimary = false,
    } = req.body

    // Frontend validation mirrors
    if (!accountHolderName || !accountNumber || !confirmAccountNumber || !ifscCode || !bankName) {
      return res.status(400).json({
        success: false,
        message: 'accountHolderName, accountNumber, confirmAccountNumber, ifscCode, and bankName are required.',
      })
    }

    if (accountNumber !== confirmAccountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Account numbers do not match.',
      })
    }

    // Validate IFSC format
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IFSC code format. Expected format: ABCD0123456.',
      })
    }

    // Validate UPI ID if provided
    if (upiId && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UPI ID format.',
      })
    }

    // If this is set as primary, unset existing primary
    if (isPrimary) {
      await PayoutAccount.updateMany(
        { user: req.user._id, isPrimary: true },
        { isPrimary: false }
      )
    }

    // Encrypt account number
    const { encryptedAccountNumber, accountNumberLast4 } =
      PayoutAccount.prepareAccountData(accountNumber)

    const account = await PayoutAccount.create({
      user: req.user._id,
      accountHolderName: accountHolderName.trim(),
      encryptedAccountNumber,
      accountNumberLast4,
      ifscCode: ifscCode.toUpperCase().trim(),
      bankName: bankName.trim(),
      accountType,
      upiId: upiId.trim(),
      upiQrCodeUrl: upiQrCodeUrl.trim(),
      isPrimary,
      verificationStatus: 'pending',
    })

    await AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'payout_account.created',
      entityType: 'payout_account',
      entityId: account._id,
      metadata: {
        bankName: bankName.trim(),
        accountNumberLast4,
        ifscCode: ifscCode.toUpperCase(),
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Bank account submitted for verification. You will be notified once reviewed.',
      account,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc  Update a payout account (only if not yet verified)
 * @route PATCH /api/payout-accounts/:id
 * @access Private
 */
export const updatePayoutAccount = async (req, res) => {
  try {
    const account = await PayoutAccount.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true,
    })

    if (!account) {
      return res.status(404).json({ success: false, message: 'Payout account not found.' })
    }

    if (account.verificationStatus === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Verified accounts cannot be edited. Please add a new account.',
      })
    }

    const allowed = ['accountHolderName', 'ifscCode', 'bankName', 'accountType', 'upiId', 'upiQrCodeUrl']
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        account[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field]
      }
    })

    // Allow re-submitting account number
    if (req.body.accountNumber) {
      const { encryptedAccountNumber, accountNumberLast4 } =
        PayoutAccount.prepareAccountData(req.body.accountNumber)
      account.encryptedAccountNumber = encryptedAccountNumber
      account.accountNumberLast4 = accountNumberLast4
    }

    if (req.body.ifscCode) {
      account.ifscCode = req.body.ifscCode.toUpperCase().trim()
    }

    // Reset to pending when edited
    account.verificationStatus = 'pending'
    account.verificationNotes = ''

    await account.save()

    return res.status(200).json({
      success: true,
      message: 'Payout account updated. It will need to be re-verified.',
      account,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc  Soft-delete a payout account
 * @route DELETE /api/payout-accounts/:id
 * @access Private
 */
export const deletePayoutAccount = async (req, res) => {
  try {
    const account = await PayoutAccount.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true,
    })

    if (!account) {
      return res.status(404).json({ success: false, message: 'Payout account not found.' })
    }

    account.isActive = false
    await account.save()

    return res.status(200).json({
      success: true,
      message: 'Payout account removed.',
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
