import api from './api'

export const payoutAccountService = {
  getMyAccounts: async () => {
    const res = await api.get('/payout-accounts')
    return res.data
  },

  addAccount: async (accountData) => {
    const res = await api.post('/payout-accounts', accountData)
    return res.data
  },

  updateAccount: async (id, accountData) => {
    const res = await api.patch(`/payout-accounts/${id}`, accountData)
    return res.data
  },

  deleteAccount: async (id) => {
    const res = await api.delete(`/payout-accounts/${id}`)
    return res.data
  },
}

export const payoutService = {
  getMyPayouts: async (params = {}) => {
    const res = await api.get('/payouts', { params })
    return res.data
  },

  getBalance: async () => {
    const res = await api.get('/payouts/balance')
    return res.data
  },

  requestPayout: async (payoutData) => {
    const res = await api.post('/payouts', payoutData)
    return res.data
  },

  getPayout: async (id) => {
    const res = await api.get(`/payouts/${id}`)
    return res.data
  },
}

export const verificationService = {
  getMyStatus: async () => {
    const res = await api.get('/verification/me')
    return res.data
  },

  submit: async (verificationData) => {
    const res = await api.post('/verification', verificationData)
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/verification/${id}`)
    return res.data
  },

  resubmit: async (id, data) => {
    const res = await api.post(`/verification/${id}/resubmit`, data)
    return res.data
  },
}
