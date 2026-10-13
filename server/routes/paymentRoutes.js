import express from 'express'
import {
  createPaymentOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  submitDirectTransfer,
  verifyDirectTransfer,
} from '../controllers/paymentController.js'
import { protect, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// ─── Razorpay checkout flow ───────────────────────────────────────────────────
// Step 1: Backend creates order, returns order ID to frontend
router.post('/create-order', optionalAuth, createPaymentOrder)

// Step 2: Frontend sends back payment result; backend verifies HMAC
router.post('/verify', optionalAuth, verifyRazorpayPayment)

// Async webhook from Razorpay (raw body — mounted separately in index.js)
router.post('/webhook', handleRazorpayWebhook)

// ─── Direct UPI / Bank Transfer ───────────────────────────────────────────────
router.post('/direct-transfer', protect, submitDirectTransfer)
router.patch('/direct-transfer/:id/verify', protect, verifyDirectTransfer)

export default router
