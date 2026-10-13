import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Plus, Trash2, CheckCircle2, XCircle, Clock,
  AlertCircle, Loader2, Building2, Wallet, ArrowUpRight,
  RefreshCw, ChevronDown, ChevronUp, ShieldCheck, Info,
  Banknote, History, IndianRupee
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Modal from '../../components/ui/Modal'
import { payoutAccountService, payoutService } from '../../services/phase2Service'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const ACCOUNT_STATUS = {
  not_submitted:  { label: 'Not Verified',   color: 'bg-gray-100 text-gray-600',     icon: Clock },
  pending:        { label: 'Pending Review', color: 'bg-amber-100 text-amber-700',   icon: Clock },
  verified:       { label: 'Verified',       color: 'bg-green-100 text-green-700',   icon: CheckCircle2 },
  rejected:       { label: 'Rejected',       color: 'bg-red-100 text-red-700',       icon: XCircle },
  action_required:{ label: 'Action Needed',  color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
}

const PAYOUT_STATUS = {
  requested:    { label: 'Requested',    color: 'bg-blue-100 text-blue-700',     icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700',   icon: Loader2 },
  approved:     { label: 'Approved',     color: 'bg-teal-100 text-teal-700',     icon: CheckCircle2 },
  processing:   { label: 'Processing',   color: 'bg-indigo-100 text-indigo-700', icon: Loader2 },
  completed:    { label: 'Completed',    color: 'bg-green-100 text-green-700',   icon: CheckCircle2 },
  rejected:     { label: 'Rejected',     color: 'bg-red-100 text-red-700',       icon: XCircle },
  failed:       { label: 'Failed',       color: 'bg-red-100 text-red-700',       icon: XCircle },
  reversed:     { label: 'Reversed',     color: 'bg-gray-100 text-gray-600',     icon: RefreshCw },
}

function StatusBadge({ status, config }) {
  const cfg = config[status] || config[Object.keys(config)[0]]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

function AddAccountModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    accountHolderName: '', accountNumber: '', confirmAccountNumber: '',
    ifscCode: '', bankName: '', accountType: 'savings', upiId: '', isPrimary: false,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const INDIAN_BANKS = [
    'State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra Bank',
    'Punjab National Bank','Bank of Baroda','Canara Bank','Union Bank of India',
    'IndusInd Bank','Yes Bank','IDFC First Bank','Federal Bank','Bank of India','Other',
  ]

  const validate = () => {
    const e = {}
    if (!form.accountHolderName.trim()) e.accountHolderName = 'Name is required'
    if (!form.accountNumber.trim()) e.accountNumber = 'Account number is required'
    if (form.accountNumber !== form.confirmAccountNumber) e.confirmAccountNumber = 'Account numbers do not match'
    if (!form.ifscCode.trim()) e.ifscCode = 'IFSC code is required'
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifscCode)) e.ifscCode = 'Invalid IFSC (e.g. SBIN0001234)'
    if (!form.bankName) e.bankName = 'Please select a bank'
    if (form.upiId && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(form.upiId)) e.upiId = 'Invalid UPI ID'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await payoutAccountService.addAccount({ ...form, ifscCode: form.ifscCode.toUpperCase() })
      toast.success('Bank account submitted for verification!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add account')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null
  return (
    <Modal isOpen={open} onClose={onClose} title="Add Bank Account" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label label-required">Account Holder Name</label>
            <input value={form.accountHolderName} onChange={e => setForm(f=>({...f,accountHolderName:e.target.value}))}
              className={`input ${errors.accountHolderName?'border-red-400':''}`} placeholder="As per bank records" />
            {errors.accountHolderName && <p className="field-error">{errors.accountHolderName}</p>}
          </div>
          <div>
            <label className="label label-required">Account Number</label>
            <input type="password" value={form.accountNumber} onChange={e => setForm(f=>({...f,accountNumber:e.target.value}))}
              autoComplete="off" className={`input ${errors.accountNumber?'border-red-400':''}`} placeholder="Account number" />
            {errors.accountNumber && <p className="field-error">{errors.accountNumber}</p>}
          </div>
          <div>
            <label className="label label-required">Confirm Account Number</label>
            <input value={form.confirmAccountNumber} onChange={e => setForm(f=>({...f,confirmAccountNumber:e.target.value}))}
              autoComplete="off" className={`input ${errors.confirmAccountNumber?'border-red-400':''}`} placeholder="Re-enter account number" />
            {errors.confirmAccountNumber && <p className="field-error">{errors.confirmAccountNumber}</p>}
          </div>
          <div>
            <label className="label label-required">IFSC Code</label>
            <input value={form.ifscCode} onChange={e => setForm(f=>({...f,ifscCode:e.target.value.toUpperCase()}))}
              className={`input uppercase ${errors.ifscCode?'border-red-400':''}`} placeholder="e.g. SBIN0001234" />
            {errors.ifscCode && <p className="field-error">{errors.ifscCode}</p>}
          </div>
          <div>
            <label className="label label-required">Bank Name</label>
            <select value={form.bankName} onChange={e => setForm(f=>({...f,bankName:e.target.value}))}
              className={`input ${errors.bankName?'border-red-400':''}`}>
              <option value="">Select Bank</option>
              {INDIAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {errors.bankName && <p className="field-error">{errors.bankName}</p>}
          </div>
          <div>
            <label className="label">Account Type</label>
            <select value={form.accountType} onChange={e => setForm(f=>({...f,accountType:e.target.value}))} className="input">
              <option value="savings">Savings</option>
              <option value="current">Current</option>
            </select>
          </div>
          <div>
            <label className="label">UPI ID (optional)</label>
            <input value={form.upiId} onChange={e => setForm(f=>({...f,upiId:e.target.value}))}
              className={`input ${errors.upiId?'border-red-400':''}`} placeholder="yourname@upi" />
            {errors.upiId && <p className="field-error">{errors.upiId}</p>}
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(f=>({...f,isPrimary:e.target.checked}))}
            className="w-4 h-4 rounded accent-primary-700" />
          <span className="text-sm text-gray-700">Set as primary payout account</span>
        </label>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">Account details are encrypted. Only the last 4 digits are stored for display. Verification takes 1-2 business days.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancel</button>
          <button type="submit" className="btn-primary flex-1 gap-2" disabled={submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin"/>Submitting...</> : <><Plus className="w-4 h-4"/>Add Account</>}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function RequestPayoutModal({ open, onClose, onSuccess, balance, accounts }) {
  const [form, setForm] = useState({ campaignId: '', payoutAccountId: '', amount: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const verifiedAccounts = (accounts || []).filter(a => a.verificationStatus === 'verified')
  const campaigns = balance?.campaignBalances || []
  const selectedCampaign = campaigns.find(c => c.campaign._id === form.campaignId)
  const maxAmount = selectedCampaign?.available || 0

  const validate = () => {
    const e = {}
    if (!form.campaignId) e.campaignId = 'Please select a campaign'
    if (!form.payoutAccountId) e.payoutAccountId = 'Please select a bank account'
    const num = Number(form.amount)
    if (!form.amount || isNaN(num) || num < 100) e.amount = 'Minimum payout is Rs.100'
    if (num > maxAmount) e.amount = `Exceeds available balance (${formatCurrency(maxAmount)})`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await payoutService.requestPayout({ campaignId: form.campaignId, payoutAccountId: form.payoutAccountId, amount: Number(form.amount), notes: form.notes })
      toast.success('Payout request submitted! Admin will review within 2-3 business days.')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit payout request')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null
  return (
    <Modal isOpen={open} onClose={onClose} title="Request Payout" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {verifiedAccounts.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-sm text-amber-700 font-medium">No verified bank accounts</p>
            <p className="text-xs text-amber-600">Add and get a bank account verified first.</p>
          </div>
        )}
        <div>
          <label className="label label-required">Select Campaign</label>
          <select value={form.campaignId} onChange={e => setForm(f=>({...f,campaignId:e.target.value,amount:''}))}
            className={`input ${errors.campaignId?'border-red-400':''}`}>
            <option value="">Choose campaign...</option>
            {campaigns.map(c => (
              <option key={c.campaign._id} value={c.campaign._id} disabled={c.available <= 0}>
                {c.campaign.title} — Available: {formatCurrency(c.available)}
              </option>
            ))}
          </select>
          {errors.campaignId && <p className="field-error">{errors.campaignId}</p>}
        </div>
        <div>
          <label className="label label-required">Destination Account</label>
          <select value={form.payoutAccountId} onChange={e => setForm(f=>({...f,payoutAccountId:e.target.value}))}
            className={`input ${errors.payoutAccountId?'border-red-400':''}`}>
            <option value="">Choose bank account...</option>
            {verifiedAccounts.map(a => (
              <option key={a._id} value={a._id}>{a.bankName} — XXXXXX{a.accountNumberLast4}{a.isPrimary?' (Primary)':''}</option>
            ))}
          </select>
          {errors.payoutAccountId && <p className="field-error">{errors.payoutAccountId}</p>}
        </div>
        <div>
          <label className="label label-required">Amount (Rs.)</label>
          {selectedCampaign && <p className="text-xs text-gray-500 mb-1">Available: <strong>{formatCurrency(maxAmount)}</strong></p>}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rs.</span>
            <input type="number" min="100" max={maxAmount || undefined} value={form.amount}
              onChange={e => setForm(f=>({...f,amount:e.target.value}))}
              className={`input pl-10 ${errors.amount?'border-red-400':''}`} placeholder="e.g. 5000" />
          </div>
          {errors.amount && <p className="field-error">{errors.amount}</p>}
          {form.amount && maxAmount > 0 && Number(form.amount) <= maxAmount && (
            <button type="button" onClick={() => setForm(f=>({...f,amount:String(maxAmount)}))}
              className="text-xs text-primary-600 hover:underline mt-1">Use max ({formatCurrency(maxAmount)})</button>
          )}
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}
            className="input resize-none" rows={2} maxLength={500} placeholder="Purpose of withdrawal..." />
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
          <p>• Payouts are reviewed within 2-3 business days</p>
          <p>• Funds are transferred via NEFT/IMPS after admin approval</p>
          <p>• SaharaFund charges 0% platform fee on payouts</p>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancel</button>
          <button type="submit" className="btn-accent flex-1 gap-2"
            disabled={submitting || verifiedAccounts.length === 0 || campaigns.length === 0}>
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin"/>Submitting...</> : <><ArrowUpRight className="w-4 h-4"/>Request Payout</>}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AccountCard({ account, onDelete, deleting }) {
  return (
    <motion.div layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.97}}
      className={`card p-5 ${account.isPrimary?'ring-2 ring-primary-300':''}`}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">{account.bankName}</h3>
            {account.isPrimary && <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">Primary</span>}
            <StatusBadge status={account.verificationStatus} config={ACCOUNT_STATUS} />
          </div>
          <p className="text-sm text-gray-500">{account.accountHolderName} · XXXXXX{account.accountNumberLast4}</p>
          <p className="text-xs text-gray-400 mt-0.5">IFSC: {account.ifscCode} · {account.accountType}{account.upiId?` · UPI: ${account.upiId}`:''}</p>
          {account.verificationStatus === 'rejected' && account.verificationNotes && (
            <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded-lg p-2">Reason: {account.verificationNotes}</p>
          )}
        </div>
        <button onClick={() => onDelete(account._id)} disabled={deleting === account._id}
          className="btn-ghost btn-icon text-gray-400 hover:text-red-500 flex-shrink-0" aria-label="Remove account">
          {deleting === account._id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
        </button>
      </div>
    </motion.div>
  )
}

function PayoutRow({ payout }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card">
      <button onClick={() => setExpanded(e => !e)} aria-expanded={expanded}
        className="w-full flex items-center gap-4 p-4 text-left">
        <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
          <IndianRupee className="w-4 h-4 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">{formatCurrency(payout.requestedAmount)}</span>
            <StatusBadge status={payout.status} config={PAYOUT_STATUS} />
          </div>
          <p className="text-xs text-gray-500 truncate">{payout.campaign?.title} · {formatDate(payout.createdAt)}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
            transition={{duration:0.2}} className="overflow-hidden border-t border-gray-100">
            <div className="p-4 grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div><p className="text-gray-400 font-medium mb-0.5">Account</p><p>{payout.payoutAccount?.bankName} ···{payout.payoutAccount?.accountNumberLast4}</p></div>
              <div><p className="text-gray-400 font-medium mb-0.5">Requested</p><p>{formatDate(payout.requestedAt || payout.createdAt)}</p></div>
              {payout.reviewedAt && <div><p className="text-gray-400 font-medium mb-0.5">Reviewed</p><p>{formatDate(payout.reviewedAt)}</p></div>}
              {payout.completedAt && <div><p className="text-gray-400 font-medium mb-0.5">Completed</p><p>{formatDate(payout.completedAt)}</p></div>}
              {payout.manualTransferReference && <div className="col-span-2"><p className="text-gray-400 font-medium mb-0.5">Transfer Ref</p><p className="font-mono">{payout.manualTransferReference}</p></div>}
              {payout.rejectionReason && <div className="col-span-2 bg-red-50 rounded-lg p-2 text-red-600"><p className="font-medium mb-0.5">Rejection Reason</p><p>{payout.rejectionReason}</p></div>}
              {payout.notes && <div className="col-span-2"><p className="text-gray-400 font-medium mb-0.5">Your Notes</p><p>{payout.notes}</p></div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PayoutPage() {
  const [tab, setTab] = useState('accounts')
  const [accounts, setAccounts] = useState([])
  const [payouts, setPayouts] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [accsRes, payoutsRes, balRes] = await Promise.all([
        payoutAccountService.getMyAccounts(),
        payoutService.getMyPayouts({ limit: 50 }),
        payoutService.getBalance(),
      ])
      setAccounts(accsRes.accounts || [])
      setPayouts(payoutsRes.payouts || [])
      setBalance(balRes)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payout data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this bank account?')) return
    setDeletingId(id)
    try {
      await payoutAccountService.deleteAccount(id)
      toast.success('Account removed')
      setAccounts(prev => prev.filter(a => a._id !== id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove account')
    } finally {
      setDeletingId(null)
    }
  }

  const bal = balance?.balance
  const verifiedAccounts = accounts.filter(a => a.verificationStatus === 'verified')

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bank &amp; Payout</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage bank accounts and withdraw campaign funds</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="btn-secondary btn-sm gap-1.5">
              <Plus className="w-4 h-4"/>Add Account
            </button>
            <button onClick={() => setShowPayoutModal(true)}
              disabled={verifiedAccounts.length === 0 || !(bal?.availableBalance > 0)}
              className="btn-accent btn-sm gap-1.5">
              <ArrowUpRight className="w-4 h-4"/>Request Payout
            </button>
          </div>
        </div>

        {bal && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Received', value: bal.totalReceived,    icon: Banknote,      color: 'text-green-600 bg-green-50'   },
              { label: 'Withdrawn',      value: bal.totalWithdrawn,   icon: ArrowUpRight,  color: 'text-blue-600 bg-blue-50'     },
              { label: 'Pending',        value: bal.pendingPayouts,   icon: Clock,         color: 'text-amber-600 bg-amber-50'   },
              { label: 'Available',      value: bal.availableBalance, icon: Wallet,        color: 'text-primary-600 bg-primary-50'},
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4">
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4"/>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(value || 0)}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="border-b border-gray-100 mb-5">
          <div className="flex gap-0" role="tablist">
            {[
              { id: 'accounts', label: 'Bank Accounts', icon: Building2 },
              { id: 'history',  label: 'Payout History', icon: History },
            ].map(t => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${tab === t.id ? 'border-primary-700 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <t.icon className="w-4 h-4"/>{t.label}
                {t.id === 'history' && payouts.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{payouts.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-11 h-11 bg-gray-100 rounded-xl"/>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/3"/>
                    <div className="h-3 bg-gray-100 rounded w-2/3"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3"/>
            <p className="text-gray-700 font-medium mb-3">{error}</p>
            <button onClick={fetchAll} className="btn-secondary btn-sm gap-1.5"><RefreshCw className="w-4 h-4"/>Retry</button>
          </div>
        ) : (
          <motion.div key={tab} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
            {tab === 'accounts' && (
              <div>
                {accounts.length === 0 ? (
                  <div className="card p-10 text-center border-dashed">
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-7 h-7 text-primary-400"/>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">No bank accounts yet</h3>
                    <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">Add a bank account to receive payouts from your fundraising campaigns.</p>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary gap-2"><Plus className="w-4 h-4"/>Add Bank Account</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {accounts.map(acc => <AccountCard key={acc._id} account={acc} onDelete={handleDelete} deleting={deletingId}/>)}
                    </AnimatePresence>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Account Verification Required</p>
                        <p className="text-xs text-blue-700 mt-0.5">Only verified accounts can receive payouts. Verification takes 1-2 business days.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab === 'history' && (
              <div>
                {payouts.length === 0 ? (
                  <div className="card p-10 text-center border-dashed">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                      <History className="w-7 h-7 text-teal-400"/>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">No payout requests yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">Request a payout from a campaign to see it tracked here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">{payouts.map(p => <PayoutRow key={p._id} payout={p}/>)}</div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <AddAccountModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchAll}/>
      <RequestPayoutModal open={showPayoutModal} onClose={() => setShowPayoutModal(false)} onSuccess={fetchAll} balance={balance} accounts={accounts}/>
    </DashboardLayout>
  )
}
