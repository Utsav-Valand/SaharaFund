import mongoose from 'mongoose'
import slugify from 'slugify'

const updateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Update title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Update content is required'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    images: [{ type: String }],
  },
  { timestamps: true }
)

const campaignSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Campaign must belong to an organizer'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a campaign title'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed campaign story/description'],
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [20000, 'Description cannot exceed 20,000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a campaign category'],
      enum: [
        'medical',
        'education',
        'disaster',
        'personal',
        'startup',
        'sports',
        'animals',
        'emergency',
        'other',
      ],
      lowercase: true,
    },
    goalAmount: {
      type: Number,
      required: [true, 'Please specify a fundraising goal amount'],
      min: [500, 'Goal amount must be at least ₹500'],
      max: [100000000, 'Goal amount cannot exceed ₹10,00,00,000 (10 Crores)'],
    },
    raisedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Raised amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?auto=format&fit=crop&w=1200&q=80',
    },
    images: [{ type: String }],
    documents: [
      {
        name: { type: String },
        url: { type: String },
        docType: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    beneficiaryName: {
      type: String,
      required: [true, 'Please specify the beneficiary name'],
      trim: true,
    },
    beneficiaryRelation: {
      type: String,
      required: [true, 'Please specify your relation to the beneficiary'],
      trim: true,
      default: 'Self',
    },
    location: {
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'completed', 'rejected', 'suspended'],
      default: 'draft',
    },
    deadline: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days default
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    donorCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    updates: [updateSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Virtual field for calculation of progress percentage
campaignSchema.virtual('progressPercentage').get(function () {
  if (!this.goalAmount || this.goalAmount <= 0) return 0
  const pct = Math.round((this.raisedAmount / this.goalAmount) * 100)
  return Math.min(pct, 100)
})

// Auto-generate unique slug before save
campaignSchema.pre('save', async function (next) {
  if (this.isModified('title') || !this.slug) {
    const baseSlug = slugify(this.title, { lower: true, strict: true }) || 'campaign'
    const uniqueSuffix = Math.random().toString(36).substring(2, 7)
    this.slug = `${baseSlug}-${uniqueSuffix}`
  }
  next()
})

// Compound and single indexes for high query performance
campaignSchema.index({ status: 1, category: 1, createdAt: -1 })
campaignSchema.index({ organizer: 1, createdAt: -1 })
campaignSchema.index({ isFeatured: 1, status: 1 })
campaignSchema.index({ isUrgent: 1, status: 1 })
campaignSchema.index({ title: 'text', description: 'text' })

const Campaign = mongoose.model('Campaign', campaignSchema)

export default Campaign
