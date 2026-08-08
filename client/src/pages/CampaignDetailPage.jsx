import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Users, Calendar, Share2, Flag, CheckCircle2, ChevronRight,
  Heart, ArrowLeft, Loader2, Clock, ExternalLink, Copy
} from 'lucide-react'
import PublicLayout from '../components/layout/PublicLayout'
import { SkeletonCampaignDetail } from '../components/common/Skeleton'
import { ErrorState } from '../components/common/StateComponents'
import ProgressBar from '../components/ui/ProgressBar'
import Avatar from '../components/ui/Avatar'
import Modal, { ConfirmModal } from '../components/ui/Modal'
import DonationForm from '../components/campaign/DonationForm'
import { campaignService } from '../services/campaignService'
import { donationService } from '../services/donationService'
import {
  formatCurrency, calcProgress, formatDate, formatRelativeDate,
  formatDateTime, getCategoryById, campaignStatusConfig
} from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function CampaignDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [campaign, setCampaign] = useState(null)
  const [updates, setUpdates] = useState([])
  const [recentDonations, setRecentDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('story')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [campaignData, updatesData, donationsData] = await Promise.all([
          campaignService.getCampaign(id),
          campaignService.getUpdates(id).catch(() => ({ updates: [] })),
          campaignService.getCampaignDonations(id, { limit: 5 }).catch(() => ({ donations: [] })),
        ])
        setCampaign(campaignData.campaign)
        setUpdates(updatesData.updates || [])
        setRecentDonations(donationsData.donations || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Campaign not found')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Support: ${campaign?.title}`)
    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    }
    if (links[platform]) window.open(links[platform], '_blank', 'noopener')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
    setShareOpen(false)
  }

  if (loading) return <PublicLayout><div className="container-xl py-10"><SkeletonCampaignDetail /></div></PublicLayout>
  if (error || !campaign) return (
    <PublicLayout>
      <div className="container-xl py-20">
        <ErrorState message={error} onRetry={() => navigate(0)} />
        <div className="text-center mt-4">
          <Link to="/discover" className="btn-secondary btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Discover
          </Link>
        </div>
      </div>
    </PublicLayout>
  )

  const pct = calcProgress(campaign.raisedAmount, campaign.goalAmount)
  const cat = getCategoryById(campaign.category)
  const statusCfg = campaignStatusConfig[campaign.campaignStatus]
  const isLive = campaign.campaignStatus === 'LIVE'

  return (
    <PublicLayout>
      <div className="container-xl py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary-700 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/discover" className="hover:text-primary-700 transition-colors">Discover</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 truncate max-w-xs">{campaign.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== LEFT COLUMN ===== */}
          <div className="lg:col-span-2">
            {/* Cover Image */}
            <div className="relative rounded-3xl overflow-hidden aspect-video bg-gray-100 mb-6">
              {campaign.coverImage ? (
                <img
                  src={campaign.coverImage}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <img src={cat.icon} alt={cat.label} className="w-24 h-24 object-contain" />
                </div>
              )}
            </div>

            {/* Title + Meta */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`badge text-xs border flex items-center gap-1.5 ${cat.badgeColor || cat.color}`}>
                  <img src={cat.icon} alt="" className="w-4 h-4 object-contain" />
                  <span>{cat.label}</span>
                </span>
                <span className={statusCfg.color}>{statusCfg.label}</span>
                {campaign.verificationStatus === 'VERIFIED' && (
                  <span className="badge bg-green-50 text-green-700 border border-green-100">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{campaign.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Avatar name={campaign.organizerId?.name} src={campaign.organizerId?.profileImage} size="xs" />
                  <span>
                    by <span className="font-medium text-gray-700">{campaign.organizerId?.name || 'Anonymous'}</span>
                  </span>
                </div>
                {campaign.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{campaign.location}</span>
                  </div>
                )}
                {campaign.deadline && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Ends {formatRelativeDate(campaign.deadline)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Started {formatDate(campaign.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-100 mb-6">
              <div className="flex gap-0" role="tablist">
                {[
                  { id: 'story', label: 'Story' },
                  { id: 'updates', label: `Updates (${updates.length})` },
                  { id: 'donors', label: `Donors (${campaign.donorCount || 0})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      activeTab === tab.id
                        ? 'border-primary-700 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'story' && (
              <motion.div
                key="story"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: campaign.description?.replace(/\n/g, '<br/>') || '<p>No description provided.</p>' }}
              />
            )}

            {activeTab === 'updates' && (
              <motion.div key="updates" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {updates.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No updates posted yet.</p>
                ) : (
                  <div className="space-y-4">
                    {updates.map(update => (
                      <div key={update._id} className="card p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge-primary text-xs">{formatDate(update.createdAt)}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{update.title}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{update.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'donors' && (
              <motion.div key="donors" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {recentDonations.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No donations yet. Be the first!</p>
                ) : (
                  <div className="space-y-3">
                    {recentDonations.map(donation => (
                      <div key={donation._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <Avatar name={donation.anonymous ? 'Anonymous' : donation.donorId?.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {donation.anonymous ? 'Anonymous Donor' : donation.donorId?.name}
                          </p>
                          {donation.message && (
                            <p className="text-xs text-gray-500 truncate">"{donation.message}"</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-primary-700">{formatCurrency(donation.amount)}</p>
                          <p className="text-xs text-gray-400">{formatRelativeDate(donation.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
              <button onClick={() => setShareOpen(true)} className="btn-secondary btn-sm gap-2">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button onClick={() => setReportOpen(true)} className="btn-ghost btn-sm gap-2 text-gray-400 hover:text-danger-600">
                <Flag className="w-4 h-4" /> Report
              </button>
            </div>
          </div>

          {/* ===== RIGHT COLUMN — Donation Sidebar ===== */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              {/* Progress */}
              <div className="mb-5">
                <div className="flex items-end justify-between mb-1">
                  <span className="text-2xl font-extrabold text-gray-900">{formatCurrency(campaign.raisedAmount, true)}</span>
                  <span className="text-sm font-medium text-primary-700">{pct}% funded</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">raised of {formatCurrency(campaign.goalAmount, true)} goal</p>
                <ProgressBar raised={campaign.raisedAmount} goal={campaign.goalAmount} height="h-3" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{(campaign.donorCount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> Donors
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {campaign.deadline ? formatRelativeDate(campaign.deadline) : '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Deadline
                  </p>
                </div>
              </div>

              {/* Donate Button */}
              {isLive ? (
                <button
                  onClick={() => isAuthenticated ? setDonateOpen(true) : navigate('/login?next=' + encodeURIComponent(window.location.pathname))}
                  className="btn-accent w-full btn-lg gap-2 text-base mb-3"
                  id="donate-now-btn"
                >
                  <Heart className="w-5 h-5" fill="currentColor" />
                  Donate Now
                </button>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center mb-3">
                  <p className="text-sm text-gray-500">
                    {statusCfg.description}
                  </p>
                </div>
              )}

              <button onClick={() => setShareOpen(true)} className="btn-secondary w-full gap-2">
                <Share2 className="w-4 h-4" /> Share this Fundraiser
              </button>

              {/* Organizer */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Organized by</p>
                <div className="flex items-center gap-3">
                  <Avatar name={campaign.organizerId?.name} src={campaign.organizerId?.profileImage} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{campaign.organizerId?.name || 'Anonymous'}</p>
                    {campaign.organizerId?.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {campaign.organizerId.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Safety Note */}
              <div className="mt-4 p-3 rounded-xl bg-primary-50 border border-primary-100">
                <p className="text-xs text-primary-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>SaharaFund verifies campaigns to ensure your donation reaches genuine beneficiaries.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Modal isOpen={shareOpen} onClose={() => setShareOpen(false)} title="Share this Fundraiser" size="sm">
        <div className="p-6 space-y-3">
          {[
            { label: 'Share on Facebook', color: 'bg-[#1877F2] text-white hover:bg-[#166FE5]', platform: 'facebook',
              svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
            { label: 'Share on Twitter / X', color: 'bg-gray-900 text-white hover:bg-black', platform: 'twitter',
              svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
            { label: 'Share on WhatsApp', color: 'bg-[#25D366] text-white hover:bg-[#20BC5C]', platform: 'whatsapp',
              svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> },
          ].map(({ label, color, platform, svg }) => (
            <button key={platform} onClick={() => handleShare(platform)} className={`btn w-full justify-start gap-3 ${color}`}>
              {svg} {label}
            </button>
          ))}
          <div className="divider" />
          <button onClick={handleCopyLink} className="btn-secondary w-full gap-3 justify-start">
            <Copy className="w-5 h-5" /> Copy Link
          </button>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Report Campaign" size="sm">
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            If you believe this campaign is fraudulent or violates our policies, please report it. Our team will review your report within 24 hours.
          </p>
          <ReportForm campaignId={id} onClose={() => setReportOpen(false)} />
        </div>
      </Modal>

      {/* Donate Modal */}
      <Modal isOpen={donateOpen} onClose={() => setDonateOpen(false)} title={`Donate to: ${campaign?.title}`} size="md">
        <DonationForm campaign={campaign} onClose={() => setDonateOpen(false)} />
      </Modal>
    </PublicLayout>
  )
}

function ReportForm({ campaignId, onClose }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const REASONS = [
    'Fraudulent campaign', 'Misleading information', 'Duplicate campaign',
    'Violates terms of service', 'Personal attack or harassment', 'Other',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await campaignService.reportCampaign(campaignId, { reason, description })
      toast.success('Report submitted. Our team will review it shortly.')
      onClose()
    } catch {
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label label-required">Reason</label>
        <select value={reason} onChange={e => setReason(e.target.value)} className="select" required>
          <option value="">Select a reason</option>
          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Additional Details</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="input resize-none"
          rows={3}
          placeholder="Provide more context about your concern..."
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onClose} className="btn-secondary btn-sm" disabled={submitting}>Cancel</button>
        <button type="submit" className="btn-danger btn-sm" disabled={!reason || submitting}>
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </form>
  )
}
