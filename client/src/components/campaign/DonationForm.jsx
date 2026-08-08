import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { donationService } from '../../services/donationService'
import { formatCurrency, DONATION_PRESETS } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Credit / Debit Card' },
  { id: 'netbanking', label: 'Net Banking' },
  { id: 'wallet', label: 'Wallet' },
]

export default function DonationForm({ campaign, onClose }) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [anonymous, setAnonymous] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState('amount') // amount | payment | success
  const [processing, setProcessing] = useState(false)

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

  const handleDonate = async () => {
    if (!isValidAmount) return
    setProcessing(true)
    try {
      const donationData = {
        campaignId: campaign._id,
        amount: Number(selectedAmount),
        paymentMethod,
        anonymous,
        message: message.trim(),
      }
      await donationService.donate(donationData)
      setStep('success')
      toast.success(`Thank you for donating ${formatCurrency(Number(selectedAmount))}!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Donation failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-success-600" fill="currentColor" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
        <p className="text-gray-500 mb-1">You donated</p>
        <p className="text-3xl font-extrabold text-primary-700 mb-4">{formatCurrency(Number(selectedAmount))}</p>
        <p className="text-sm text-gray-500 mb-6">
          Your donation is making a real difference. The campaign organizer will be notified.
        </p>
        <button onClick={onClose} className="btn-primary w-full">Close</button>
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
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="input resize-none"
              rows={2}
              maxLength={200}
              placeholder="Words of encouragement for the fundraiser..."
            />
          </div>

          {/* Anonymous */}
          <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={e => setAnonymous(e.target.checked)}
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

      {/* Step 2: Payment */}
      {step === 'payment' && (
        <>
          <div className="bg-primary-50 rounded-xl p-4 mb-5 flex items-center justify-between">
            <span className="text-sm text-gray-600">Donation Amount</span>
            <span className="text-xl font-bold text-primary-700">{formatCurrency(Number(selectedAmount))}</span>
          </div>

          <div className="mb-5">
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                    paymentMethod === method.id
                      ? 'bg-primary-700 text-white border-primary-700'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sandbox Notice */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
            <p className="text-xs text-amber-700">
              🔧 <strong>Sandbox Mode:</strong> No real payment will be processed. This is a development environment.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('amount')} className="btn-secondary flex-1" disabled={processing}>
              Back
            </button>
            <button
              onClick={handleDonate}
              disabled={processing}
              className="btn-accent flex-1 gap-2"
            >
              {processing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Heart className="w-4 h-4" fill="currentColor" /> Donate Now</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
