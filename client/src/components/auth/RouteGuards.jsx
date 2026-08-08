import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../common/LoadingScreen'

/**
 * ProtectedRoute — requires user to be authenticated
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <LoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}

/**
 * RoleGuard — requires specific role(s)
 */
export function RoleGuard({ children, allowedRoles = [] }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <LoadingScreen />

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

/**
 * GuestOnly — redirects authenticated users away from auth pages
 */
export function GuestOnly({ children }) {
  const { isAuthenticated, initializing, user } = useAuth()

  if (initializing) return <LoadingScreen />
  if (isAuthenticated) {
    const redirect = user?.role === 'admin' ? '/admin' : '/dashboard'
    return <Navigate to={redirect} replace />
  }
  return children
}
