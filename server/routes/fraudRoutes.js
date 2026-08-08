import express from 'express'
import {
  createFraudCheck,
  getFraudQueue,
  getFraudCheck,
  reviewFraudCheck,
} from '../controllers/fraudController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// All fraud routes require admin authorization
router.use(protect, authorize('admin'))

router.post('/check', createFraudCheck)
router.get('/', getFraudQueue)
router.get('/:id', getFraudCheck)
router.put('/:id/review', reviewFraudCheck)

export default router
