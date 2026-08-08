import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { InlineError } from '../components/common/StateComponents'
import { INDIAN_STATES } from '../utils/helpers'
import Logo from '../components/ui/Logo'
import logoImg from '../assets/logo.png'

const ROLES = [
  { id: 'donor', label: 'I want to donate', desc: 'Support causes and help people in need' },
  { id: 'fundraiser', label: 'I want to fundraise', desc: 'Create campaigns and raise funds' },
]

function FormField({ id, label, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className={`label ${required ? 'label-required' : ''}`}>{label}</label>
      {children}
      {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: 'donor', state: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = () => {
    const errors = {}
    if (!form.name.trim() || form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Please enter a valid email'
    if (!/^[6-9]\d{9}$/.test(form.phone)) errors.phone = 'Please enter a valid 10-digit Indian mobile number'
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    const result = await register({
      name: form.name.trim(),
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
      location: form.state,
    })
    setLoading(false)
    if (result.success) {
      navigate(result.user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:flex-1 bg-hero-gradient flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,255,255,0.05),transparent_60%)]" />
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center mx-auto mb-6 p-3">
            <img src={logoImg} alt="SaharaFund Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Join<br />
            <span className="text-accent-400">SaharaFund</span>
          </h1>
          <p className="text-primary-200 text-lg max-w-xs mx-auto leading-relaxed mb-8">
            Help people across India — whether you want to donate or raise funds for your cause.
          </p>
          <div className="space-y-3 text-left max-w-xs mx-auto">
            {['Free to create a fundraiser', 'Verified campaign process', 'Secure donations', 'Real-time tracking'].map(item => (
              <div key={item} className="flex items-center gap-3 text-primary-100 text-sm">
                <CheckCircle2 className="w-4 h-4 text-accent-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-start justify-center p-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-700 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {ROLES.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => setForm({ ...form, role: role.id })}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  form.role === role.id
                    ? 'border-primary-700 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`text-sm font-semibold mb-0.5 ${form.role === role.id ? 'text-primary-700' : 'text-gray-900'}`}>{role.label}</p>
                <p className="text-xs text-gray-500 leading-snug">{role.desc}</p>
              </button>
            ))}
          </div>

          {error && <div className="mb-4"><InlineError message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField id="name" label="Full Name" required error={fieldErrors.name}>
              <input
                id="name" type="text" autoComplete="name" required
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                placeholder="Rahul Sharma"
              />
            </FormField>

            <FormField id="email" label="Email Address" required error={fieldErrors.email}>
              <input
                id="email" type="email" autoComplete="email" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="rahul@example.com"
              />
            </FormField>

            <FormField id="phone" label="Mobile Number" required error={fieldErrors.phone}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</span>
                <input
                  id="phone" type="tel" autoComplete="tel" required
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className={`input pl-12 ${fieldErrors.phone ? 'input-error' : ''}`}
                  placeholder="9876543210" maxLength={10}
                />
              </div>
            </FormField>

            <FormField id="state" label="State">
              <select
                id="state"
                value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                className="select"
              >
                <option value="">Select your state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>

            <FormField id="password" label="Password" required error={fieldErrors.password}>
              <div className="relative">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className={`input pr-10 ${fieldErrors.password ? 'input-error' : ''}`}
                  placeholder="At least 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide' : 'Show'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <FormField id="confirmPassword" label="Confirm Password" required error={fieldErrors.confirmPassword}>
              <input
                id="confirmPassword" type="password" required
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className={`input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Repeat your password"
              />
            </FormField>

            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg gap-2 mt-2">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
              ) : (
                <>Create Account <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-gray-400">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="hover:text-primary-700 underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="hover:text-primary-700 underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
