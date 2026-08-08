import { useState } from 'react'
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { userService } from '../../services/userService'
import toast from 'react-hot-toast'

function PasswordInput({ id, label, value, onChange, show, onToggleShow, error, required }) {
  return (
    <div>
      <label htmlFor={id} className={`label ${required ? 'label-required' : ''}`}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={`input pr-10 ${error ? 'input-error' : ''}`}
          required={required}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Toggle password visibility"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}
    </div>
  )
}

export default function SecurityPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.currentPassword) errs.currentPassword = 'Current password is required'
    if (form.newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters'
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      await userService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      toast.success('Password changed successfully!')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Security</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account security settings</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-500">Update your password regularly for security</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              id="current-pw"
              label="Current Password"
              value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
              show={show.current}
              onToggleShow={() => setShow(s => ({ ...s, current: !s.current }))}
              error={errors.currentPassword}
              required
            />
            <PasswordInput
              id="new-pw"
              label="New Password"
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              show={show.new}
              onToggleShow={() => setShow(s => ({ ...s, new: !s.new }))}
              error={errors.newPassword}
              required
            />
            <PasswordInput
              id="confirm-pw"
              label="Confirm New Password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              show={show.confirm}
              onToggleShow={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
              error={errors.confirmPassword}
              required
            />

            <button type="submit" disabled={saving} className="btn-primary gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
