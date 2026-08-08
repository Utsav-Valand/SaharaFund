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

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security & Logging Middleware
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found.`,
  })
})

// Global Error Handler Middleware
app.use((err, req, res, next) => {
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

  app.listen(PORT, () => {
    console.log(`🌐 [Server Running] http://localhost:${PORT}`)
    console.log(`📡 [API Health Check] http://localhost:${PORT}/api/health`)
  })
}

startServer()

export default app
