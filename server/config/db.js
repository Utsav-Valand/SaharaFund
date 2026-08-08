import mongoose from 'mongoose'

/**
 * Sanitizes MongoDB connection string by masking user credentials for safe logging.
 * Never prints raw passwords or usernames in console output.
 */
export const sanitizeMongoUri = (uri) => {
  if (!uri) return 'UNDEFINED'
  return uri.replace(/\/\/(.*?)@/, '//****:****@')
}

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Validates MONGODB_URI presence and sets up connection lifecycle event listeners.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error('❌ [Database Error] MONGODB_URI is not defined in server/.env')
    console.error('👉 Please create a server/.env file and set MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/saharafund?retryWrites=true&w=majority')
    return false
  }

  if (uri.includes('<username>') || uri.includes('<password>')) {
    console.error('❌ [Database Error] MONGODB_URI contains placeholder values (<username> or <password>).')
    console.error('👉 Please replace them with your actual MongoDB Atlas database username and password.')
    return false
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'saharafund', // Enforce 'saharafund' database
      autoIndex: true,
      serverSelectionTimeoutMS: 8000, // Timeout after 8s if cluster unreachable
    })

    console.log(`✅ [MongoDB Connected] Host: ${conn.connection.host} | Database: ${conn.connection.name}`)
    return true
  } catch (error) {
    console.error('❌ [MongoDB Connection Error]:', error.message)
    console.error('🔒 Safe URI:', sanitizeMongoUri(uri))
    return false
  }
}

// Connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('⚠️ [MongoDB Runtime Error]:', err.message)
})

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ [MongoDB Disconnected] Lost connection to MongoDB cluster.')
})

mongoose.connection.on('reconnected', () => {
  console.log('🔄 [MongoDB Reconnected] Connection restored.')
})

// Graceful application shutdown
process.on('SIGINT', async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close()
    console.log('🛑 [MongoDB] Connection closed due to application termination.')
  }
  process.exit(0)
})

export default connectDB
