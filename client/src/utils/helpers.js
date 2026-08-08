/**
 * Format a number as Indian currency (₹)
 * e.g. 1234567 → "₹12,34,567"
 */
export const formatCurrency = (amount, compact = false) => {
  if (amount === null || amount === undefined) return '₹0'
  const num = Number(amount)
  if (compact) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`
    if (num >= 100000)   return `₹${(num / 100000).toFixed(1)}L`
    if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}K`
    return `₹${num}`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Calculate fundraising progress percentage (capped at 100)
 */
export const calcProgress = (raised, goal) => {
  if (!goal || goal === 0) return 0
  return Math.min(100, Math.round((raised / goal) * 100))
}

/**
 * Format a date relative to now (e.g. "2 days ago", "in 5 days")
 */
export const formatRelativeDate = (date) => {
  const now = new Date()
  const d = new Date(date)
  const diffMs = d - now
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1) return `in ${diffDays} days`
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`
}

/**
 * Format date to "Aug 8, 2026" style
 */
export const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date to "Aug 8, 2026 at 3:45 PM"
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Truncate text to maxLength characters with ellipsis
 */
export const truncate = (str, maxLength = 100) => {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trim() + '…'
}

/**
 * Get initials from a name (e.g. "Rahul Sharma" → "RS")
 */
export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

/**
 * Build a URL-friendly slug from a string
 */
export const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Campaign status metadata
 */
export const campaignStatusConfig = {
  DRAFT:        { label: 'Draft',          color: 'badge-gray',    description: 'Not yet submitted' },
  FRAUD_CHECK:  { label: 'Under Review',   color: 'badge bg-orange-100 text-orange-800', description: 'Automated fraud check in progress' },
  ADMIN_REVIEW: { label: 'Admin Review',   color: 'badge bg-blue-100 text-blue-800', description: 'Awaiting admin approval' },
  LIVE:         { label: 'Live',           color: 'badge-success', description: 'Accepting donations' },
  PAUSED:       { label: 'Paused',         color: 'badge bg-yellow-100 text-yellow-800', description: 'Temporarily paused' },
  COMPLETED:    { label: 'Completed',      color: 'badge bg-indigo-100 text-indigo-800', description: 'Goal reached or deadline passed' },
  REJECTED:     { label: 'Rejected',       color: 'badge-danger',  description: 'Not approved by admin' },
  SUSPENDED:    { label: 'Suspended',      color: 'badge-danger',  description: 'Suspended due to violation' },
}

import medicalIcon from '../assets/categories/medical.png'
import educationIcon from '../assets/categories/education.png'
import disasterIcon from '../assets/categories/disaster.png'
import startupIcon from '../assets/categories/startup.png'
import sportsIcon from '../assets/categories/sports.png'
import animalIcon from '../assets/categories/animal.png'
import personalIcon from '../assets/categories/personal.png'
import communityIcon from '../assets/categories/community.png'
import otherIcon from '../assets/categories/other.png'

/**
 * Campaign categories with exact reference icons
 */
export const CATEGORIES = [
  {
    id: 'medical',
    label: 'Medical Emergency',
    description: 'Help save lives and support medical treatments',
    icon: medicalIcon,
    iconUrl: '/categories/medical.png',
    color: 'bg-rose-50/70 text-rose-800 border-rose-200 hover:border-rose-300',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    titleColor: 'text-rose-700',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Support learning, schools, and bright futures',
    icon: educationIcon,
    iconUrl: '/categories/education.png',
    color: 'bg-blue-50/70 text-blue-800 border-blue-200 hover:border-blue-300',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    titleColor: 'text-blue-700',
  },
  {
    id: 'disaster',
    label: 'Disaster Relief',
    description: 'Provide aid and rebuild lives after disasters',
    icon: disasterIcon,
    iconUrl: '/categories/disaster.png',
    color: 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:border-emerald-300',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    titleColor: 'text-emerald-700',
  },
  {
    id: 'startup',
    label: 'Startup Support',
    description: 'Empower ideas and help startups grow',
    icon: startupIcon,
    iconUrl: '/categories/startup.png',
    color: 'bg-purple-50/70 text-purple-800 border-purple-200 hover:border-purple-300',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    titleColor: 'text-purple-700',
  },
  {
    id: 'sports',
    label: 'Sports',
    description: 'Support athletes and encourage sporting dreams',
    icon: sportsIcon,
    iconUrl: '/categories/sports.png',
    color: 'bg-amber-50/70 text-amber-800 border-amber-200 hover:border-amber-300',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    titleColor: 'text-amber-700',
  },
  {
    id: 'animal',
    label: 'Animal Rescue',
    description: 'Rescue, shelter, and care for animals in need',
    icon: animalIcon,
    iconUrl: '/categories/animal.png',
    color: 'bg-orange-50/70 text-orange-900 border-orange-200 hover:border-orange-300',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    titleColor: 'text-orange-800',
  },
  {
    id: 'personal',
    label: 'Personal Recovery',
    description: 'Support recovery journeys and a better tomorrow',
    icon: personalIcon,
    iconUrl: '/categories/personal.png',
    color: 'bg-pink-50/70 text-pink-800 border-pink-200 hover:border-pink-300',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
    titleColor: 'text-pink-700',
  },
  {
    id: 'community',
    label: 'Community',
    description: 'Build stronger communities together',
    icon: communityIcon,
    iconUrl: '/categories/community.png',
    color: 'bg-teal-50/70 text-teal-800 border-teal-200 hover:border-teal-300',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    titleColor: 'text-teal-700',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Support unique causes and community needs',
    icon: otherIcon,
    iconUrl: '/categories/other.png',
    color: 'bg-gray-50/70 text-gray-800 border-gray-200 hover:border-gray-300',
    badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
    titleColor: 'text-gray-700',
  },
]

export const getCategoryById = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]

/**
 * Risk score styling
 */
export const getRiskLevel = (score) => {
  if (score <= 30)  return { label: 'Low Risk',    color: 'text-success-600 bg-success-50',  bar: 'bg-success-500' }
  if (score <= 70)  return { label: 'Medium Risk', color: 'text-warning-600 bg-warning-50',  bar: 'bg-warning-500' }
  return              { label: 'High Risk',   color: 'text-danger-600 bg-danger-50',    bar: 'bg-danger-500' }
}

/**
 * Donation preset amounts (INR)
 */
export const DONATION_PRESETS = [100, 500, 1000, 2000, 5000, 10000]

/**
 * Indian states for location select
 */
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
]
