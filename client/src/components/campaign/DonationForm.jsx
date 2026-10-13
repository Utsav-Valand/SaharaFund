import { useState } from 'react'
import { Heart, Loader2, CreditCard, QrCode, CheckCircle2, AlertCircle } from 'lucide-react'
import { paymentService } from '../../services/paymentService'
import { donationService } from '../../services/donationService'
import { formatCurrency, DONATION_PRESETS } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { id: 'razorpay', label: 'Pay Online', icon: CreditCard, desc: 'UPI, Card, Net Banking, Wallet' },
  { id: 'direct_upi', label: 'Direct UPI/Bank', icon: QrCode, desc: 'Send directly & submit reference' },
]

export default function DonationForm({ campaign, onClose, onSuccess }) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [comment, setComment] = useState('')
  const [step, setStep] = useState('amount') // amount | payment | direct | success
  const [processing, setProcessing] = useState(false)
  const [completedDonation, setCompletedDonation] = useState(null)

  // Direct transfer state
  const [directRef, setDirectRef] = useState('')
  const [directProof, setDirectProof] = useState('')

  const selectedAmount = amount || customAmount
  const isValidAmount = Number(selectedAmount) >= 10

  const handleAmountSelect = (preset) => {
    setAmount(String(preset))
    setCustomAmount('')
  }

  const handleCustomAmount = (val) => {
    setCustomAmount(val)
    setAmount('')
  }

  // ─── Razorpay Online Payment ──────────────────────────────────────────────

  const handleRazorpayPayment = async () => {
    setProcessing(true)
    try {
      // Step 1: Create order on backend
      const orderData = await paymentService.createOrder({
        campaignId: campaign._id,
        amount: Number(selectedAmount),
        donorName: isAnonymous ? 'Anonymous Supporter' : user?.name || 'Generous Supporter',
        donorEmail: user?.email || 'donor@example.com',
        isAnonymous,
        comment: comment.trim(),
      })

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order.')
      }

      // Development sandbox mode (works without Razorpay live credentials)
      if (orderData.order?.id?.startsWith('order_dev_')) {
        const verification = await paymentService.verifyPayment({
          donationId: orderData.donationId,
          razorpay_order_id: orderData.order.id,
          razorpay_payment_id: 'pay_dev_' + Date.now(),
          razorpay_signature: 'dev_mock_signature',
        })
        if (verification.success) {
          setCompletedDonation(verification.donation)
          setStep('success')
          toast.success('Donation successful! Thank you for your support ❤️')
          if (onSuccess) onSuccess(verification.donation)
          return
        }
      }

      // Check if Razorpay SDK loaded
      if (!window.Razorpay) {
        // Fallback to mock mode if SDK not available
        await handleMockPayment()
        return
      }

      // Step 2: Open Razorpay checkout
      const paymentResult = await paymentService.openRazorpayCheckout({
        order: orderData.order,
        razorpayKeyId: orderData.razorpayKeyId,
        prefill: orderData.prefill,
        onDismiss: () => {
          setProcessing(false)
          toast('Payment cancelled.', { icon: '⚠️' })
        },
      })

      // Step 3: Verify signature on backend
      const verification = await paymentService.verifyPayment({
        donationId: orderData.donationId,
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
      })

      if (verification.success) {
        setCompletedDonation(verification.donation)
        setStep('success')
        toast.success('Payment successful! Thank you 🎉')
        if (onSuccess) onSuccess(verification.donation)
      } else {
        throw new Error(verification.message)
      }
    } catch (err) {
      if (!err.message?.includes('cancelled')) {
        toast.error(err.message || 'Payment failed. Please try again.')
      }
    } finally {
      setProcessing(false)
    }
  }

  // Mock payment for development (when Razorpay keys not configured)
  const handleMockPayment = async () => {
    try {
      const res = await donationService.donate({
        campaignId: campaign._id,
        amount: Number(selectedAmount),
        donorName: isAnonymous ? 'Anonymous Supporter' : user?.name || 'Generous Supporter',
        donorEmail: user?.email || 'donor@example.com',
        isAnonymous,
        comment: comment.trim(),
        paymentProvider: 'mock',
      })
      setCompletedDonation(res.donation)
      setStep('success')
      toast.success(`Donation of ${formatCurrency(Number(selectedAmount))} recorded (demo mode).`)
      if (onSuccess) onSuccess(res.donation)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Donation failed.')
    }
  }

  // ─── Direct UPI/Bank Transfer ─────────────────────────────────────────────

  const handleDirectTransfer = async () => {
    if (!directRef.trim()) {
      toast.error('Please enter your transaction reference / UTR number.')
      return
    }

    setProcessing(true)
    try {
      const res = await paymentService.submitDirectTransfer({
        campaignId: campaign._id,
        amount: Number(selectedAmount),
        donorName: isAnonymous ? 'Anonymous Supporter' : user?.name || 'Generous Supporter',
        donorEmail: user?.email || 'donor@example.com',
        isAnonymous,
        comment: comment.trim(),
        directTransferReference: directRef.trim(),
        paymentProofUrl: directProof.trim(),
      })

      if (res.success) {
        setCompletedDonation(res.donation)
        setStep('success')
        toast.success('Transfer reference submitted for verification!')
        if (onSuccess) onSuccess(res.donation)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  // ─── Receipt Download ─────────────────────────────────────────────────────

  const handleDownloadReceipt = () => {
    if (!completedDonation?.receiptNumber) {
      toast('Receipt will be available once payment is confirmed.', { icon: 'ℹ️' })
      return
    }
    const receiptText = [
      '════════════════════════════════════',
      '        SAHARAFUND RECEIPT',
      '════════════════════════════════════',
      `Receipt No : ${completedDonation.receiptNumber}`,
      `Campaign   : ${campaign.title}`,
      `Amount     : ${formatCurrency(completedDonation.amount)}`,
      `Date       : ${new Date(completedDonation.createdAt || Date.now()).toLocaleDateString('en-IN')}`,
      `Method     : ${completedDonation.paymentProvider === 'razorpay' ? 'Online (Razorpay)' : completedDonation.paymentProvider === 'upi_direct' ? 'Direct UPI/Bank Transfer' : 'Online'}`,
      `Ref        : ${completedDonation.transactionId || 'N/A'}`,
      '────────────────────────────────────',
      'This receipt is for your records.',
      'Not a tax exemption certificate.',
      '════════════════════════════════════',
    ].join('\n')

    const blob = new Blob([receiptText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SaharaFund-Receipt-${completedDonation.receiptNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Step: Success ────────────────────────────────────────────────────────

  if (step === 'success') {
    const isPending = completedDonation?.paymentStatus === 'pending'
    return (
      <div className="p-8 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isPending ? 'bg-amber-50' : 'bg-success-50'}`}>
          {isPending
            ? <AlertCircle className="w-8 h-8 text-amber-600" />
            : <CheckCircle2 className="w-8 h-8 text-success-600" />}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {isPending ? 'Transfer Submitted!' : 'Thank you! 🎉'}
        </h3>
        <p className="text-3xl font-extrabold text-primary-700 mb-3">
          {formatCurrency(Number(selectedAmount))}
        </p>
        {isPending ? (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm text-amber-800 font-medium mb-1">⏳ Pending Verification</p>
            <p className="text-xs text-amber-700">
              Your transfer reference has been submitted. The campaign organizer will verify your payment.
              You'll be notified once confirmed. Campaign totals will update after verification.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            Your donation has been processed and the campaign organizer has been notified.
          </p>
        )}
        {completedDonation?.receiptNumber && (
          <p className="text-xs text-gray-400 mb-4">Receipt: {completedDonation.receiptNumber}</p>
        )}
        <div className="flex gap-3">
          {!isPending && (
            <button onClick={handleDownloadReceipt} className="btn-secondary flex-1 text-sm">
              Download Receipt
            </button>
          )}
          <button onClick={onClose} className="btn-primary flex-1">
            Done
          </button>
        </div>
      </div>
    )
  }

  // ─── Step: Direct Transfer ────────────────────────────────────────────────

  if (step === 'direct') {
    return (
      <div className="p-6">
        <div className="bg-primary-50 rounded-xl p-4 mb-5 flex items-center justify-between">
          <span className="text-sm text-gray-600">Donation Amount</span>
          <span className="text-xl font-bold text-primary-700">{formatCurrency(Number(selectedAmount))}</span>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-amber-800 mb-2">⚠️ Direct Transfer Instructions</p>
          <p className="text-xs text-amber-700 mb-3">
            Please transfer ₹{Number(selectedAmount).toLocaleString('en-IN')} directly to the campaign's bank/UPI account.
            After transferring, submit your transaction reference (UTR/transaction ID) below.
          </p>
          <div className="bg-white rounded-lg p-3 text-xs text-gray-700 space-y-1 border border-amber-100">
            <p className="font-semibold text-gray-900">Payment Details:</p>
            <p>UPI ID: <strong>Contact organizer via campaign page</strong></p>
            <p className="text-amber-600 text-xs mt-2">Note: Campaign organizer must verify your payment before it counts toward the total.</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="label label-required">Transaction Reference / UTR Number</label>
          <input
            type="text"
            value={directRef}
            onChange={e => setDirectRef(e.target.value)}
            className="input"
            placeholder="e.g. 123456789012 or UTR number"
          />
          <p className="field-hint">The 12-digit UTR number from your UPI app or bank statement.</p>
        </div>

        <div className="mb-5">
          <label className="label">Payment Proof URL (optional)</label>
          <input
            type="url"
            value={directProof}
            onChange={e => setDirectProof(e.target.value)}
            className="input"
            placeholder="Link to screenshot on Google Drive, etc."
          />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep('payment')} className="btn-secondary flex-1" disabled={processing}>
            Back
          </button>
          <button
            onClick={handleDirectTransfer}
            disabled={!directRef.trim() || processing}
            className="btn-accent flex-1 gap-2"
          >
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Reference'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Step 1: Choose Amount */}
      {step === 'amount' && (
        <>
          <p className="text-sm text-gray-500 mb-4">Select or enter an amount to donate</p>

          {/* Preset Amounts */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {DONATION_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => handleAmountSelect(preset)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  amount === String(preset)
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                {formatCurrency(preset, true)}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="mb-4">
            <label htmlFor="custom-amount" className="label">Or enter custom amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
              <input
                id="custom-amount"
                type="number"
                min="10"
                value={customAmount}
                onChange={e => handleCustomAmount(e.target.value)}
                placeholder="e.g. 2500"
                className="input pl-8"
              />
            </div>
            {customAmount && Number(customAmount) < 10 && (
              <p className="field-error">Minimum donation is ₹10</p>
            )}
          </div>

          {/* Message */}
          <div className="mb-4">
            <label htmlFor="donation-message" className="label">Leave a message (optional)</label>
            <textarea
              id="donation-message"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="input resize-none"
              rows={2}
              maxLength={200}
              placeholder="Words of encouragement..."
            />
          </div>

          {/* Anonymous */}
          <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded accent-primary-700"
            />
            <span className="text-sm text-gray-700">Donate anonymously</span>
          </label>

          <button
            onClick={() => setStep('payment')}
            disabled={!isValidAmount}
            className="btn-accent w-full btn-lg gap-2"
          >
            Continue — {isValidAmount ? formatCurrency(Number(selectedAmount)) : 'Select Amount'}
          </button>
        </>
      )}

      {/* Step 2: Payment Method */}
      {step === 'payment' && (
        <>
          <div className="bg-primary-50 rounded-xl p-4 mb-5 flex items-center justify-between">
            <span className="text-sm text-gray-600">Donation Amount</span>
            <span className="text-xl font-bold text-primary-700">{formatCurrency(Number(selectedAmount))}</span>
          </div>

          <div className="mb-5">
            <label className="label">Payment Method</label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-sm border transition-all text-left ${
                    paymentMethod === method.id
                      ? 'bg-primary-50 border-primary-300 text-primary-800'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <method.icon className={`w-5 h-5 flex-shrink-0 ${paymentMethod === method.id ? 'text-primary-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-semibold">{method.label}</p>
                    <p className="text-xs text-gray-500">{method.desc}</p>
                  </div>
                  {paymentMethod === method.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'razorpay' && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
              <p className="text-xs text-blue-700">
                🔒 Powered by <strong>Razorpay</strong> — Pay securely via UPI, Credit/Debit Card, Net Banking, or Wallet.
                {process.env.NODE_ENV === 'development' && ' (Demo mode — no real payment collected)'}
              </p>
            </div>
          )}

          {paymentMethod === 'direct_upi' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-700">
                ⚠️ <strong>Direct Transfer:</strong> You'll send money directly to the campaign's bank/UPI account.
                Submit your transaction reference for organizer verification.
                <strong> Campaign totals update only after verification.</strong>
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('amount')} className="btn-secondary flex-1" disabled={processing}>
              Back
            </button>
            <button
              onClick={paymentMethod === 'razorpay' ? handleRazorpayPayment : () => setStep('direct')}
              disabled={processing}
              className="btn-accent flex-1 gap-2"
            >
              {processing ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
              ) : paymentMethod === 'razorpay' ? (
                <><Heart className="w-4 h-4" fill="currentColor" />Pay {formatCurrency(Number(selectedAmount))}</>
              ) : (
                <>Continue</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
