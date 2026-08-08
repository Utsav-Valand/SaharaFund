import api from './api'

export const userService = {
  getMe: async () => {
    const res = await api.get('/users/me')
    return res.data
  },

  updateMe: async (userData) => {
    const res = await api.put('/users/me', userData)
    return res.data
  },

  updateAvatar: async (formData) => {
    const res = await api.put('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  getUserById: async (id) => {
    const res = await api.get(`/users/${id}`)
    return res.data
  },

  getNotifications: async (params = {}) => {
    const res = await api.get('/notifications', { params })
    return res.data
  },

  markNotificationRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`)
    return res.data
  },

  markAllNotificationsRead: async () => {
    const res = await api.put('/notifications/read-all')
    return res.data
  },

  submitVerification: async (verificationData) => {
    const res = await api.post('/verification', verificationData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  getVerificationStatus: async () => {
    const res = await api.get('/verification/me')
    return res.data
  },

  updateBankDetails: async (bankData) => {
    const res = await api.put('/users/me/bank', bankData)
    return res.data
  },

  changePassword: async (passwordData) => {
    const res = await api.put('/auth/change-password', passwordData)
    return res.data
  },
}
