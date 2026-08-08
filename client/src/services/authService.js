import api from './api'

export const authService = {
  register: async (userData) => {
    const res = await api.post('/auth/register', userData)
    return res.data
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials)
    return res.data
  },

  logout: async () => {
    const res = await api.post('/auth/logout')
    return res.data
  },

  getMe: async () => {
    const res = await api.get('/users/me')
    return res.data
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email })
    return res.data
  },

  resetPassword: async (token, password) => {
    const res = await api.post('/auth/reset-password', { token, password })
    return res.data
  },

  verifyEmail: async (token) => {
    const res = await api.post('/auth/verify-email', { token })
    return res.data
  },
}
