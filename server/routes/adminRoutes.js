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
  // Phase 2
  getAdminVerifications,
  reviewVerification,
  getAdminPayouts,
  reviewPayoutRequest,
  getAdminDonations,
  getAuditLog,
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

// ─── Phase 2: Verification Management ────────────────────────────────────────
router.get('/verifications', getAdminVerifications)
router.patch('/verifications/:id', reviewVerification)

// ─── Phase 2: Payout Management ───────────────────────────────────────────────
router.get('/payouts', getAdminPayouts)
router.patch('/payouts/:id', reviewPayoutRequest)

// ─── Phase 2: Donations Overview ─────────────────────────────────────────────
router.get('/donations', getAdminDonations)

// ─── Phase 2: Audit Log ───────────────────────────────────────────────────────
router.get('/audit-log', getAuditLog)

export default router
