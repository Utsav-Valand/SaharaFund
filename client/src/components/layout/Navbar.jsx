import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Search, Menu, X, ChevronDown, Bell, User, LogOut,
  LayoutDashboard, Shield, PlusCircle, BookOpen, MapPin
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import Logo from '../ui/Logo'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const userMenuRef = useRef(null)

  // Detect scroll for navbar shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinks = [
    { to: '/discover', label: 'Discover' },
    { to: '/how-it-works', label: 'How It Works' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100' : 'bg-white'
        }`}
      >
        <div className="container-xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Location */}
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                <span className="font-medium text-gray-700">Vadodara, India</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Start Fundraiser */}
                  <Link to="/create" className="btn-accent btn-sm gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    Start a Fundraiser
                  </Link>

                  {/* Notifications */}
                  <Link
                    to="/dashboard/notifications"
                    className="btn-icon btn-ghost relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                  </Link>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition-colors"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                      id="user-menu-button"
                    >
                      <Avatar name={user?.name} src={user?.profileImage} size="sm" />
                      <span className="text-sm font-medium text-gray-700 max-w-24 truncate">
                        {user?.name?.split(' ')[0]}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-modal border border-gray-100 overflow-hidden z-50"
                          role="menu"
                          aria-labelledby="user-menu-button"
                        >
                          <div className="px-4 py-3 border-b border-gray-50">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" role="menuitem">
                              <LayoutDashboard className="w-4 h-4 text-gray-400" />
                              Dashboard
                            </Link>
                            {isAdmin && (
                              <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" role="menuitem">
                                <Shield className="w-4 h-4 text-gray-400" />
                                Admin Panel
                              </Link>
                            )}
                            <Link to="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" role="menuitem">
                              <User className="w-4 h-4 text-gray-400" />
                              Profile
                            </Link>
                          </div>
                          <div className="py-1 border-t border-gray-50">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors w-full text-left"
                              role="menuitem"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost btn-sm">Sign In</Link>
                  <Link to="/create" className="btn-accent btn-sm gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    Start a Fundraiser
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden btn-ghost btn-icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="overlay md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed top-16 left-0 right-0 bg-white border-b border-gray-100 z-40 md:hidden shadow-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="container-xl py-4 space-y-1">
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 mb-1 border-b border-gray-100">
                  <MapPin className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                  <span className="font-medium text-gray-700">Vadodara, India</span>
                </div>
                {navLinks.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}

                <div className="pt-2 border-t border-gray-100 mt-2 space-y-1">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Avatar name={user?.name} src={user?.profileImage} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <Link to="/create" className="btn-accent w-full justify-center mt-2">
                        <PlusCircle className="w-4 h-4" /> Start a Fundraiser
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-danger-600 hover:bg-danger-50 w-full text-left">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="btn-secondary w-full justify-center">Sign In</Link>
                      <Link to="/create" className="btn-accent w-full justify-center mt-2">
                        <PlusCircle className="w-4 h-4" /> Start a Fundraiser
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  )
}
