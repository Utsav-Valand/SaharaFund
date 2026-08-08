import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Eye, Edit3, Pause, Trash2, MoreVertical, Megaphone } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { EmptyState, ErrorState } from '../../components/common/StateComponents'
import { campaignService } from '../../services/campaignService'
import { formatCurrency, formatDate, calcProgress, campaignStatusConfig, getCategoryById } from '../../utils/helpers'
import ProgressBar from '../../components/ui/ProgressBar'
import toast from 'react-hot-toast'

export default function MyCampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const data = await campaignService.getMyCampaigns()
      setCampaigns(data.campaigns || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCampaigns() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This cannot be undone.')) return
    try {
      await campaignService.deleteCampaign(id)
      setCampaigns(prev => prev.filter(c => c._id !== id))
      toast.success('Campaign deleted.')
    } catch {
      toast.error('Failed to delete campaign.')
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
            <p className="text-gray-500 text-sm mt-1">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link to="/create" className="btn-accent gap-2">
            <PlusCircle className="w-4 h-4" /> New Campaign
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="card h-32 animate-pulse bg-gray-100" />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCampaigns} />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Start your first fundraiser today and make a difference."
            action={
              <Link to="/create" className="btn-accent gap-2">
                <PlusCircle className="w-4 h-4" /> Start a Fundraiser
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {campaigns.map(c => {
              const statusCfg = campaignStatusConfig[c.campaignStatus]
              const cat = getCategoryById(c.category)
              const pct = calcProgress(c.raisedAmount, c.goalAmount)

              return (
                <div key={c._id} className="card p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Cover or Icon */}
                    <div className="w-full sm:w-32 h-28 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center p-2 border border-gray-100">
                      {c.coverImage ? (
                        <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <img src={cat.icon} alt={cat.label} className="w-12 h-12 object-contain" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{cat.label} · Created {formatDate(c.createdAt)}</p>
                        </div>
                        <span className={statusCfg.color}>{statusCfg.label}</span>
                      </div>

                      <div className="mb-3">
                        <ProgressBar raised={c.raisedAmount} goal={c.goalAmount} height="h-2" />
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                          <span>{formatCurrency(c.raisedAmount, true)} raised</span>
                          <span>{pct}% of {formatCurrency(c.goalAmount, true)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link to={`/campaign/${c._id}`} className="btn-secondary btn-sm gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        {['DRAFT', 'REJECTED'].includes(c.campaignStatus) && (
                          <Link to={`/dashboard/campaigns/${c._id}/edit`} className="btn-secondary btn-sm gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </Link>
                        )}
                        <Link to={`/dashboard/campaigns/${c._id}/updates`} className="btn-secondary btn-sm">
                          Post Update
                        </Link>
                        {['DRAFT', 'REJECTED'].includes(c.campaignStatus) && (
                          <button onClick={() => handleDelete(c._id)} className="btn-ghost btn-sm text-danger-600 hover:bg-danger-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
