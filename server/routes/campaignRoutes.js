import express from 'express'
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  submitCampaign,
  uploadCoverImage,
  getUpdates,
  postUpdate,
  getMyCampaigns,
  reportCampaign,
  getCampaignAnalytics,
} from '../controllers/campaignController.js'
import { getCampaignDonations } from '../controllers/donationController.js'
import { protect, optionalAuth, authorize } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = express.Router()

// Public campaign listings and user's own list
router.get('/', getCampaigns)
router.get('/me', protect, getMyCampaigns)

// Campaign CRUD & Lifecycle
router.post('/', protect, authorize('organizer', 'fundraiser', 'admin'), createCampaign)
router.get('/:id', getCampaignById)
router.put('/:id', protect, updateCampaign)
router.delete('/:id', protect, deleteCampaign)
router.post('/:id/submit', protect, submitCampaign)

// Media & Updates
router.post('/:id/cover', protect, upload.single('cover'), uploadCoverImage)
router.get('/:id/updates', getUpdates)
router.post('/:id/updates', protect, postUpdate)

// Donations, Reports & Analytics
router.get('/:id/donations', getCampaignDonations)
router.post('/:id/report', optionalAuth, reportCampaign)
router.get('/:id/analytics', protect, getCampaignAnalytics)

export default router
