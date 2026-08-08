import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { sanitizeMongoUri } from './config/db.js'

dotenv.config()

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection for SaharaFund...')
  
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in server/.env')
    console.log('👉 Create server/.env with your MongoDB Atlas connection string.')
    process.exit(1)
  }

  if (uri.includes('<username>') || uri.includes('<password>')) {
    console.error('❌ MONGODB_URI contains placeholder values (<username> or <password>).')
    console.log('👉 Replace them with your actual MongoDB Atlas database credentials.')
    process.exit(1)
  }

  console.log(`📡 Connecting to cluster: ${sanitizeMongoUri(uri)}`)

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'saharafund',
      serverSelectionTimeoutMS: 10000,
    })

    console.log('✅ Connection Successful!')
    console.log(`📌 Database Name: ${conn.connection.name}`)
    console.log(`📌 Host: ${conn.connection.host}`)
    console.log(`📌 Connection State: ${conn.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'}`)

    await mongoose.connection.close()
    console.log('🔒 Test connection cleanly closed.')
    process.exit(0)
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:')
    console.error(`   Error Code: ${error.code || 'N/A'}`)
    console.error(`   Error Message: ${error.message}`)
    
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('\n💡 Troubleshooting: Check your MongoDB Atlas Database Username and Password in server/.env.')
    } else if (error.message.includes('whitelist') || error.message.includes('IP') || error.message.includes('queryTxt ETIMEOUT') || error.name === 'MongooseServerSelectionError') {
      console.error('\n💡 Troubleshooting: Check your MongoDB Atlas Network Access whitelist. Ensure "0.0.0.0/0" (Allow from Anywhere) or your current IP is added.')
    }
    process.exit(1)
  }
}

testConnection()
