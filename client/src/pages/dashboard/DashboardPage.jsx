import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Megaphone, HandCoins, Eye, PlusCircle, ArrowRight, Activity } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { SkeletonDashboardStat } from '../../components/common/Skeleton'
import { campaignService } from '../../services/campaignService'
import { donationService } from '../../services/donationService'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatDate, campaignStatusConfig, getCategoryById } from '../../utils/helpers'
import ProgressBar from '../../components/ui/ProgressBar'

export default function DashboardPage() {
  const { user, isFundraiser } = useAuth()
  const [stats, setStats] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignsData, donationsData] = await Promise.all([
          isFundraiser ? campaignService.getMyCampaigns() : Promise.resolve({ campaigns: [] }),
          donationService.getMyDonations({ limit: 5 }),
        ])
        const myCampaigns = campaignsData.campaigns || []
        const myDonations = donationsData.donations || []

        setCampaigns(myCampaigns.slice(0, 3))
        setDonations(myDonations)

        setStats({
          totalRaised: myCampaigns.reduce((sum, c) => sum + (c.raisedAmount || 0), 0),
          activeCampaigns: myCampaigns.filter(c => c.campaignStatus === 'LIVE').length,
          totalDonors: myCampaigns.reduce((sum, c) => sum + (c.donorCount || 0), 0),
          totalDonated: myDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
        })
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isFundraiser])

  const STAT_CARDS = [
    isFundraiser && { icon: TrendingUp, label: 'Total Raised', value: formatCurrency(stats?.totalRaised || 0, true), color: 'bg-primary-50 text-primary-700', key: 'raised' },
    isFundraiser && { icon: Megaphone, label: 'Active Campaigns', value: stats?.activeCampaigns ?? '—', color: 'bg-accent-50 text-accent-700', key: 'active' },
    isFundraiser && { icon: Eye, label: 'Total Donors', value: (stats?.totalDonors || 0).toLocaleString(), color: 'bg-blue-50 text-blue-700', key: 'donors' },
    { icon: HandCoins, label: 'Total Donated', value: formatCurrency(stats?.totalDonated || 0, true), color: 'bg-green-50 text-green-700', key: 'donated' },
  ].filter(Boolean)

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your account.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            [1, 2, 3, 4].map(i => <SkeletonDashboardStat key={i} />)
          ) : (
            STAT_CARDS.map(card => (
              <div key={card.key} className="stat-card">
                <div className={`stat-icon ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Campaigns */}
          {isFundraiser && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">My Campaigns</h2>
                <Link to="/dashboard/campaigns" className="text-xs text-primary-700 hover:underline font-medium flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No campaigns yet</p>
                  <Link to="/create" className="btn-accent btn-sm gap-1.5">
                    <PlusCircle className="w-4 h-4" /> Start a Fundraiser
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(c => {
                    const statusCfg = campaignStatusConfig[c.campaignStatus]
                    const cat = getCategoryById(c.category)
                    return (
                      <Link
                        key={c._id}
                        to={`/campaign/${c._id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center p-1.5 flex-shrink-0 border border-gray-100">
                          <img src={cat.icon} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-700">{c.title}</p>
                          <ProgressBar raised={c.raisedAmount} goal={c.goalAmount} height="h-1" className="mt-1.5" />
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className={`badge text-xs ${statusCfg?.color || 'badge-gray'}`}>{statusCfg?.label}</span>
                        </div>
                      </Link>
                    )
                  })}
                  <Link to="/create" className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-primary-300 hover:text-primary-600 transition-colors">
                    <PlusCircle className="w-4 h-4" /> Start a new fundraiser
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Recent Donations Given */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Donations Given</h2>
              <Link to="/dashboard/donations" className="text-xs text-primary-700 hover:underline font-medium flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-8">
                <HandCoins className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">No donations yet</p>
                <Link to="/discover" className="btn-secondary btn-sm gap-1.5">
                  <Activity className="w-4 h-4" /> Discover Campaigns
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {donations.map(d => (
                  <div key={d._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <HandCoins className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {d.campaignId?.title || 'Campaign'}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(d.createdAt)}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600 flex-shrink-0">{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
