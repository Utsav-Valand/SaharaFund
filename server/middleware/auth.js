import { verifyToken } from '../utils/jwt.js'
import User from '../models/User.js'

/**
 * Protect routes: Requires a valid JWT bearer token.
 */
export const protect = async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please log in.',
    })
  }

  try {
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This user account has been deactivated.',
      })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    })
  }
}

/**
 * Authorize specific roles (e.g. 'admin', 'organizer', 'donor').
 * 'organizer' and 'fundraiser' are treated as interchangeable aliases.
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      })
    }

    const userRole = req.user.role === 'fundraiser' ? 'organizer' : req.user.role
    const normalizedAllowed = allowedRoles.map((r) =>
      r === 'fundraiser' ? 'organizer' : r
    )

    if (!normalizedAllowed.includes(userRole) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route.`,
      })
    }

    next()
  }
}

/**
 * Optional Authentication: Attaches req.user if a valid token is present, but doesn't block guests.
 */
export const optionalAuth = async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    req.user = null
    return next()
  }

  try {
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.id)
    req.user = user && user.isActive ? user : null
  } catch (err) {
    req.user = null
  }

  next()
}
