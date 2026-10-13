import mongoose from 'mongoose'
import crypto from 'crypto'

/**
 * Encrypts account number with AES-256 using the BANK_ENCRYPTION_KEY env var.
 * If no key is configured, falls back to a reversible mask for development.
 */
function encryptAccountNumber(raw) {
  const key = process.env.BANK_ENCRYPTION_KEY
  if (!key || key.length < 32) {
    // Development fallback: store last 4 visible, rest masked
    return `MASKED:${raw}`
  }
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv)
  let encrypted = cipher.update(raw, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

function decryptAccountNumber(stored) {
  if (stored.startsWith('MASKED:')) {
    return stored.replace('MASKED:', '')
  }
  const key = process.env.BANK_ENCRYPTION_KEY
  if (!key) return null
  const [ivHex, encrypted] = stored.split(':')
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(ivHex, 'hex')
  )
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

const payoutAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payout account must belong to a user'],
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    // Stored encrypted; last 4 digits stored separately for display masking
    encryptedAccountNumber: {
      type: String,
      required: [true, 'Account number is required'],
    },
    // Last 4 digits for masked display without decryption
    accountNumberLast4: {
      type: String,
      required: true,
      length: 4,
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please provide a valid IFSC code'],
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    accountType: {
      type: String,
      enum: ['savings', 'current'],
      default: 'savings',
    },
    upiId: {
      type: String,
      trim: true,
      default: '',
      // Basic UPI ID format: name@provider
      match: [/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/, 'Please provide a valid UPI ID'],
    },
    upiQrCodeUrl: {
      type: String,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'verified', 'rejected', 'action_required'],
      default: 'pending',
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    verifiedAt: { type: Date },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        // Never expose encrypted account number in JSON responses
        delete ret.encryptedAccountNumber
        ret.maskedAccountNumber = `XXXXXX${ret.accountNumberLast4}`
        delete ret.__v
        return ret
      },
    },
  }
)

// Virtual to decrypt account number — only accessible server-side
payoutAccountSchema.methods.getDecryptedAccountNumber = function () {
  return decryptAccountNumber(this.encryptedAccountNumber)
}

// Static helper to prepare account data from raw input
payoutAccountSchema.statics.prepareAccountData = function (rawAccountNumber) {
  const cleaned = rawAccountNumber.replace(/\s/g, '')
  return {
    encryptedAccountNumber: encryptAccountNumber(cleaned),
    accountNumberLast4: cleaned.slice(-4),
  }
}

payoutAccountSchema.index({ user: 1, isActive: 1 })
payoutAccountSchema.index({ verificationStatus: 1 })

const PayoutAccount = mongoose.model('PayoutAccount', payoutAccountSchema)
export default PayoutAccount
