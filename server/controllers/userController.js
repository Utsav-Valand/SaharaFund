import User from '../models/User.js'

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    return res.status(200).json({ success: true, user })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Update user profile details
 * @route   PUT /api/users/me
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio } = req.body
    const fieldsToUpdate = {}

    if (name) fieldsToUpdate.name = name.trim()
    if (phone !== undefined) fieldsToUpdate.phone = phone.trim()
    if (bio !== undefined) fieldsToUpdate.bio = bio.trim()

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    })

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Update user profile avatar
 * @route   PUT /api/users/me/avatar
 * @access  Private
 */
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' })
    }

    const avatarUrl = `/uploads/${req.file.filename}`
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: avatarUrl },
      { new: true }
    )

    return res.status(200).json({
      success: true,
      message: 'Profile image updated.',
      user,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Update user bank details for payouts
 * @route   PUT /api/users/me/bank
 * @access  Private
 */
export const updateBankDetails = async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body

    if (!accountHolderName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide account holder name, account number, and IFSC code.',
      })
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        bankDetails: {
          accountHolderName: accountHolderName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          bankName: (bankName || '').trim(),
          isVerified: false, // Reset verification status on edit
        },
      },
      { new: true }
    )

    return res.status(200).json({
      success: true,
      message: 'Bank details updated successfully.',
      user,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get user profile by public ID
 * @route   GET /api/users/:id
 * @access  Public
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name role profileImage isVerified createdAt')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    return res.status(200).json({ success: true, user })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
