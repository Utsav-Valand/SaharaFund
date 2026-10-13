import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import connectDB from './config/db.js'

// Import Route Handlers
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import campaignRoutes from './routes/campaignRoutes.js'
import donationRoutes from './routes/donationRoutes.js'
import fraudRoutes from './routes/fraudRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import payoutAccountRoutes from './routes/payoutAccountRoutes.js'
import verificationRoutes from './routes/verificationRoutes.js'
import payoutRoutes from './routes/payoutRoutes.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security & Logging Middleware
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(morgan('dev'))

/**
 * CRITICAL: Razorpay webhook requires the raw (unmodified) request body
 * to verify the HMAC signature. We capture rawBody BEFORE json parsing.
 *
 * The webhook route /api/payments/webhook uses express.raw() directly.
 * All other routes use express.json().
 */
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      // Store raw body for webhook signature verification
      req.rawBody = buf.toString('utf8')
    },
  })
)
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// CORS Configuration
const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((url) => url.trim()) : ['http://localhost:5173']),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

// Optional dedicated staging client origin
if (process.env.STAGING_CLIENT_URL) {
  allowedOrigins.push(process.env.STAGING_CLIENT_URL.trim())
}

app.use(
  cors({
    origin: (origin, callback) => {
      // In staging/test mode, safely allow Netlify deploy preview subdomains
      const isNetlifyPreview =
        process.env.PAYMENT_MODE !== 'live' &&
        typeof origin === 'string' &&
        /^https:\/\/deploy-preview-\d+--[\w-]+\.netlify\.app$/.test(origin)

      if (!origin || allowedOrigins.includes(origin) || isNetlifyPreview) {
        callback(null, true)
      } else {
        callback(new Error(`CORS policy blocked access from origin: ${origin}`))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)

// Base Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SaharaFund API',
    timestamp: new Date().toISOString(),
    paymentMode: process.env.PAYMENT_MODE || 'test',
    razorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    database: {
      status: 'configured',
    },
  })
})

// Mount API Route Endpoints
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/donations', donationRoutes)
app.use('/api/fraud', fraudRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/payout-accounts', payoutAccountRoutes)
app.use('/api/verification', verificationRoutes)
app.use('/api/payouts', payoutRoutes)

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found.`,
  })
})

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  // Never log sensitive values
  console.error('🔥 [API Error]:', err.message)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// Start server and initialize MongoDB connection
const startServer = async () => {
  console.log('🚀 Initializing SaharaFund Backend API...')

  const dbConnected = await connectDB()

  if (!dbConnected) {
    console.warn('⚠️  [Notice] Server started, but MongoDB is not connected.')
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('⚠️  [Payment] Razorpay not configured — running in MOCK mode only.')
    console.warn('   Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET for real payments.')
  } else {
    console.log(`✅ [Payment] Razorpay configured (${process.env.PAYMENT_MODE || 'test'} mode)`)
  }

  app.listen(PORT, () => {
    console.log(`🌐 [Server Running] http://localhost:${PORT}`)
    console.log(`📡 [API Health Check] http://localhost:${PORT}/api/health`)
  })
}

startServer()

export default app
