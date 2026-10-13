import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, LayoutDashboard, Megaphone, Users, AlertTriangle,
  HandCoins, FileText, BarChart2, Tags, Bell, X, Menu, LogOut, Heart,
  ShieldCheck, CreditCard
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import logoImg from '../../assets/logo.png'

const adminNav = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { to: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
      { to: '/admin/fraud', icon: AlertTriangle, label: 'Fraud Queue' },
      { to: '/admin/reports', icon: FileText, label: 'Reports' },
    ],
  },
  {
    label: 'Users & Finance',
    items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/donations', icon: HandCoins, label: 'Donations' },
      { to: '/admin/verifications', icon: ShieldCheck, label: 'Verifications' },
      { to: '/admin/payouts', icon: CreditCard, label: 'Payouts' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/admin/categories', icon: Tags, label: 'Categories' },
    ],
  },
]

function AdminSidebarContent({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2.5">
          <img src={logoImg} alt="SaharaFund" className="w-8 h-8 object-contain" />
          <div>
            <span className="font-bold text-white text-sm block leading-tight">
              Sahara<span className="text-emerald-400">Fund</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block">
              Admin Portal
            </span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} src={user?.profileImage} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-primary-400">Administrator</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {adminNav.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-700 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                  onClick={onClose}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Back to site + Logout */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
          <Heart className="w-4 h-4" /> Back to Site
        </Link>
        <button
          onClick={() => { logout(); navigate('/') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all w-full text-left"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col z-30">
        <AdminSidebarContent />
      </aside>

      {/* Mobile Sidebar */}
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
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <AdminSidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-white text-sm">Admin Panel</span>
          <div className="w-8" />
        </div>

        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
