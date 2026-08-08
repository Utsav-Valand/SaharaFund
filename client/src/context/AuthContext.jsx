import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  // On mount: attempt to restore session from localStorage token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('sf_token')
      if (token) {
        try {
          const data = await authService.getMe()
          setUser(data.user)
        } catch {
          localStorage.removeItem('sf_token')
          localStorage.removeItem('sf_user')
        }
      }
      setLoading(false)
      setInitializing(false)
    }
    initAuth()
  }, [])

  const login = useCallback(async (credentials) => {
    setLoading(true)
    try {
      const data = await authService.login(credentials)
      localStorage.setItem('sf_token', data.token)
      localStorage.setItem('sf_user', JSON.stringify(data.user))
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`)
      return { success: true, user: data.user }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (userData) => {
    setLoading(true)
    try {
      const data = await authService.register(userData)
      localStorage.setItem('sf_token', data.token)
      localStorage.setItem('sf_user', JSON.stringify(data.user))
      setUser(data.user)
      toast.success('Account created successfully! Welcome to SaharaFund.')
      return { success: true, user: data.user }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sf_token')
    localStorage.removeItem('sf_user')
    setUser(null)
    toast.success('Logged out successfully.')
  }, [])

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('sf_user', JSON.stringify(updatedUser))
  }, [])

  const isAdmin = user?.role === 'admin'
  const isFundraiser = user?.role === 'fundraiser' || user?.role === 'admin'
  const isDonor = !!user

  return (
    <AuthContext.Provider value={{
      user, loading, initializing,
      login, register, logout, updateUser,
      isAdmin, isFundraiser, isDonor,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
