import api from './api'

export const donationService = {
  // Create a donation
  donate: async (donationData) => {
    const res = await api.post('/donations', donationData)
    return res.data
  },

  // Get donation by ID
  getDonation: async (id) => {
    const res = await api.get(`/donations/${id}`)
    return res.data
  },

  // Get my donation history
  getMyDonations: async (params = {}) => {
    const res = await api.get('/donations/me', { params })
    return res.data
  },

  // Verify payment after gateway callback
  verifyPayment: async (paymentData) => {
    const res = await api.post('/donations/verify', paymentData)
    return res.data
  },
}
