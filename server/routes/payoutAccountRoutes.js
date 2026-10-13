import express from 'express'
import {
  getMyPayoutAccounts,
  addPayoutAccount,
  updatePayoutAccount,
  deletePayoutAccount,
} from '../controllers/payoutAccountController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', getMyPayoutAccounts)
router.post('/', addPayoutAccount)
router.patch('/:id', updatePayoutAccount)
router.delete('/:id', deletePayoutAccount)

export default router
