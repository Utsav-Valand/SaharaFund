import express from 'express'
import {
  getAdminCampaigns,
  approveCampaign,
  rejectCampaign,
  suspendCampaign,
  getUsers,
  updateUserRole,
  getReports,
  resolveReport,
  getAnalytics,
} from '../controllers/adminController.js'
import { getFraudQueue } from '../controllers/fraudController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// All admin routes are strictly guarded by protect and authorize('admin')
router.use(protect, authorize('admin'))

// Campaign moderation
router.get('/campaigns', getAdminCampaigns)
router.put('/campaigns/:id/approve', approveCampaign)
router.put('/campaigns/:id/reject', rejectCampaign)
router.put('/campaigns/:id/suspend', suspendCampaign)

// User moderation
router.get('/users', getUsers)
router.put('/users/:id/role', updateUserRole)

// Fraud & Reports
router.get('/fraud', getFraudQueue)
router.get('/reports', getReports)
router.put('/reports/:id', resolveReport)

// Analytics
router.get('/analytics', getAnalytics)

export default router
