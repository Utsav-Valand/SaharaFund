import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Megaphone, HandCoins, BarChart2,
  User, ShieldCheck, CreditCard, Bell, Lock,
  ChevronRight, Menu, X, LogOut, Activity, Heart
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import Logo from '../ui/Logo'
import Navbar from './Navbar'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', exact: true },
      { to: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
    ],
  },
  {
    label: 'Fundraising',
    items: [
      { to: '/dashboard/campaigns', icon: Megaphone, label: 'My Campaigns' },
    ],
  },
  {
    label: 'Giving',
    items: [
      { to: '/dashboard/donations', icon: HandCoins, label: 'My Donations' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/dashboard/profile', icon: User, label: 'Profile' },
      { to: '/dashboard/verification', icon: ShieldCheck, label: 'Verification' },
      { to: '/dashboard/payout', icon: CreditCard, label: 'Bank & Payout' },
      { to: '/dashboard/security', icon: Lock, label: 'Security' },
    ],
  },
]

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between">
        <Logo size="sm" />
        {onClose && (
          <button onClick={onClose} className="btn-ghost btn-icon lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} src={user?.profileImage} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5" aria-label="Dashboard navigation">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    isActive ? 'nav-item-active' : 'nav-item-inactive'
                  }
                  onClick={onClose}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="nav-item-inactive w-full text-danger-600 hover:bg-danger-50 hover:text-danger-700"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col bg-white border-r border-gray-100 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="overlay lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 z-50 lg:hidden flex flex-col shadow-xl"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Top Bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost btn-icon"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-gray-900 text-sm">SaharaFund</span>
          </Link>
          <Link to="/dashboard/notifications" className="btn-ghost btn-icon">
            <Bell className="w-5 h-5" />
          </Link>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
