import express from 'express'
import {
  getMyPayouts,
  getPayoutBalance,
  requestPayout,
  getPayoutById,
} from '../controllers/payoutController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', getMyPayouts)
router.get('/balance', getPayoutBalance)
router.post('/', requestPayout)
router.get('/:id', getPayoutById)

export default router
