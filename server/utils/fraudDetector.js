/**
 * Automated Fraud & Risk Assessment Engine for SaharaFund
 * Analyzes campaign content, financial goal, and user credibility to calculate a risk score (0-100).
 */
export const assessCampaignRisk = (campaign, user = {}) => {
  let riskScore = 0
  const reasons = []
  const checks = {
    suspiciousKeywords: false,
    unverifiedIdentity: false,
    duplicateImages: false,
    unrealisticGoal: false,
    rapidTransactions: false,
    details: {},
  }

  let textRisk = 0
  let identityRisk = 0
  let imageRisk = 0

  // 1. Text Analysis (Keyword heuristics)
  const content = `${campaign.title || ''} ${campaign.description || ''}`.toLowerCase()
  
  const highRiskSpamKeywords = [
    'guaranteed returns',
    'double your money',
    'crypto giveaway',
    'lottery',
    'ponzi',
    'free cash',
    'instant profit',
    'western union',
  ]

  const spamMatches = highRiskSpamKeywords.filter((kw) => content.includes(kw))
  if (spamMatches.length > 0) {
    textRisk += 45
    checks.suspiciousKeywords = true
    reasons.push(`Contains high-risk financial/scam keywords: ${spamMatches.join(', ')}`)
  }

  // Short description check
  if ((campaign.description || '').length < 100) {
    textRisk += 15
    reasons.push('Campaign description is unusually brief (< 100 characters).')
  }

  // 2. Financial Goal Assessment
  const goal = Number(campaign.goalAmount) || 0
  if (goal > 5000000) {
    // Over ₹50 Lakhs
    textRisk += 15
    checks.unrealisticGoal = true
    reasons.push('High goal amount exceeding ₹50,00,000 requires higher scrutiny.')
  }

  // 3. User Identity Credibility Check
  if (!user.isVerified) {
    identityRisk += 20
    checks.unverifiedIdentity = true
    reasons.push('Organizer has not completed phone/KYC identity verification.')
  }

  if (!user.phone) {
    identityRisk += 10
    reasons.push('No verified phone number linked to the organizer account.')
  }

  // 4. Image Quality / Default Check
  if (
    !campaign.coverImage ||
    campaign.coverImage.includes('unsplash') ||
    campaign.coverImage.includes('placeholder')
  ) {
    imageRisk += 10
    reasons.push('Generic or stock cover image used instead of authentic media.')
  }

  // Calculate composite weighted risk score
  riskScore = Math.min(Math.round(textRisk * 0.45 + identityRisk * 0.4 + imageRisk * 0.15), 100)

  let riskLevel = 'low'
  if (riskScore >= 75) {
    riskLevel = 'critical'
  } else if (riskScore >= 50) {
    riskLevel = 'high'
  } else if (riskScore >= 25) {
    riskLevel = 'medium'
  }

  return {
    riskScore,
    riskLevel,
    textRisk,
    identityRisk,
    imageRisk,
    checks,
    reasons,
  }
}
