import crypto from 'crypto'
import User from '../models/User.js'
import { generateToken } from '../utils/jwt.js'

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      })
    }

    const passwordHash = await User.hashPassword(password)
    const normalizedRole = role === 'fundraiser' ? 'organizer' : role || 'donor'

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone || '',
      role: normalizedRole,
    })

    const token = generateToken(user._id, user.role)

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user,
    })
  } catch (error) {
    console.error('Registration Error:', error.message)
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    })
  }
}

/**
 * @desc    Login user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      })
    }

    // Explicitly include passwordHash which is excluded by default
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const token = generateToken(user._id, user.role)

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toJSON(),
    })
  } catch (error) {
    console.error('Login Error:', error.message)
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    })
  }
}

/**
 * @desc    Get current authenticated user
 * @route   GET /api/auth/me (or /api/users/me)
 * @access  Private
 */
export const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving profile.',
    })
  }
}

/**
 * @desc    Forgot password - generate reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address.',
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      // Return 200 to prevent user enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000 // 1 hour

    await user.save({ validateBeforeSave: false })

    console.log(`🔑 [Password Reset Token (Dev)] User: ${user.email} | Token: ${resetToken}`)

    return res.status(200).json({
      success: true,
      message: 'Password reset link generated.',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during password reset request.',
    })
  }
}

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both reset token and new password.',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      })
    }

    user.passwordHash = await User.hashPassword(password)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    const newToken = generateToken(user._id, user.role)

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully updated.',
      token: newToken,
      user: user.toJSON(),
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during password reset.',
    })
  }
}

/**
 * @desc    Change password for authenticated user
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password.',
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      })
    }

    const user = await User.findById(req.user._id).select('+passwordHash')
    const isMatch = await user.comparePassword(currentPassword)

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      })
    }

    user.passwordHash = await User.hashPassword(newPassword)
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error changing password.',
    })
  }
}

/**
 * @desc    Logout user (stateless)
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  })
}
