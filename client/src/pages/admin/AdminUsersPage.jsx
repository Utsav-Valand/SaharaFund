import { useState, useEffect } from 'react'
import { Users, Shield, ShieldOff } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import { EmptyState, ErrorState } from '../../components/common/StateComponents'
import { adminService } from '../../services/adminService'
import { formatDate } from '../../utils/helpers'
import Avatar from '../../components/ui/Avatar'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await adminService.getUsers({ q: search })
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const ROLE_COLORS = {
    admin: 'badge bg-purple-100 text-purple-800',
    fundraiser: 'badge-primary',
    donor: 'badge-gray',
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-500 text-sm mt-1">Manage platform users and their roles</p>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by name or email..."
            className="input max-w-sm"
          />
        </div>

        {loading ? (
          <div className="card animate-pulse divide-y divide-gray-50">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-50" />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsers} />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Verified</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} src={u.profileImage} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={ROLE_COLORS[u.role] || 'badge-gray'}>{u.role}</span>
                      </td>
                      <td className="text-sm">{u.phone || '—'}</td>
                      <td>
                        {u.isVerified ? (
                          <span className="flex items-center gap-1 text-success-600 text-xs font-medium">
                            <Shield className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <ShieldOff className="w-3.5 h-3.5" /> Unverified
                          </span>
                        )}
                      </td>
                      <td className="text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
