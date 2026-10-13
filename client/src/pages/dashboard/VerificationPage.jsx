import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, User, Building2, Megaphone,
  CheckCircle2, XCircle, Clock, AlertCircle,
  Upload, ChevronRight, Loader2, RefreshCw
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { verificationService } from '../../services/phase2Service'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  not_submitted:  { label: 'Not Submitted',  color: 'badge-gray',    icon: Clock },
  submitted:      { label: 'Submitted',      color: 'badge-warning', icon: Clock },
  under_review:   { label: 'Under Review',   color: 'badge bg-blue-100 text-blue-800', icon: Loader2 },
  verified:       { label: 'Verified',       color: 'badge-success', icon: CheckCircle2 },
  rejected:       { label: 'Rejected',       color: 'badge-danger',  icon: XCircle },
  action_required:{ label: 'Action Required',color: 'badge bg-orange-100 text-orange-800', icon: AlertCircle },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_submitted
  const Icon = cfg.icon
  return (
    <span className={`badge text-xs ${cfg.color} gap-1`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { key: 'not_submitted', label: 'Not Submitted' },
  { key: 'submitted',     label: 'Submitted' },
  { key: 'under_review',  label: 'Under Review' },
  { key: 'verified',      label: 'Verified' },
]

function VerificationTimeline({ status }) {
  const statusOrder = {
    not_submitted: 0, submitted: 1, under_review: 2,
    action_required: 2, rejected: 2, verified: 3
  }
  const currentIdx = statusOrder[status] ?? 0

  return (
    <div className="flex items-center gap-1 mt-3">
      {TIMELINE_STEPS.map((step, idx) => (
        <div key={step.key} className="flex items-center gap-1 flex-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
            idx <= currentIdx
              ? status === 'rejected' && idx === currentIdx
                ? 'bg-red-500 text-white'
                : 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-400'
          }`}>
            {idx < currentIdx ? '✓' : idx + 1}
          </div>
          {idx < TIMELINE_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 ${idx < currentIdx ? 'bg-primary-400' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Identity Verification Form ───────────────────────────────────────────────

function IdentityVerificationForm({ onSubmit, existing, loading }) {
  const [formData, setFormData] = useState({
    legalName: existing?.submittedData?.legalName || '',
    dateOfBirth: existing?.submittedData?.dateOfBirth?.slice(0, 10) || '',
    addressLine1: existing?.submittedData?.addressLine1 || '',
    city: existing?.submittedData?.city || '',
    state: existing?.submittedData?.state || '',
    pincode: existing?.submittedData?.pincode || '',
    idDocumentType: existing?.submittedData?.idDocumentType || 'pan',
    // IMPORTANT: only store last 4 / masked reference
    idDocumentReference: '',
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!formData.legalName.trim()) e.legalName = 'Legal name is required'
    if (!formData.dateOfBirth) e.dateOfBirth = 'Date of birth is required'
    if (!formData.addressLine1.trim()) e.addressLine1 = 'Address is required'
    if (!formData.city.trim()) e.city = 'City is required'
    if (!formData.state.trim()) e.state = 'State is required'
    if (!formData.pincode || !/^\d{6}$/.test(formData.pincode)) e.pincode = 'Valid 6-digit pincode required'
    if (!formData.idDocumentType) e.idDocumentType = 'Please select document type'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      verificationType: 'identity',
      submittedData: formData,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
        <p className="text-xs text-blue-700">
          🔒 <strong>Privacy Note:</strong> We only store minimal required information.
          Full Aadhaar numbers are never stored. Document reference stores only the last 4 digits.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label label-required">Legal Name</label>
          <input
            value={formData.legalName}
            onChange={e => setFormData(p => ({ ...p, legalName: e.target.value }))}
            className={`input ${errors.legalName ? 'input-error' : ''}`}
            placeholder="As per your ID document"
          />
          {errors.legalName && <p className="field-error">{errors.legalName}</p>}
        </div>
        <div>
          <label className="label label-required">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={e => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))}
            className={`input ${errors.dateOfBirth ? 'input-error' : ''}`}
            max={new Date().toISOString().slice(0, 10)}
          />
          {errors.dateOfBirth && <p className="field-error">{errors.dateOfBirth}</p>}
        </div>
      </div>

      <div>
        <label className="label label-required">Address Line 1</label>
        <input
          value={formData.addressLine1}
          onChange={e => setFormData(p => ({ ...p, addressLine1: e.target.value }))}
          className={`input ${errors.addressLine1 ? 'input-error' : ''}`}
          placeholder="House/Flat No., Street, Locality"
        />
        {errors.addressLine1 && <p className="field-error">{errors.addressLine1}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className="label label-required">City</label>
          <input
            value={formData.city}
            onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
            className={`input ${errors.city ? 'input-error' : ''}`}
          />
          {errors.city && <p className="field-error">{errors.city}</p>}
        </div>
        <div>
          <label className="label label-required">State</label>
          <input
            value={formData.state}
            onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
            className={`input ${errors.state ? 'input-error' : ''}`}
          />
          {errors.state && <p className="field-error">{errors.state}</p>}
        </div>
        <div>
          <label className="label label-required">Pincode</label>
          <input
            value={formData.pincode}
            onChange={e => setFormData(p => ({ ...p, pincode: e.target.value }))}
            className={`input ${errors.pincode ? 'input-error' : ''}`}
            placeholder="6 digits"
            maxLength={6}
          />
          {errors.pincode && <p className="field-error">{errors.pincode}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label label-required">ID Document Type</label>
          <select
            value={formData.idDocumentType}
            onChange={e => setFormData(p => ({ ...p, idDocumentType: e.target.value }))}
            className="select"
          >
            <option value="pan">PAN Card</option>
            <option value="passport">Passport</option>
            <option value="voter_id">Voter ID</option>
            <option value="driving_license">Driving License</option>
            <option value="aadhaar_masked">Aadhaar (masked)</option>
          </select>
        </div>
        <div>
          <label className="label">Last 4 digits of Document No.</label>
          <input
            value={formData.idDocumentReference}
            onChange={e => setFormData(p => ({ ...p, idDocumentReference: e.target.value.slice(-4) }))}
            className="input"
            placeholder="Last 4 digits only"
            maxLength={4}
          />
          <p className="field-hint">We never store full document numbers for security.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
        <p className="text-xs text-amber-700">
          📎 After submitting, our team will contact you for secure document verification.
          Do not share full Aadhaar numbers or passwords.
        </p>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Identity Verification'}
      </button>
    </form>
  )
}

// ─── Verification Card ────────────────────────────────────────────────────────

function VerificationCard({ icon: Icon, title, description, status, submittedAt, reviewNotes, rejectionReason, onExpand, expandable }) {
  const cfg = STATUS_CONFIG[status || 'not_submitted']
  const IconCfg = cfg.icon

  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          status === 'verified' ? 'bg-green-50' :
          status === 'rejected' ? 'bg-red-50' :
          status === 'action_required' ? 'bg-orange-50' :
          'bg-gray-50'
        }`}>
          <Icon className={`w-5 h-5 ${
            status === 'verified' ? 'text-green-600' :
            status === 'rejected' ? 'text-red-500' :
            status === 'action_required' ? 'text-orange-500' :
            'text-gray-400'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <StatusBadge status={status || 'not_submitted'} />
          </div>
          <p className="text-xs text-gray-500 mb-2">{description}</p>
          {submittedAt && (
            <p className="text-xs text-gray-400">Submitted: {formatDate(submittedAt)}</p>
          )}
          {(rejectionReason || reviewNotes) && (
            <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-700 font-medium">Admin Feedback:</p>
              <p className="text-xs text-red-600 mt-0.5">{rejectionReason || reviewNotes}</p>
            </div>
          )}
          <VerificationTimeline status={status || 'not_submitted'} />
        </div>
        {expandable && onExpand && (
          <button onClick={onExpand} className="btn-ghost btn-sm gap-1 text-primary-700 flex-shrink-0">
            {status === 'not_submitted' || status === 'rejected' || status === 'action_required' ? 'Submit' : 'View'}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VerificationPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await verificationService.getMyStatus()
      setData(res)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load verification status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const handleSubmitVerification = async (payload) => {
    setSubmitting(true)
    try {
      await verificationService.submit(payload)
      toast.success('Verification submitted! Our team will review it within 2-3 business days.')
      setActiveTab('overview')
      fetchStatus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit verification.')
    } finally {
      setSubmitting(false)
    }
  }

  const identityV = data?.verifications?.identity
  const bankV = data?.verifications?.bank_account
  const campaignVs = data?.verifications?.campaign_beneficiary || []

  const overallVerified = data?.user?.isVerified

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary-700" />
              Verification Center
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Verify your identity, bank account, and campaign details to build trust with donors.
            </p>
          </div>
          <button onClick={fetchStatus} className="btn-ghost btn-sm gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Overall Status Banner */}
        {!loading && (
          <div className={`rounded-2xl p-4 mb-6 flex items-center gap-4 ${overallVerified ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${overallVerified ? 'bg-green-100' : 'bg-amber-100'}`}>
              {overallVerified
                ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                : <AlertCircle className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <p className={`font-semibold text-sm ${overallVerified ? 'text-green-800' : 'text-amber-800'}`}>
                {overallVerified ? 'Account Verified' : 'Verification Pending'}
              </p>
              <p className={`text-xs mt-0.5 ${overallVerified ? 'text-green-600' : 'text-amber-600'}`}>
                {overallVerified
                  ? 'Your account is fully verified. Donors can trust your campaigns.'
                  : 'Complete verification to access all fundraising features and build donor trust.'}
              </p>
            </div>
            {data?.user?.kycStatus && (
              <div className="ml-auto">
                <StatusBadge status={data.user.kycStatus === 'verified' ? 'verified' : data.user.kycStatus === 'pending' ? 'under_review' : data.user.kycStatus} />
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-100 mb-6">
          <div className="flex gap-0" role="tablist">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'identity', label: 'Identity' },
              { id: 'bank', label: 'Bank Account' },
            ].map(tab => (
              <button
                key={tab.id}
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

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-11 h-11 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">{error}</p>
            <button onClick={fetchStatus} className="btn-secondary btn-sm mt-4">Try Again</button>
          </div>
        ) : (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>

            {/* ─── Overview Tab ─── */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <VerificationCard
                  icon={User}
                  title="Identity Verification"
                  description="Verify your legal name, address, and ID document."
                  status={identityV?.status}
                  submittedAt={identityV?.submittedAt}
                  reviewNotes={identityV?.reviewNotes}
                  rejectionReason={identityV?.rejectionReason}
                  expandable
                  onExpand={() => setActiveTab('identity')}
                />
                <VerificationCard
                  icon={Building2}
                  title="Bank Account Verification"
                  description="Verify your bank account to enable payouts from campaigns."
                  status={bankV?.status}
                  submittedAt={bankV?.submittedAt}
                  reviewNotes={bankV?.reviewNotes}
                  rejectionReason={bankV?.rejectionReason}
                  expandable
                  onExpand={() => setActiveTab('bank')}
                />
                {campaignVs.length > 0 && campaignVs.map(cv => (
                  <VerificationCard
                    key={cv._id}
                    icon={Megaphone}
                    title={`Campaign Verification — ${cv.campaign?.title || 'Campaign'}`}
                    description="Beneficiary and campaign purpose verification."
                    status={cv.status}
                    submittedAt={cv.submittedAt}
                    reviewNotes={cv.reviewNotes}
                    rejectionReason={cv.rejectionReason}
                  />
                ))}
                {campaignVs.length === 0 && (
                  <div className="card p-5 border-dashed">
                    <div className="flex items-center gap-3 text-gray-400">
                      <Megaphone className="w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium">Campaign Verification</p>
                        <p className="text-xs">Submit from your campaign page when required.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── Identity Tab ─── */}
            {activeTab === 'identity' && (
              <div>
                {identityV?.status === 'verified' ? (
                  <div className="card p-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-1">Identity Verified</h3>
                    <p className="text-sm text-gray-500">Verified on {formatDate(identityV.reviewedAt)}</p>
                  </div>
                ) : identityV?.status === 'submitted' || identityV?.status === 'under_review' ? (
                  <div className="card p-6 text-center">
                    <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-1">Verification Under Review</h3>
                    <p className="text-sm text-gray-500">
                      Submitted on {formatDate(identityV.submittedAt)}. Review takes 2-3 business days.
                    </p>
                  </div>
                ) : (
                  <div className="card p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Submit Identity Verification</h2>
                    <p className="text-sm text-gray-500 mb-5">
                      Provide your legal name, address, and a reference to your government ID.
                    </p>
                    <IdentityVerificationForm
                      onSubmit={handleSubmitVerification}
                      existing={identityV}
                      loading={submitting}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ─── Bank Tab ─── */}
            {activeTab === 'bank' && (
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Bank Account Verification</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Add your bank account in <strong>Bank &amp; Payout</strong> section first, then submit a verification request here.
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-700">
                    👉 Go to <strong>Bank &amp; Payout</strong> from the sidebar to add your bank account details.
                    Once added, verification requests will appear here.
                  </p>
                </div>
                {bankV ? (
                  <div className="mt-4 card p-4">
                    <StatusBadge status={bankV.status} />
                    <p className="text-sm text-gray-600 mt-2">
                      {bankV.status === 'verified'
                        ? 'Your bank account is verified.'
                        : `Submitted ${formatDate(bankV.submittedAt)} — Review pending.`}
                    </p>
                    {bankV.rejectionReason && (
                      <p className="text-xs text-red-600 mt-2">Rejection reason: {bankV.rejectionReason}</p>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
