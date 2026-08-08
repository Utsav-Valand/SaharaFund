import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { authService } from '../services/authService'
import { InlineError } from '../components/common/StateComponents'
import Logo from '../components/ui/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-success-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
                Check your spam folder if you don't see it within a few minutes.
              </p>
              <Link to="/login" className="btn-primary w-full gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot your password?</h2>
                <p className="text-gray-500 text-sm">Enter your email and we'll send you a link to reset your password.</p>
              </div>

              {error && <div className="mb-4"><InlineError message={error} /></div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="label label-required">Email Address</label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                  />
                </div>

                <button type="submit" disabled={loading || !email} className="btn-primary w-full gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link to="/login" className="text-sm text-gray-500 hover:text-primary-700 flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
