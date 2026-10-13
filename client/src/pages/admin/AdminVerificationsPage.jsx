import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, AlertCircle,
  Loader2, RefreshCw, Search, User, ChevronDown, ChevronUp, Eye
} from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/ui/Modal'
import { adminService } from '../../services/adminService'
import { formatDate } from '../../utils/helpers'
import Pagination from '../../components/common/Pagination'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  submitted:      { label: 'Submitted',       color: 'bg-blue-100 text-blue-800',    icon: Clock },
  under_review:   { label: 'Under Review',    color: 'bg-amber-100 text-amber-700',  icon: Loader2 },
  verified:       { label: 'Verified',         color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  rejected:       { label: 'Rejected',         color: 'bg-red-100 text-red-700',      icon: XCircle },
  action_required:{ label: 'Action Required',  color: 'bg-orange-100 text-orange-700',icon: AlertCircle },
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
]

const TYPE_LABELS = {
  identity: 'Identity',
  bank_account: 'Bank Account',
  campaign_beneficiary: 'Campaign Beneficiary',
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

function ReviewModal({ verification, open, onClose, onReviewed }) {
  const [action, setAction] = useState('')
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) { setAction(''); setNotes(''); setRejectionReason('') }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!action) { toast.error('Please select an action'); return }
    if ((action === 'reject') && !rejectionReason.trim()) { toast.error('Rejection reason is required'); return }
    setSubmitting(true)
    try {
      await adminService.reviewVerification(verification._id, { action, notes, rejectionReason })
      toast.success(`Verification ${action === 'verify' ? 'approved' : action === 'reject' ? 'rejected' : 'updated'}.`)
      onReviewed()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!verification || !open) return null
  const d = verification.submittedData || {}

  return (
    <Modal isOpen={open} onClose={onClose} title="Review Verification Request" size="lg">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3 items-center">
          <StatusBadge status={verification.status} />
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {TYPE_LABELS[verification.verificationType] || verification.verificationType}
          </span>
          <span className="text-xs text-gray-400">Submitted {formatDate(verification.submittedAt)}</span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-400"/>
            <span className="font-semibold text-gray-800">{verification.user?.name || 'Unknown'}</span>
            <span className="text-gray-400">{verification.user?.email}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
            {d.legalName && <><span className="text-gray-400">Legal Name</span><span>{d.legalName}</span></>}
            {d.dateOfBirth && <><span className="text-gray-400">Date of Birth</span><span>{formatDate(d.dateOfBirth)}</span></>}
            {d.idDocumentType && <><span className="text-gray-400">Doc Type</span><span className="capitalize">{d.idDocumentType.replace('_',' ')}</span></>}
            {d.idDocumentReference && <><span className="text-gray-400">Doc Ref</span><span className="font-mono">{d.idDocumentReference}</span></>}
            {d.addressLine1 && <><span className="text-gray-400">Address</span><span>{d.addressLine1}{d.addressLine2?', '+d.addressLine2:''}</span></>}
            {d.city && <><span className="text-gray-400">City</span><span>{d.city}{d.state?', '+d.state:''} {d.pincode}</span></>}
            {d.purposeDetails && <><span className="text-gray-400 col-span-2">Purpose</span><span className="col-span-2">{d.purposeDetails}</span></>}
          </div>
          {verification.documentUrls?.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-400 mb-1">Documents</p>
              {verification.documentUrls.map((doc, i) => (
                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                  <Eye className="w-3 h-3"/>{doc.docType || `Document ${i+1}`}
                </a>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label label-required">Action</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'verify', label: 'Verify', color: 'border-green-400 bg-green-50 text-green-700' },
                { value: 'reject', label: 'Reject', color: 'border-red-400 bg-red-50 text-red-700' },
                { value: 'under_review', label: 'Under Review', color: 'border-amber-400 bg-amber-50 text-amber-700' },
                { value: 'action_required', label: 'Action Required', color: 'border-orange-400 bg-orange-50 text-orange-700' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setAction(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border-2 transition-all text-center
                    ${action === opt.value ? opt.color : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {action === 'reject' && (
            <div>
              <label className="label label-required">Rejection Reason</label>
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                className="input resize-none" rows={2} placeholder="Explain why the request is rejected..." />
            </div>
          )}

          <div>
            <label className="label">Review Notes (visible to user)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="input resize-none" rows={2} placeholder="Optional notes or instructions for the user..." />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 gap-2" disabled={submitting || !action}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin"/>Saving...</> : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

function VerificationRow({ verification, onReview }) {
  const [expanded, setExpanded] = useState(false)
  const d = verification.submittedData || {}

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-teal-600"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-semibold text-gray-900 text-sm">{verification.user?.name || 'Unknown'}</span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{TYPE_LABELS[verification.verificationType]}</span>
            <StatusBadge status={verification.status}/>
          </div>
          <p className="text-xs text-gray-500">{verification.user?.email} · {formatDate(verification.submittedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onReview(verification)}
            className="btn-primary btn-sm gap-1.5">
            Review
          </button>
          <button onClick={() => setExpanded(e => !e)} className="btn-ghost btn-icon text-gray-400" aria-label="Expand">
            {expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
          {d.legalName && <div><p className="text-gray-400">Legal Name</p><p>{d.legalName}</p></div>}
          {d.idDocumentType && <div><p className="text-gray-400">Document</p><p className="capitalize">{d.idDocumentType.replace('_',' ')}</p></div>}
          {d.city && <div><p className="text-gray-400">Location</p><p>{d.city}, {d.state}</p></div>}
          {verification.reviewer && <div><p className="text-gray-400">Reviewer</p><p>{verification.reviewer?.name || 'Admin'}</p></div>}
          {verification.reviewNotes && <div className="col-span-2 sm:col-span-3"><p className="text-gray-400">Review Notes</p><p>{verification.reviewNotes}</p></div>}
        </div>
      )}
    </div>
  )
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reviewModal, setReviewModal] = useState(null)

  const fetchVerifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter
      if (search) params.search = search
      const data = await adminService.getVerifications(params)
      setVerifications(data.verifications || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load verifications')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, search, page])

  useEffect(() => { fetchVerifications() }, [fetchVerifications])

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Verification Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Review KYC and bank account verification submissions from users</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input pl-9" placeholder="Search by name or email..." />
          </div>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className="input w-auto">
            <option value="">All Types</option>
            <option value="identity">Identity</option>
            <option value="bank_account">Bank Account</option>
            <option value="campaign_beneficiary">Campaign Beneficiary</option>
          </select>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 mb-5 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all
                ${statusFilter === tab.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-4 items-center">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl"/>
                  <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/3"/><div className="h-3 bg-gray-100 rounded w-1/2"/></div>
                  <div className="w-16 h-8 bg-gray-100 rounded-lg"/>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3"/>
            <p className="text-gray-700 font-medium mb-3">{error}</p>
            <button onClick={fetchVerifications} className="btn-secondary btn-sm gap-1.5"><RefreshCw className="w-4 h-4"/>Retry</button>
          </div>
        ) : verifications.length === 0 ? (
          <div className="card p-10 text-center border-dashed">
            <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3"/>
            <p className="text-gray-500 font-medium">No verification requests found</p>
            <p className="text-xs text-gray-400 mt-1">Adjust filters or check back later</p>
          </div>
        ) : (
          <div className="space-y-3">
            {verifications.map(v => (
              <VerificationRow key={v._id} verification={v} onReview={setReviewModal}/>
            ))}
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage}/>
          </div>
        )}
      </div>

      <ReviewModal
        verification={reviewModal}
        open={!!reviewModal}
        onClose={() => setReviewModal(null)}
        onReviewed={fetchVerifications}
      />
    </AdminLayout>
  )
}
