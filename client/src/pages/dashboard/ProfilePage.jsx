import { useState, useEffect } from 'react'
import { Loader2, Save, Camera } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Avatar from '../../components/ui/Avatar'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import { INDIAN_STATES } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = await userService.updateMe(form)
      updateUser(data.user)
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your personal information</p>
        </div>

        <div className="card p-6 mb-6">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
            <div className="relative">
              <Avatar name={user?.name} src={user?.profileImage} size="xl" />
              <button
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-700 text-white flex items-center justify-center shadow-md hover:bg-primary-800 transition-colors"
                aria-label="Change profile photo"
                title="Change photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="badge-primary mt-1 capitalize">{user?.role}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="profile-name" className="label label-required">Full Name</label>
                <input
                  id="profile-name" type="text" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="profile-phone" className="label">Phone</label>
                <input
                  id="profile-phone" type="tel"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="input" placeholder="10-digit mobile number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-email" className="label">Email Address</label>
              <input
                id="profile-email" type="email" value={user?.email}
                className="input bg-gray-50 text-gray-500 cursor-not-allowed" disabled
              />
              <p className="field-hint">Email cannot be changed. Contact support if needed.</p>
            </div>

            <div>
              <label htmlFor="profile-location" className="label">State</label>
              <select
                id="profile-location"
                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="select"
              >
                <option value="">Select your state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="profile-bio" className="label">Short Bio</label>
              <textarea
                id="profile-bio"
                value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                className="input resize-none" rows={3}
                maxLength={300}
                placeholder="A brief description about yourself..."
              />
              <p className="field-hint text-right">{form.bio.length}/300</p>
            </div>

            <button type="submit" disabled={saving} className="btn-primary gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
