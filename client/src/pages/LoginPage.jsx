import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { InlineError } from '../components/common/StateComponents'
import Logo from '../components/ui/Logo'
import logoImg from '../assets/logo.png'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/dashboard'
  const sessionExpired = new URLSearchParams(location.search).get('session') === 'expired'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(form)
    setLoading(false)
    if (result.success) {
      navigate(result.user?.role === 'admin' ? '/admin' : from, { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:flex-1 bg-hero-gradient flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent_60%)]" />
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center mx-auto mb-6 p-3">
            <img src={logoImg} alt="SaharaFund Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Welcome back to<br />
            <span className="text-accent-400">SaharaFund</span>
          </h1>
          <p className="text-primary-200 text-lg max-w-xs mx-auto leading-relaxed">
            Continue supporting causes that matter across India.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your account</h2>
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-700 font-semibold hover:underline">Create one free</Link>
            </p>
          </div>

          {sessionExpired && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-sm">
              Your session has expired. Please sign in again.
            </div>
          )}

          {error && <div className="mb-4"><InlineError message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="label label-required">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0 label-required">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-700 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="btn-primary w-full btn-lg gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="hover:text-primary-700 underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="hover:text-primary-700 underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
