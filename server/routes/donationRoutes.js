import express from 'express'
import {
  createDonation,
  verifyPayment,
  getDonation,
  getMyDonations,
} from '../controllers/donationController.js'
import { protect, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/', optionalAuth, createDonation)
router.post('/verify', optionalAuth, verifyPayment)
router.get('/me', protect, getMyDonations)
router.get('/:id', getDonation)

export default router
