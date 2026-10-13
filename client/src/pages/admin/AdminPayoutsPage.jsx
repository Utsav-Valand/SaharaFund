import { useState, useEffect, useCallback } from 'react'
import {
  IndianRupee, CheckCircle2, XCircle, Clock, Loader2,
  RefreshCw, ChevronDown, ChevronUp, ArrowUpRight
} from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/ui/Modal'
import { adminService } from '../../services/adminService'
import { formatCurrency, formatDate } from '../../utils/helpers'
import Pagination from '../../components/common/Pagination'
import toast from 'react-hot-toast'

const PAYOUT_STATUS_CONFIG = {
  requested:    { label: 'Requested',    color: 'bg-blue-100 text-blue-800',    icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700',  icon: Loader2 },
  approved:     { label: 'Approved',     color: 'bg-teal-100 text-teal-700',    icon: CheckCircle2 },
  processing:   { label: 'Processing',   color: 'bg-indigo-100 text-indigo-700',icon: Loader2 },
  completed:    { label: 'Completed',    color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  rejected:     { label: 'Rejected',     color: 'bg-red-100 text-red-700',      icon: XCircle },
  failed:       { label: 'Failed',       color: 'bg-red-100 text-red-700',      icon: XCircle },
  reversed:     { label: 'Reversed',     color: 'bg-gray-100 text-gray-600',    icon: RefreshCw },
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
]

const AVAILABLE_ACTIONS = {
  requested:    ['approve', 'reject', 'under_review'],
  under_review: ['approve', 'reject', 'action_required'],
  approved:     ['mark_processing', 'reject'],
  processing:   ['mark_completed', 'mark_failed'],
  completed:    ['reverse'],
}

const ACTION_META = {
  approve:          { label: 'Approve',       color: 'border-green-400 bg-green-50 text-green-700' },
  reject:           { label: 'Reject',        color: 'border-red-400 bg-red-50 text-red-700' },
  under_review:     { label: 'Under Review',  color: 'border-amber-400 bg-amber-50 text-amber-700' },
  mark_processing:  { label: 'Mark Processing',color: 'border-indigo-400 bg-indigo-50 text-indigo-700'},
  mark_completed:   { label: 'Mark Completed',color: 'border-green-400 bg-green-50 text-green-700' },
  mark_failed:      { label: 'Mark Failed',   color: 'border-red-400 bg-red-50 text-red-700' },
  reverse:          { label: 'Reverse',       color: 'border-gray-400 bg-gray-50 text-gray-700' },
}

function StatusBadge({ status }) {
  const cfg = PAYOUT_STATUS_CONFIG[status] || PAYOUT_STATUS_CONFIG.requested
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5"/>
      {cfg.label}
    </span>
  )
}

function ReviewPayoutModal({ payout, open, onClose, onReviewed }) {
  const [action, setAction] = useState('')
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [manualRef, setManualRef] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) { setAction(''); setNotes(''); setRejectionReason(''); setManualRef('') }
  }, [open])

  const availableActions = AVAILABLE_ACTIONS[payout?.status] || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!action) { toast.error('Please select an action'); return }
    if (action === 'reject' && !rejectionReason.trim()) { toast.error('Rejection reason required'); return }
    setSubmitting(true)
    try {
      await adminService.reviewPayout(payout._id, { action, notes, rejectionReason, manualTransferReference: manualRef })
      toast.success(`Payout ${action.replace(/_/g,' ')} successfully.`)
      onReviewed()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!payout || !open) return null

  return (
    <Modal isOpen={open} onClose={onClose} title="Review Payout Request" size="md">
      <div className="space-y-5">
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{payout.user?.name}</p>
              <p className="text-xs text-gray-500">{payout.user?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{formatCurrency(payout.requestedAmount)}</p>
              <StatusBadge status={payout.status}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 pt-2 border-t border-gray-200">
            <div><span className="text-gray-400">Campaign</span><p className="truncate">{payout.campaign?.title}</p></div>
            <div><span className="text-gray-400">Requested</span><p>{formatDate(payout.requestedAt || payout.createdAt)}</p></div>
            <div><span className="text-gray-400">Bank</span><p>{payout.payoutAccount?.bankName} ···{payout.payoutAccount?.accountNumberLast4}</p></div>
            <div><span className="text-gray-400">IFSC</span><p>{payout.payoutAccount?.ifscCode}</p></div>
            {payout.payoutAccount?.upiId && <div className="col-span-2"><span className="text-gray-400">UPI ID</span><p>{payout.payoutAccount.upiId}</p></div>}
            {payout.notes && <div className="col-span-2"><span className="text-gray-400">Organizer Notes</span><p>{payout.notes}</p></div>}
          </div>
        </div>

        {availableActions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No actions available for this status.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label label-required">Action</label>
              <div className="grid grid-cols-2 gap-2">
                {availableActions.map(act => (
                  <button key={act} type="button" onClick={() => setAction(act)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border-2 transition-all text-center
                      ${action === act ? ACTION_META[act]?.color : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {ACTION_META[act]?.label || act}
                  </button>
                ))}
              </div>
            </div>

            {action === 'reject' && (
              <div>
                <label className="label label-required">Rejection Reason</label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                  className="input resize-none" rows={2} placeholder="Reason for rejection..." />
              </div>
            )}

            {(action === 'mark_completed' || action === 'mark_processing') && (
              <div>
                <label className="label">Transfer Reference (UTR / NEFT Ref)</label>
                <input value={manualRef} onChange={e => setManualRef(e.target.value)}
                  className="input" placeholder="e.g. NEFT-REF-123456" />
              </div>
            )}

            <div>
              <label className="label">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="input resize-none" rows={2} placeholder="Internal review notes..." />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancel</button>
              <button type="submit" className="btn-primary flex-1 gap-2" disabled={submitting || !action}>
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin"/>Saving...</> : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}

function PayoutRow({ payout, onReview }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
          <IndianRupee className="w-4 h-4 text-teal-600"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-semibold text-gray-900 text-sm">{formatCurrency(payout.requestedAmount)}</span>
            <StatusBadge status={payout.status}/>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {payout.user?.name} · {payout.campaign?.title} · {formatDate(payout.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onReview(payout)} className="btn-primary btn-sm">Review</button>
          <button onClick={() => setExpanded(e => !e)} className="btn-ghost btn-icon text-gray-400">
            {expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
          <div><span className="text-gray-400 block">Organizer</span>{payout.user?.email}</div>
          <div><span className="text-gray-400 block">Bank</span>{payout.payoutAccount?.bankName} ···{payout.payoutAccount?.accountNumberLast4}</div>
          <div><span className="text-gray-400 block">IFSC</span>{payout.payoutAccount?.ifscCode}</div>
          {payout.reviewedAt && <div><span className="text-gray-400 block">Reviewed</span>{formatDate(payout.reviewedAt)}</div>}
          {payout.manualTransferReference && <div className="col-span-2"><span className="text-gray-400 block">Transfer Ref</span><span className="font-mono">{payout.manualTransferReference}</span></div>}
          {payout.rejectionReason && <div className="col-span-2 text-red-600"><span className="text-red-400 block">Rejection</span>{payout.rejectionReason}</div>}
        </div>
      )}
    </div>
  )
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('requested')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reviewModal, setReviewModal] = useState(null)

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (statusFilter) params.status = statusFilter
      const data = await adminService.getPayouts(params)
      setPayouts(data.payouts || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payouts')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => { fetchPayouts() }, [fetchPayouts])

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payout Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Review and process campaign payout withdrawal requests</p>
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
                  <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/4"/><div className="h-3 bg-gray-100 rounded w-1/2"/></div>
                  <div className="w-16 h-8 bg-gray-100 rounded-lg"/>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3"/>
            <p className="text-gray-700 font-medium mb-3">{error}</p>
            <button onClick={fetchPayouts} className="btn-secondary btn-sm gap-1.5"><RefreshCw className="w-4 h-4"/>Retry</button>
          </div>
        ) : payouts.length === 0 ? (
          <div className="card p-10 text-center border-dashed">
            <ArrowUpRight className="w-10 h-10 text-gray-300 mx-auto mb-3"/>
            <p className="text-gray-500 font-medium">No payout requests found</p>
            <p className="text-xs text-gray-400 mt-1">Adjust filters or check back later</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map(p => <PayoutRow key={p._id} payout={p} onReview={setReviewModal}/>)}
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage}/>
          </div>
        )}
      </div>

      <ReviewPayoutModal
        payout={reviewModal}
        open={!!reviewModal}
        onClose={() => setReviewModal(null)}
        onReviewed={fetchPayouts}
      />
    </AdminLayout>
  )
}
