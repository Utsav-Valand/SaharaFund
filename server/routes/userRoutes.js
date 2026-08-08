import express from 'express'
import {
  getProfile,
  updateProfile,
  updateAvatar,
  updateBankDetails,
  getUserById,
} from '../controllers/userController.js'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = express.Router()

router.get('/me', protect, getProfile)
router.put('/me', protect, updateProfile)
router.put('/me/avatar', protect, upload.single('avatar'), updateAvatar)
router.put('/me/bank', protect, updateBankDetails)
router.get('/:id', getUserById)

export default router
