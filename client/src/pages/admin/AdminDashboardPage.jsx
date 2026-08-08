import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Megaphone, AlertTriangle, HandCoins, TrendingUp, Activity,
  CheckCircle, XCircle, Clock, BarChart2, ArrowRight, Shield
} from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminService } from '../../services/adminService'
import { formatCurrency, formatDate, campaignStatusConfig } from '../../utils/helpers'
import { SkeletonDashboardStat } from '../../components/common/Skeleton'

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null)
  const [pendingCampaigns, setPendingCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsData, campaignsData] = await Promise.all([
          adminService.getAnalytics(),
          adminService.getCampaigns({ status: 'ADMIN_REVIEW', limit: 5 }),
        ])
        setAnalytics(analyticsData)
        setPendingCampaigns(campaignsData.campaigns || [])
      } catch (err) {
        console.error('Admin dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const STAT_CARDS = [
    { icon: TrendingUp, label: 'Total Raised', value: formatCurrency(analytics?.totalRaised || 0, true), color: 'bg-primary-900 text-primary-400', change: 'All time' },
    { icon: Megaphone, label: 'Live Campaigns', value: analytics?.liveCampaigns ?? '—', color: 'bg-green-900 text-green-400', change: 'Currently active' },
    { icon: Clock, label: 'Pending Review', value: analytics?.pendingReview ?? '—', color: 'bg-amber-900 text-amber-400', change: 'Needs attention' },
    { icon: Users, label: 'Total Users', value: (analytics?.totalUsers || 0).toLocaleString(), color: 'bg-blue-900 text-blue-400', change: 'Registered users' },
    { icon: HandCoins, label: 'Total Donations', value: (analytics?.totalDonations || 0).toLocaleString(), color: 'bg-purple-900 text-purple-400', change: 'All time count' },
    { icon: AlertTriangle, label: 'Fraud Flags', value: analytics?.fraudFlags ?? '—', color: 'bg-red-900 text-red-400', change: 'Needs review' },
  ]

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500 text-sm">Platform overview and pending actions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => <SkeletonDashboardStat key={i} />)
          ) : (
            STAT_CARDS.map(card => (
              <div key={card.label} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{card.value}</p>
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.change}</p>
              </div>
            ))
          )}
        </div>

        {/* Pending Review Queue */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Campaigns Pending Review
            </h2>
            <Link to="/admin/campaigns" className="text-xs text-primary-700 hover:underline font-medium flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : pendingCampaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-success-400" />
              <p className="text-sm">All caught up — no campaigns pending review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCampaigns.map(c => {
                const statusCfg = campaignStatusConfig[c.campaignStatus]
                return (
                  <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-400">
                        {c.organizerId?.name} · {formatDate(c.createdAt)} · Goal: {formatCurrency(c.goalAmount, true)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={statusCfg.color}>{statusCfg.label}</span>
                      <Link to={`/admin/campaigns`} className="btn-primary btn-sm">Review</Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
