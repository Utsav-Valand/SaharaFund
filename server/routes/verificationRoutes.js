import express from 'express'
import {
  getMyVerificationStatus,
  submitVerification,
  getVerificationById,
  resubmitVerification,
} from '../controllers/verificationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/me', getMyVerificationStatus)
router.post('/', submitVerification)
router.get('/:id', getVerificationById)
router.post('/:id/resubmit', resubmitVerification)

export default router
