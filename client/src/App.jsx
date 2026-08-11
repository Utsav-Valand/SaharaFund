import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, RoleGuard, GuestOnly } from './components/auth/RouteGuards'
import { Suspense, lazy } from 'react'
import LoadingScreen from './components/common/LoadingScreen'

// Public Pages
import HomePage from './pages/HomePage'
import DiscoverPage from './pages/DiscoverPage'
import CampaignDetailPage from './pages/CampaignDetailPage'
import CreateFundraiserPage from './pages/CreateFundraiserPage'
import NotFoundPage from './pages/NotFoundPage'
import HowItWorksPage from './pages/HowItWorksPage'

// Auth Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage'
import MyCampaignsPage from './pages/dashboard/MyCampaignsPage'
import MyDonationsPage from './pages/dashboard/MyDonationsPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import NotificationsPage from './pages/dashboard/NotificationsPage'
import SecurityPage from './pages/dashboard/SecurityPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminCampaignsPage from './pages/admin/AdminCampaignsPage'
import AdminFraudPage from './pages/admin/AdminFraudPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

// Placeholder for pages not yet built
function PlaceholderPage({ title }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm">This page is coming soon in Phase 2.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/campaign/:id" element={<CampaignDetailPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/trust-safety" element={<PlaceholderPage title="Trust & Safety" />} />
        <Route path="/transparency" element={<PlaceholderPage title="Transparency" />} />
        <Route path="/pricing" element={<PlaceholderPage title="Fees & Pricing" />} />
        <Route path="/help" element={<PlaceholderPage title="Help Center" />} />
        <Route path="/contact" element={<PlaceholderPage title="Contact Us" />} />
        <Route path="/privacy" element={<PlaceholderPage title="Privacy Policy" />} />
        <Route path="/terms" element={<PlaceholderPage title="Terms of Service" />} />
        <Route path="/refund" element={<PlaceholderPage title="Refund Policy" />} />

        {/* ===== AUTH ROUTES (guest only) ===== */}
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
        <Route path="/reset-password/:token" element={<GuestOnly><PlaceholderPage title="Reset Password" /></GuestOnly>} />

        {/* ===== CREATE FUNDRAISER (requires auth) ===== */}
        <Route path="/create" element={
          <ProtectedRoute><CreateFundraiserPage /></ProtectedRoute>
        } />

        {/* ===== USER DASHBOARD ===== */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/campaigns" element={<ProtectedRoute><MyCampaignsPage /></ProtectedRoute>} />
        <Route path="/dashboard/donations" element={<ProtectedRoute><MyDonationsPage /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/dashboard/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
        <Route path="/dashboard/verification" element={<ProtectedRoute><PlaceholderPage title="Verification" /></ProtectedRoute>} />
        <Route path="/dashboard/payout" element={<ProtectedRoute><PlaceholderPage title="Bank & Payout" /></ProtectedRoute>} />
        <Route path="/dashboard/campaigns/:id/updates" element={<ProtectedRoute><PlaceholderPage title="Campaign Updates" /></ProtectedRoute>} />
        <Route path="/dashboard/campaigns/:id/analytics" element={<ProtectedRoute><PlaceholderPage title="Campaign Analytics" /></ProtectedRoute>} />

        {/* ===== ADMIN ROUTES ===== */}
        <Route path="/admin" element={<RoleGuard allowedRoles={['admin']}><AdminDashboardPage /></RoleGuard>} />
        <Route path="/admin/campaigns" element={<RoleGuard allowedRoles={['admin']}><AdminCampaignsPage /></RoleGuard>} />
        <Route path="/admin/fraud" element={<RoleGuard allowedRoles={['admin']}><AdminFraudPage /></RoleGuard>} />
        <Route path="/admin/users" element={<RoleGuard allowedRoles={['admin']}><AdminUsersPage /></RoleGuard>} />
        <Route path="/admin/donations" element={<RoleGuard allowedRoles={['admin']}><PlaceholderPage title="Admin Donations" /></RoleGuard>} />
        <Route path="/admin/reports" element={<RoleGuard allowedRoles={['admin']}><PlaceholderPage title="Admin Reports" /></RoleGuard>} />
        <Route path="/admin/analytics" element={<RoleGuard allowedRoles={['admin']}><PlaceholderPage title="Platform Analytics" /></RoleGuard>} />
        <Route path="/admin/categories" element={<RoleGuard allowedRoles={['admin']}><PlaceholderPage title="Categories" /></RoleGuard>} />

        {/* ===== FALLBACK ===== */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}
