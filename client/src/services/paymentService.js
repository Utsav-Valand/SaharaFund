import api from './api'

/**
 * Payment service for Razorpay integration and direct transfers.
 *
 * Razorpay checkout flow:
 * 1. createOrder() → backend creates order, returns orderId + keyId
 * 2. openCheckout() → opens Razorpay modal in browser
 * 3. verifyPayment() → backend verifies HMAC signature, marks donation complete
 */
export const paymentService = {
  /**
   * Step 1: Create a Razorpay order on the backend
   */
  createOrder: async (orderData) => {
    const res = await api.post('/payments/create-order', orderData)
    return res.data
  },

  /**
   * Step 2: Open Razorpay checkout in the browser
   *
   * Returns a promise that resolves with payment details on success,
   * or rejects/calls onError on failure/dismissal.
   */
  openRazorpayCheckout: ({ order, razorpayKeyId, prefill, onSuccess, onError, onDismiss }) => {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded. Check your internet connection.'))
        return
      }

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        order_id: order.id,
        name: 'SaharaFund',
        description: 'Donation',
        image: '/logo192.png',
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
        },
        theme: { color: '#0f766e' },
        modal: {
          ondismiss: () => {
            if (onDismiss) onDismiss()
            reject(new Error('Payment cancelled by user.'))
          },
        },
        handler: (response) => {
          resolve(response)
          if (onSuccess) onSuccess(response)
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        const err = new Error(resp.error?.description || 'Payment failed.')
        if (onError) onError(err)
        reject(err)
      })
      rzp.open()
    })
  },

  /**
   * Step 3: Verify payment signature on backend
   */
  verifyPayment: async (verificationData) => {
    const res = await api.post('/payments/verify', verificationData)
    return res.data
  },

  /**
   * Submit a direct UPI/bank transfer reference
   */
  submitDirectTransfer: async (transferData) => {
    const res = await api.post('/payments/direct-transfer', transferData)
    return res.data
  },

  /**
   * Organizer verifies or rejects a direct transfer
   */
  verifyDirectTransfer: async (donationId, { action, notes }) => {
    const res = await api.patch(`/payments/direct-transfer/${donationId}/verify`, { action, notes })
    return res.data
  },
}
