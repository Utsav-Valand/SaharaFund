import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, CheckCircle, XCircle, Pause, Eye, SlidersHorizontal,
  AlertTriangle, ChevronDown
} from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import { EmptyState, ErrorState } from '../../components/common/StateComponents'
import Modal from '../../components/ui/Modal'
import { adminService } from '../../services/adminService'
import { formatCurrency, formatDate, campaignStatusConfig, getCategoryById } from '../../utils/helpers'
import Pagination from '../../components/common/Pagination'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'ADMIN_REVIEW', label: 'Pending Review' },
  { value: 'FRAUD_CHECK', label: 'Fraud Check' },
  { value: 'LIVE', label: 'Live' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ADMIN_REVIEW')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionModal, setActionModal] = useState(null) // { type: 'approve'|'reject'|'suspend', campaign }
  const [rejectReason, setRejectReason] = useState('')
  const [actioning, setActioning] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminService.getCampaigns({ status: statusFilter, q: search, page, limit: 15 })
      setCampaigns(data.campaigns || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const handleAction = async () => {
    if (!actionModal) return
    setActioning(true)
    try {
      if (actionModal.type === 'approve') {
        await adminService.approveCampaign(actionModal.campaign._id)
        toast.success(`Campaign approved — now LIVE!`)
      } else if (actionModal.type === 'reject') {
        if (!rejectReason.trim()) { toast.error('Please provide a rejection reason.'); setActioning(false); return }
        await adminService.rejectCampaign(actionModal.campaign._id, rejectReason)
        toast.success('Campaign rejected.')
      } else if (actionModal.type === 'suspend') {
        await adminService.suspendCampaign(actionModal.campaign._id, rejectReason)
        toast.success('Campaign suspended.')
      }
      setActionModal(null)
      setRejectReason('')
      fetchCampaigns()
    } catch {
      toast.error('Action failed. Please try again.')
    } finally {
      setActioning(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review, approve, reject, and monitor campaigns</p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'bg-primary-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search campaigns..." className="input pl-9"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="card">
            <div className="animate-pulse divide-y divide-gray-50">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 p-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/5" />
                    <div className="h-3 bg-gray-200 rounded w-2/5" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCampaigns} />
        ) : campaigns.length === 0 ? (
          <EmptyState title="No campaigns found" description="No campaigns match your current filter." />
        ) : (
          <>
            <div className="card overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Organizer</th>
                      <th>Goal</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(c => {
                      const statusCfg = campaignStatusConfig[c.campaignStatus]
                      const cat = getCategoryById(c.category)
                      return (
                        <tr key={c._id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <img src={cat.icon} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                              <div>
                                <p className="font-medium text-gray-900 truncate max-w-xs">{c.title}</p>
                                <p className="text-xs text-gray-400">{c.location}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="text-sm">{c.organizerId?.name}</p>
                            <p className="text-xs text-gray-400">{c.organizerId?.email}</p>
                          </td>
                          <td className="font-semibold">{formatCurrency(c.goalAmount, true)}</td>
                          <td><span className={statusCfg.color}>{statusCfg.label}</span></td>
                          <td className="text-sm text-gray-500">{formatDate(c.createdAt)}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              <Link to={`/campaign/${c._id}`} target="_blank" className="btn-ghost btn-sm btn-icon" title="View campaign">
                                <Eye className="w-4 h-4" />
                              </Link>
                              {c.campaignStatus === 'ADMIN_REVIEW' && (
                                <>
                                  <button onClick={() => setActionModal({ type: 'approve', campaign: c })}
                                    className="btn-sm bg-success-50 text-success-700 hover:bg-success-100 rounded-lg px-3 py-1.5 gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button onClick={() => setActionModal({ type: 'reject', campaign: c })}
                                    className="btn-sm bg-danger-50 text-danger-700 hover:bg-danger-100 rounded-lg px-3 py-1.5 gap-1">
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </>
                              )}
                              {c.campaignStatus === 'LIVE' && (
                                <button onClick={() => setActionModal({ type: 'suspend', campaign: c })}
                                  className="btn-sm bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg px-3 py-1.5 gap-1">
                                  <Pause className="w-3.5 h-3.5" /> Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setRejectReason('') }}
        title={
          actionModal?.type === 'approve' ? '✅ Approve Campaign' :
          actionModal?.type === 'reject' ? '❌ Reject Campaign' :
          '⚠️ Suspend Campaign'
        }
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            {actionModal?.type === 'approve'
              ? `Approving "${actionModal?.campaign?.title}" will make it LIVE and visible to donors.`
              : `You are about to ${actionModal?.type} "${actionModal?.campaign?.title}". This will notify the campaign organizer.`
            }
          </p>
          {actionModal?.type !== 'approve' && (
            <div className="mb-4">
              <label className="label label-required">
                {actionModal?.type === 'reject' ? 'Rejection Reason' : 'Suspension Reason'}
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="input resize-none"
                rows={3}
                placeholder="Explain why this campaign is being rejected or suspended..."
              />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setActionModal(null); setRejectReason('') }} className="btn-secondary btn-sm" disabled={actioning}>
              Cancel
            </button>
            <button onClick={handleAction} disabled={actioning} className={`btn-sm ${
              actionModal?.type === 'approve' ? 'btn-primary' : 'btn-danger'
            }`}>
              {actioning ? 'Processing...' : actionModal?.type === 'approve' ? 'Approve & Go Live' : actionModal?.type === 'reject' ? 'Reject Campaign' : 'Suspend Campaign'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
