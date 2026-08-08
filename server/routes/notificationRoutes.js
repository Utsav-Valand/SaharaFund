import express from 'express'
import {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', getNotifications)
router.put('/read-all', markAllAsRead)
router.put('/:id/read', markNotificationAsRead)

export default router
