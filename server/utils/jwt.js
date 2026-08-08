import jwt from 'jsonwebtoken'

/**
 * Generates a signed JWT token for a given user ID.
 */
export const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'saharafund_fallback_development_secret_2026'
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

  return jwt.sign({ id: userId, role }, secret, { expiresIn })
}

/**
 * Verifies a JWT token.
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'saharafund_fallback_development_secret_2026'
  return jwt.verify(token, secret)
}
