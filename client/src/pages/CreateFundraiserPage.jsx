import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, ChevronLeft, Check, Loader2, Upload, X, Eye,
  FileText, Camera, ShieldCheck, ClipboardList, Send, Info
} from 'lucide-react'
import PublicLayout from '../components/layout/PublicLayout'
import { campaignService } from '../services/campaignService'
import { CATEGORIES, INDIAN_STATES } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, label: 'Basics', icon: FileText, desc: 'Title, category & goal' },
  { id: 2, label: 'Story', icon: ClipboardList, desc: 'Tell your story' },
  { id: 3, label: 'Media', icon: Camera, desc: 'Photos & documents' },
  { id: 4, label: 'Verification', icon: ShieldCheck, desc: 'Identity details' },
  { id: 5, label: 'Review', icon: Eye, desc: 'Preview your campaign' },
  { id: 6, label: 'Submit', icon: Send, desc: 'Go for review' },
]

const EMPTY_FORM = {
  // Step 1
  title: '', category: '', state: '', city: '', goalAmount: '', deadline: '',
  // Step 2
  description: '', reason: '', beneficiaryName: '', beneficiaryRelation: '',
  // Step 3
  coverImageFile: null, coverImagePreview: '', galleryFiles: [],
  // Step 4
  verifierName: '', verifierPhone: '', verifierEmail: '', idType: '', idNumber: '',
}

function FieldError({ error }) {
  if (!error) return null
  return <p className="field-error">{error}</p>
}

export default function CreateFundraiserPage() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState(null)
  const [errors, setErrors] = useState({})

  const updateForm = (updates) => setForm(prev => ({ ...prev, ...updates }))

  // Validation per step
  const validateStep = (s) => {
    const errs = {}
    if (s === 1) {
      if (!form.title.trim()) errs.title = 'Title is required'
      else if (form.title.trim().length < 10) errs.title = 'Title must be at least 10 characters'
      if (!form.category) errs.category = 'Please select a category'
      if (!form.state) errs.state = 'Please select a state'
      if (!form.goalAmount || Number(form.goalAmount) < 1000) errs.goalAmount = 'Goal must be at least ₹1,000'
    }
    if (s === 2) {
      if (!form.description.trim() || form.description.trim().length < 100) errs.description = 'Please write at least 100 characters about your campaign'
      if (!form.beneficiaryName.trim()) errs.beneficiaryName = 'Beneficiary name is required'
    }
    if (s === 4) {
      if (!form.verifierName.trim()) errs.verifierName = 'Your full name is required'
      if (!/^[6-9]\d{9}$/.test(form.verifierPhone)) errs.verifierPhone = 'Enter a valid 10-digit mobile number'
      if (!form.idType) errs.idType = 'Please select an ID type'
      if (!form.idNumber.trim()) errs.idNumber = 'ID number is required'
    }
    return errs
  }

  const nextStep = () => {
    const errs = validateStep(step)
    setErrors(errs)
    if (Object.keys(errs).length === 0) setStep(s => Math.min(s + 1, 6))
  }

  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        location: `${form.city ? form.city + ', ' : ''}${form.state}`,
        goalAmount: Number(form.goalAmount),
        deadline: form.deadline || undefined,
        description: form.description.trim(),
        beneficiaryName: form.beneficiaryName.trim(),
        beneficiaryRelation: form.beneficiaryRelation,
        verificationInfo: {
          name: form.verifierName,
          phone: form.verifierPhone,
          email: form.verifierEmail,
          idType: form.idType,
          idNumber: form.idNumber,
        },
      }
      const data = await campaignService.createCampaign(payload)
      setCreatedId(data.campaign._id)
      setStep(6)
      toast.success('Campaign submitted for review!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container-lg py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Your Fundraiser</h1>
            <p className="text-gray-500 text-sm">Your campaign will be reviewed before going live — usually within 24–48 hours.</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-start justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`step-number ${
                    step > s.id ? 'step-number-completed' :
                    step === s.id ? 'step-number-active' : 'step-number-inactive'
                  }`}>
                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className={`text-xs font-semibold ${step === s.id ? 'text-primary-700' : step > s.id ? 'text-gray-600' : 'text-gray-400'}`}>
                      {s.label}
                    </p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-16 mx-2 mt-4 flex-shrink-0 rounded-full transition-colors ${step > s.id ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="card p-6 md:p-8 max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* ---- STEP 1: BASICS ---- */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Campaign Basics</h2>
                      <p className="text-sm text-gray-500">Give your campaign a strong title and clear goal.</p>
                    </div>

                    <div>
                      <label htmlFor="title" className="label label-required">Campaign Title</label>
                      <input
                        id="title" type="text" value={form.title}
                        onChange={e => updateForm({ title: e.target.value })}
                        className={`input ${errors.title ? 'input-error' : ''}`}
                        placeholder='e.g. "Help Priya fight cancer — she needs you"'
                        maxLength={150}
                      />
                      <div className="flex justify-between mt-1">
                        <FieldError error={errors.title} />
                        <p className="text-xs text-gray-400 ml-auto">{form.title.length}/150</p>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="category" className="label label-required">Category</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => updateForm({ category: cat.id })}
                            className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-2 transition-all ${
                              form.category === cat.id
                                ? 'border-primary-700 bg-primary-50 text-primary-700 ring-2 ring-primary-700/20'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <img src={cat.icon} alt="" className="w-8 h-8 object-contain" />
                            <span className="text-center leading-tight">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                      <FieldError error={errors.category} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="state" className="label label-required">State</label>
                        <select id="state" value={form.state} onChange={e => updateForm({ state: e.target.value })} className={`select ${errors.state ? 'input-error' : ''}`}>
                          <option value="">Select state</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <FieldError error={errors.state} />
                      </div>
                      <div>
                        <label htmlFor="city" className="label">City / Town</label>
                        <input id="city" type="text" value={form.city} onChange={e => updateForm({ city: e.target.value })} className="input" placeholder="e.g. Vadodara" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="goalAmount" className="label label-required">Fundraising Goal (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                          <input
                            id="goalAmount" type="number" min="1000" value={form.goalAmount}
                            onChange={e => updateForm({ goalAmount: e.target.value })}
                            className={`input pl-8 ${errors.goalAmount ? 'input-error' : ''}`}
                            placeholder="50000"
                          />
                        </div>
                        <FieldError error={errors.goalAmount} />
                      </div>
                      <div>
                        <label htmlFor="deadline" className="label">Campaign Deadline</label>
                        <input
                          id="deadline" type="date" value={form.deadline}
                          min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                          onChange={e => updateForm({ deadline: e.target.value })}
                          className="input"
                        />
                        <p className="field-hint">Optional — leave blank for no deadline</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- STEP 2: STORY ---- */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Your Campaign Story</h2>
                      <p className="text-sm text-gray-500">Tell donors why you need their help. Be honest, clear, and specific.</p>
                    </div>

                    <div>
                      <label htmlFor="description" className="label label-required">Campaign Description</label>
                      <textarea
                        id="description" value={form.description}
                        onChange={e => updateForm({ description: e.target.value })}
                        className={`input resize-none ${errors.description ? 'input-error' : ''}`}
                        rows={8}
                        placeholder="Describe the situation in detail. What happened? Who is affected? How will the funds be used? What will change if you reach your goal?"
                        maxLength={5000}
                      />
                      <div className="flex justify-between mt-1">
                        <FieldError error={errors.description} />
                        <p className="text-xs text-gray-400 ml-auto">{form.description.length}/5000</p>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reason" className="label">Primary Reason for Fundraising</label>
                      <input
                        id="reason" type="text" value={form.reason}
                        onChange={e => updateForm({ reason: e.target.value })}
                        className="input"
                        placeholder='e.g. "Cancer treatment costs — ₹5L needed in 2 months"'
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="beneficiaryName" className="label label-required">Beneficiary Name</label>
                        <input
                          id="beneficiaryName" type="text" value={form.beneficiaryName}
                          onChange={e => updateForm({ beneficiaryName: e.target.value })}
                          className={`input ${errors.beneficiaryName ? 'input-error' : ''}`}
                          placeholder="Full name of the person being helped"
                        />
                        <FieldError error={errors.beneficiaryName} />
                      </div>
                      <div>
                        <label htmlFor="beneficiaryRelation" className="label">Your Relation to Beneficiary</label>
                        <select
                          id="beneficiaryRelation" value={form.beneficiaryRelation}
                          onChange={e => updateForm({ beneficiaryRelation: e.target.value })}
                          className="select"
                        >
                          <option value="">Select</option>
                          {['Myself', 'Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Neighbour', 'Other'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs text-blue-700 flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Campaigns with detailed, honest stories receive 3x more donations. Include specific costs, timelines, and what life will look like after the campaign succeeds.</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* ---- STEP 3: MEDIA ---- */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Campaign Media</h2>
                      <p className="text-sm text-gray-500">Add a cover photo and any supporting documents to build trust.</p>
                    </div>

                    {/* Cover Image */}
                    <div>
                      <label className="label">Cover Photo</label>
                      <div
                        className={`relative border-2 border-dashed rounded-2xl transition-colors ${form.coverImagePreview ? 'border-primary-300 bg-primary-50' : 'border-gray-300 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/30'} cursor-pointer`}
                        onClick={() => document.getElementById('cover-upload').click()}
                        onKeyDown={(e) => e.key === 'Enter' && document.getElementById('cover-upload').click()}
                        tabIndex={0}
                        role="button"
                        aria-label="Upload cover photo"
                      >
                        {form.coverImagePreview ? (
                          <div className="relative">
                            <img src={form.coverImagePreview} alt="Cover preview" className="w-full h-52 object-cover rounded-2xl" />
                            <button
                              onClick={(e) => { e.stopPropagation(); updateForm({ coverImageFile: null, coverImagePreview: '' }) }}
                              className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                              aria-label="Remove cover image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
                            <Camera className="w-10 h-10" />
                            <div className="text-center">
                              <p className="text-sm font-medium">Click to upload cover photo</p>
                              <p className="text-xs mt-0.5">JPG, PNG, WebP — max 10MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            updateForm({
                              coverImageFile: file,
                              coverImagePreview: URL.createObjectURL(file),
                            })
                          }
                        }}
                      />
                    </div>

                    {/* Supporting Docs Note */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-xs text-amber-700 flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Medical reports, hospital bills, admission letters, or other documents can be uploaded after campaign creation in your dashboard to strengthen your campaign.</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* ---- STEP 4: VERIFICATION ---- */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Verification Details</h2>
                      <p className="text-sm text-gray-500">This information is used to verify your identity. It is never shown publicly.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="v-name" className="label label-required">Your Full Name</label>
                        <input
                          id="v-name" type="text" value={form.verifierName}
                          onChange={e => updateForm({ verifierName: e.target.value })}
                          className={`input ${errors.verifierName ? 'input-error' : ''}`}
                          placeholder="As on government ID"
                        />
                        <FieldError error={errors.verifierName} />
                      </div>
                      <div>
                        <label htmlFor="v-phone" className="label label-required">Mobile Number</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</span>
                          <input
                            id="v-phone" type="tel" maxLength={10} value={form.verifierPhone}
                            onChange={e => updateForm({ verifierPhone: e.target.value })}
                            className={`input pl-12 ${errors.verifierPhone ? 'input-error' : ''}`}
                            placeholder="9876543210"
                          />
                        </div>
                        <FieldError error={errors.verifierPhone} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="v-email" className="label">Email Address</label>
                      <input
                        id="v-email" type="email" value={form.verifierEmail}
                        onChange={e => updateForm({ verifierEmail: e.target.value })}
                        className="input" placeholder="For verification updates"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="id-type" className="label label-required">Government ID Type</label>
                        <select
                          id="id-type" value={form.idType}
                          onChange={e => updateForm({ idType: e.target.value })}
                          className={`select ${errors.idType ? 'input-error' : ''}`}
                        >
                          <option value="">Select ID</option>
                          {['Aadhaar Card', 'PAN Card', 'Voter ID', 'Passport', 'Driving Licence'].map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                        <FieldError error={errors.idType} />
                      </div>
                      <div>
                        <label htmlFor="id-number" className="label label-required">ID Number</label>
                        <input
                          id="id-number" type="text" value={form.idNumber}
                          onChange={e => updateForm({ idNumber: e.target.value.toUpperCase() })}
                          className={`input font-mono tracking-wider ${errors.idNumber ? 'input-error' : ''}`}
                          placeholder="Enter ID number"
                        />
                        <FieldError error={errors.idNumber} />
                      </div>
                    </div>

                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                      <p className="text-xs text-primary-700 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Your identity information is encrypted and stored securely. It is only accessed by our verification team and never shared with donors or third parties.</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* ---- STEP 5: REVIEW ---- */}
                {step === 5 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Review Your Campaign</h2>
                      <p className="text-sm text-gray-500">Check everything before submitting for review.</p>
                    </div>

                    <div className="card bg-gray-50 border-gray-100 overflow-hidden">
                      {form.coverImagePreview && (
                        <img src={form.coverImagePreview} alt="Preview" className="w-full h-40 object-cover" />
                      )}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <img src={CATEGORIES.find(c => c.id === form.category)?.icon} alt="" className="w-5 h-5 object-contain" />
                          <span className="badge-primary text-xs">{CATEGORIES.find(c => c.id === form.category)?.label}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{form.title || 'No title'}</h3>
                        <p className="text-sm text-gray-500 mb-3">{form.city ? `${form.city}, ` : ''}{form.state}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-extrabold text-primary-700">₹{Number(form.goalAmount || 0).toLocaleString('en-IN')}</span>
                          <span className="text-xs text-gray-400">Goal Amount</span>
                        </div>
                        <div className="divider" />
                        <p className="text-sm text-gray-600 line-clamp-3">{form.description || 'No description'}</p>
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                          Beneficiary: <strong className="text-gray-700">{form.beneficiaryName || '—'}</strong>
                          {form.beneficiaryRelation && ` (${form.beneficiaryRelation})`}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs text-blue-700 leading-relaxed">
                        <strong>What happens next:</strong> After submission, your campaign goes through our automated fraud check followed by manual admin review. This usually takes 24–48 hours. You'll be notified by email when your campaign is approved or if we need more information.
                      </p>
                    </div>
                  </div>
                )}

                {/* ---- STEP 6: SUCCESS ---- */}
                {step === 6 && (
                  <div className="text-center py-4">
                    <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-5">
                      <Check className="w-10 h-10 text-success-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Submitted!</h2>
                    <p className="text-gray-500 mb-1">
                      Your campaign is now under review. Our team will verify your information within <strong>24–48 hours</strong>.
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                      You'll receive an email notification when your campaign is approved and goes live.
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-2">
                      <p className="text-sm font-medium text-gray-700">Campaign Pipeline:</p>
                      {[
                        { label: 'Submitted', done: true },
                        { label: 'Automated Fraud Check', done: false },
                        { label: 'Admin Review', done: false },
                        { label: 'Campaign Goes Live', done: false },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-success-500' : 'bg-gray-200'}`}>
                            {item.done ? <Check className="w-3 h-3 text-white" /> : <span className="w-2 h-2 rounded-full bg-gray-400" />}
                          </div>
                          <span className={item.done ? 'text-gray-900 font-medium' : 'text-gray-400'}>{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3">
                      {createdId && (
                        <button
                          onClick={() => navigate(`/dashboard/campaigns`)}
                          className="btn-primary w-full gap-2"
                        >
                          View My Campaigns
                        </button>
                      )}
                      <button onClick={() => navigate('/')} className="btn-secondary w-full">
                        Back to Home
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {step < 6 && (
              <div className={`flex mt-8 pt-5 border-t border-gray-100 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                {step > 1 && (
                  <button onClick={prevStep} className="btn-secondary gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}

                {step < 5 ? (
                  <button onClick={nextStep} className="btn-primary gap-2">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : step === 5 ? (
                  <button onClick={handleSubmit} disabled={submitting} className="btn-accent gap-2">
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Submit for Review</>
                    )}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
