import api from './api'

export const adminService = {
  // Campaigns
  getCampaigns: async (params = {}) => {
    const res = await api.get('/admin/campaigns', { params })
    return res.data
  },

  approveCampaign: async (id) => {
    const res = await api.put(`/admin/campaigns/${id}/approve`)
    return res.data
  },

  rejectCampaign: async (id, reason) => {
    const res = await api.put(`/admin/campaigns/${id}/reject`, { reason })
    return res.data
  },

  suspendCampaign: async (id, reason) => {
    const res = await api.put(`/admin/campaigns/${id}/suspend`, { reason })
    return res.data
  },

  // Users
  getUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params })
    return res.data
  },

  getUserById: async (id) => {
    const res = await api.get(`/admin/users/${id}`)
    return res.data
  },

  updateUserRole: async (id, role) => {
    const res = await api.put(`/admin/users/${id}/role`, { role })
    return res.data
  },

  // Fraud
  getFraudQueue: async (params = {}) => {
    const res = await api.get('/admin/fraud', { params })
    return res.data
  },

  // Reports
  getReports: async (params = {}) => {
    const res = await api.get('/admin/reports', { params })
    return res.data
  },

  resolveReport: async (id, resolution) => {
    const res = await api.put(`/admin/reports/${id}`, { resolution })
    return res.data
  },

  // Analytics
  getAnalytics: async () => {
    const res = await api.get('/admin/analytics')
    return res.data
  },

  // Categories
  getCategories: async () => {
    const res = await api.get('/admin/categories')
    return res.data
  },

  // ─── Phase 2: Verifications ─────────────────────────────────────────────────
  getVerifications: async (params = {}) => {
    const res = await api.get('/admin/verifications', { params })
    return res.data
  },

  reviewVerification: async (id, reviewData) => {
    const res = await api.patch(`/admin/verifications/${id}`, reviewData)
    return res.data
  },

  // ─── Phase 2: Payouts ────────────────────────────────────────────────────────
  getPayouts: async (params = {}) => {
    const res = await api.get('/admin/payouts', { params })
    return res.data
  },

  reviewPayout: async (id, reviewData) => {
    const res = await api.patch(`/admin/payouts/${id}`, reviewData)
    return res.data
  },

  // ─── Phase 2: Donations Overview ─────────────────────────────────────────────
  getDonations: async (params = {}) => {
    const res = await api.get('/admin/donations', { params })
    return res.data
  },

  // ─── Phase 2: Audit Log ───────────────────────────────────────────────────────
  getAuditLog: async (params = {}) => {
    const res = await api.get('/admin/audit-log', { params })
    return res.data
  },
}
