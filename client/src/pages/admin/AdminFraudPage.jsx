import { useState, useEffect } from 'react'
import { AlertTriangle, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { EmptyState, ErrorState } from '../../components/common/StateComponents'
import { adminService } from '../../services/adminService'
import { formatDate, getRiskLevel } from '../../utils/helpers'

export default function AdminFraudPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    adminService.getFraudQueue()
      .then(data => setItems(data.fraudChecks || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Fraud Review Queue</h1>
          <p className="text-gray-500 text-sm mt-1">Campaigns flagged by the automated risk assessment system</p>
        </div>

        {loading ? (
          <div className="card animate-pulse divide-y divide-gray-50">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50" />)}
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No fraud flags"
            description="The fraud detection system hasn't flagged any campaigns for review."
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Risk Score</th>
                    <th>Text Risk</th>
                    <th>Identity Risk</th>
                    <th>Image Risk</th>
                    <th>Flagged</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const riskLevel = getRiskLevel(item.riskScore)
                    return (
                      <tr key={item._id}>
                        <td>
                          <p className="font-medium text-gray-900 truncate max-w-xs">
                            {item.campaignId?.title || '—'}
                          </p>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${riskLevel.color}`}>
                              {item.riskScore}
                            </span>
                            <span className={`text-xs font-medium ${riskLevel.color}`}>{riskLevel.label}</span>
                          </div>
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${riskLevel.bar}`} style={{ width: `${item.riskScore}%` }} />
                          </div>
                        </td>
                        <td className="text-sm">{item.textRisk ?? '—'}</td>
                        <td className="text-sm">{item.identityRisk ?? '—'}</td>
                        <td className="text-sm">{item.imageRisk ?? '—'}</td>
                        <td className="text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                        <td>
                          <Link to={`/campaign/${item.campaignId?._id}`} target="_blank" className="btn-secondary btn-sm gap-1.5">
                            <Eye className="w-3.5 h-3.5" /> Review
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
