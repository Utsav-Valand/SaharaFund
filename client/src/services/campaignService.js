import api from './api'

export const campaignService = {
  // Public — get all campaigns (with filters)
  getCampaigns: async (params = {}) => {
    const res = await api.get('/campaigns', { params })
    return res.data
  },

  // Public — get single campaign by ID or slug
  getCampaign: async (id) => {
    const res = await api.get(`/campaigns/${id}`)
    return res.data
  },

  // Create campaign (requires auth)
  createCampaign: async (campaignData) => {
    const res = await api.post('/campaigns', campaignData)
    return res.data
  },

  // Update campaign
  updateCampaign: async (id, campaignData) => {
    const res = await api.put(`/campaigns/${id}`, campaignData)
    return res.data
  },

  // Delete campaign
  deleteCampaign: async (id) => {
    const res = await api.delete(`/campaigns/${id}`)
    return res.data
  },

  // Submit campaign for review (DRAFT -> FRAUD_CHECK)
  submitCampaign: async (id) => {
    const res = await api.post(`/campaigns/${id}/submit`)
    return res.data
  },

  // Report a campaign
  reportCampaign: async (id, reportData) => {
    const res = await api.post(`/campaigns/${id}/report`, reportData)
    return res.data
  },

  // Upload campaign cover image
  uploadCoverImage: async (id, formData) => {
    const res = await api.post(`/campaigns/${id}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  // Get campaign updates
  getUpdates: async (id) => {
    const res = await api.get(`/campaigns/${id}/updates`)
    return res.data
  },

  // Post campaign update
  postUpdate: async (id, updateData) => {
    const res = await api.post(`/campaigns/${id}/updates`, updateData)
    return res.data
  },

  // Get campaign donations
  getCampaignDonations: async (id, params = {}) => {
    const res = await api.get(`/campaigns/${id}/donations`, { params })
    return res.data
  },

  // Get my campaigns (dashboard)
  getMyCampaigns: async () => {
    const res = await api.get('/campaigns/me')
    return res.data
  },

  // Get campaign analytics
  getCampaignAnalytics: async (id) => {
    const res = await api.get(`/campaigns/${id}/analytics`)
    return res.data
  },
}
