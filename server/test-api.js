import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from './models/User.js'
import Campaign from './models/Campaign.js'
import Donation from './models/Donation.js'
import FraudCheck from './models/FraudCheck.js'
import Notification from './models/Notification.js'
import { generateToken } from './utils/jwt.js'
import { assessCampaignRisk } from './utils/fraudDetector.js'

dotenv.config()

const runTests = async () => {
  console.log('🧪 ===============================================')
  console.log('🧪 Starting SaharaFund Backend Integration Tests...')
  console.log('🧪 ===============================================\n')

  let passedTests = 0
  let failedTests = 0

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`)
      passedTests++
    } else {
      console.error(`❌ FAIL: ${testName}`)
      failedTests++
    }
  }

  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'saharafund' })
    console.log('📌 [Setup] Connected to MongoDB Atlas for testing.')

    const testSuffix = Date.now().toString(36)
    const testOrganizerEmail = `organizer_${testSuffix}@saharafund.org`
    const testDonorEmail = `donor_${testSuffix}@saharafund.org`
    const testAdminEmail = `admin_${testSuffix}@saharafund.org`

    // Test 1: User Registration & Password Hashing
    console.log('\n--- 1. Testing Authentication & User Model ---')
    const passwordHash = await User.hashPassword('Secret@1234')
    const organizer = await User.create({
      name: 'Ravi Kumar',
      email: testOrganizerEmail,
      passwordHash,
      role: 'organizer',
      phone: '+91 9876543210',
      isVerified: true,
    })

    assert(organizer._id && organizer.email === testOrganizerEmail, 'Organizer User created successfully')
    assert(!organizer.toJSON().passwordHash, 'User.toJSON() securely excludes passwordHash')

    // Test 2: Password Verification
    const isPasswordValid = await organizer.comparePassword('Secret@1234')
    const isPasswordInvalid = await organizer.comparePassword('WrongPassword')
    assert(isPasswordValid && !isPasswordInvalid, 'User bcrypt password verification works correctly')

    // Test 3: JWT Generation & Verification
    const token = generateToken(organizer._id, organizer.role)
    assert(typeof token === 'string' && token.length > 20, 'JWT Token generated successfully')

    // Create Donor & Admin
    const donor = await User.create({
      name: 'Ananya Sharma',
      email: testDonorEmail,
      passwordHash,
      role: 'donor',
      isVerified: true,
    })

    const admin = await User.create({
      name: 'Super Admin',
      email: testAdminEmail,
      passwordHash,
      role: 'admin',
      isVerified: true,
    })

    // Test 4: Campaign Creation & Slug Generation
    console.log('\n--- 2. Testing Campaign Model & Lifecycle ---')
    const campaign = await Campaign.create({
      organizer: organizer._id,
      title: `Emergency Medical Fund for Heart Surgery ${testSuffix}`,
      description: 'Raising funds to support an urgent cardiovascular procedure in New Delhi for our family member.',
      category: 'medical',
      goalAmount: 500000,
      beneficiaryName: 'Sunil Kumar',
      beneficiaryRelation: 'Father',
      location: { city: 'New Delhi', state: 'Delhi', pincode: '110001' },
      isUrgent: true,
      status: 'active',
      verificationStatus: 'verified',
    })

    assert(campaign._id && campaign.slug.includes('emergency-medical-fund'), 'Campaign created with auto-generated slug')
    assert(campaign.progressPercentage === 0, 'Virtual progressPercentage initialized to 0%')

    // Test 5: Automated Fraud Risk Engine
    console.log('\n--- 3. Testing Fraud Detection Engine ---')
    const riskAssessment = assessCampaignRisk(campaign, organizer)
    assert(typeof riskAssessment.riskScore === 'number' && riskAssessment.riskLevel, 'Fraud risk assessment calculated numerical score and riskLevel')

    const fraudCheck = await FraudCheck.create({
      campaign: campaign._id,
      user: organizer._id,
      riskScore: riskAssessment.riskScore,
      riskLevel: riskAssessment.riskLevel,
      textRisk: riskAssessment.textRisk,
      identityRisk: riskAssessment.identityRisk,
      imageRisk: riskAssessment.imageRisk,
      checks: riskAssessment.checks,
      reasons: riskAssessment.reasons,
      status: 'approved',
    })
    assert(fraudCheck._id && fraudCheck.status === 'approved', 'FraudCheck record stored in database')

    // Test 6: Campaign Timeline Updates
    console.log('\n--- 4. Testing Campaign Updates ---')
    campaign.updates.push({
      title: 'Surgery Scheduled Successfully',
      content: 'The surgical team has confirmed the procedure date for next Monday. Thank you all!',
    })
    await campaign.save()
    assert(campaign.updates.length === 1 && campaign.updates[0].title.includes('Surgery'), 'Campaign timeline update appended')

    // Test 7: Donation Creation & Campaign Metric Sync
    console.log('\n--- 5. Testing Donations & Notification System ---')
    const donationAmount = 5000
    const donation = await Donation.create({
      campaign: campaign._id,
      donor: donor._id,
      amount: donationAmount,
      currency: 'INR',
      donorName: donor.name,
      donorEmail: donor.email,
      paymentStatus: 'completed',
      isAnonymous: false,
      comment: 'Wishing him a very speedy recovery! Stay strong.',
    })

    assert(donation._id && donation.receiptNumber.startsWith('REC-'), 'Donation created with auto-generated receiptNumber')

    // Update campaign metrics
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaign._id,
      { $inc: { raisedAmount: donationAmount, donorCount: 1 } },
      { new: true }
    )

    assert(updatedCampaign.raisedAmount === 5000, 'Campaign raisedAmount incremented accurately')
    assert(updatedCampaign.donorCount === 1, 'Campaign donorCount incremented accurately')
    assert(updatedCampaign.progressPercentage === 1, 'Virtual progressPercentage accurately calculates 1%')

    // Test 8: In-App Notification Delivery
    const notification = await Notification.create({
      recipient: organizer._id,
      type: 'donation_received',
      title: 'New Donation Received! 🎉',
      message: `${donor.name} donated ₹${donationAmount} to "${campaign.title}".`,
      relatedCampaign: campaign._id,
      relatedDonation: donation._id,
    })

    assert(notification._id && notification.isRead === false, 'In-app notification created for organizer')

    // Test notification read toggle
    notification.isRead = true
    await notification.save()
    assert(notification.isRead === true, 'Notification marked as read')

    // Cleanup test fixtures
    console.log('\n--- 6. Cleaning Up Test Fixtures ---')
    await User.deleteMany({ _id: { $in: [organizer._id, donor._id, admin._id] } })
    await Campaign.deleteMany({ _id: campaign._id })
    await Donation.deleteMany({ _id: donation._id })
    await FraudCheck.deleteMany({ _id: fraudCheck._id })
    await Notification.deleteMany({ _id: notification._id })
    console.log('🧹 Cleaned up temporary test documents.')

    console.log('\n===============================================')
    console.log(`📊 Test Summary: ${passedTests} Passed, ${failedTests} Failed`)
    console.log('===============================================\n')

    await mongoose.connection.close()
    process.exit(failedTests > 0 ? 1 : 0)
  } catch (error) {
    console.error('❌ Test Execution Error:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

runTests()
