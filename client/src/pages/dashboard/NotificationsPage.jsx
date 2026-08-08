import { useState, useEffect } from 'react'
import { Bell, CheckCheck, Info, TrendingUp, ShieldCheck, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { EmptyState } from '../../components/common/StateComponents'
import { userService } from '../../services/userService'
import { formatRelativeDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const ICON_MAP = {
  campaign_approved: { icon: TrendingUp, color: 'bg-success-50 text-success-600' },
  campaign_rejected: { icon: AlertCircle, color: 'bg-danger-50 text-danger-600' },
  donation_received: { icon: TrendingUp, color: 'bg-primary-50 text-primary-600' },
  verification_update: { icon: ShieldCheck, color: 'bg-blue-50 text-blue-600' },
  default: { icon: Info, color: 'bg-gray-100 text-gray-500' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await userService.getNotifications()
        setNotifications(data.notifications || [])
      } catch {
        console.error('Notifications fetch failed')
      } finally {
        setLoading(false)
      }
    }
    fetchNotifs()
  }, [])

  const markAllRead = async () => {
    try {
      await userService.markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read.')
    } catch {
      toast.error('Failed to mark notifications as read.')
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary btn-sm gap-2">
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card h-16 animate-pulse" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="We'll let you know when something important happens with your campaigns or donations."
          />
        ) : (
          <div className="card overflow-hidden divide-y divide-gray-50">
            {notifications.map(n => {
              const config = ICON_MAP[n.type] || ICON_MAP.default
              const Icon = config.icon
              return (
                <div key={n._id} className={`flex gap-4 p-4 transition-colors ${!n.read ? 'bg-primary-50/40' : 'hover:bg-gray-50'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
