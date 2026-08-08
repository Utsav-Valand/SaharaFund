import { useState, useEffect } from 'react'
import { HandCoins } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { EmptyState, ErrorState } from '../../components/common/StateComponents'
import { donationService } from '../../services/donationService'
import { formatCurrency, formatDateTime } from '../../utils/helpers'
import { Link } from 'react-router-dom'

export default function MyDonationsPage() {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalDonated, setTotalDonated] = useState(0)

  const fetchDonations = async () => {
    try {
      setLoading(true)
      const data = await donationService.getMyDonations()
      const list = data.donations || []
      setDonations(list)
      setTotalDonated(list.reduce((sum, d) => sum + d.amount, 0))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDonations() }, [])

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Donations</h1>
          {!loading && donations.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">
              {donations.length} donation{donations.length !== 1 ? 's' : ''} · Total: <strong className="text-primary-700">{formatCurrency(totalDonated)}</strong>
            </p>
          )}
        </div>

        {loading ? (
          <div className="card">
            <div className="space-y-0 divide-y divide-gray-50">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-4 p-4 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/5" />
                    <div className="h-3 bg-gray-200 rounded w-2/5" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDonations} />
        ) : donations.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="No donations yet"
            description="Find a cause that matters to you and make a difference."
            action={
              <Link to="/discover" className="btn-primary">
                Discover Campaigns
              </Link>
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map(d => (
                    <tr key={d._id}>
                      <td>
                        <Link to={`/campaign/${d.campaignId?._id}`} className="font-medium text-gray-900 hover:text-primary-700 transition-colors">
                          {d.campaignId?.title || 'Campaign'}
                        </Link>
                        {d.anonymous && <span className="ml-2 badge-gray text-xs">Anonymous</span>}
                        {d.message && <p className="text-xs text-gray-400 mt-0.5 italic truncate max-w-xs">"{d.message}"</p>}
                      </td>
                      <td className="font-bold text-green-600">{formatCurrency(d.amount)}</td>
                      <td className="text-sm capitalize">{d.paymentMethod || '—'}</td>
                      <td className="text-sm text-gray-500">{formatDateTime(d.createdAt)}</td>
                      <td>
                        <span className={`badge text-xs ${d.paymentStatus === 'SUCCESS' ? 'badge-success' : d.paymentStatus === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                          {d.paymentStatus || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
