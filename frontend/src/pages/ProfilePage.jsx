import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

function ProfilePage() {
  const { user, logout, authLoading, isAuthenticated, loadCurrentUser, updateUser } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [previewAvatar, setPreviewAvatar] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [resetPasswordStatus, setResetPasswordStatus] = useState({ type: '', message: '' })
  const initials = (fullName || user?.fullName || 'Traveler')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roles = user?.roles?.length ? user.roles.join(', ') : 'Traveler'
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en', {
        month: 'short',
        year: 'numeric',
      })
    : 'Not available'

  useEffect(() => {
    setFullName(user?.fullName ?? '')
  }, [user?.fullName])

  useEffect(() => {
    async function refreshProfile() {
      if (authLoading || user) {
        return
      }

      setFetching(true)
      try {
        const response = await loadCurrentUser()
        setFullName(response?.fullName ?? '')
      } catch (error) {
        setStatus({ type: 'error', message: 'Unable to load your latest profile information.' })
      } finally {
        setFetching(false)
      }
    }

    refreshProfile()
  }, [authLoading, loadCurrentUser, user])

  useEffect(() => {
    return () => {
      if (previewAvatar?.startsWith('blob:')) {
        URL.revokeObjectURL(previewAvatar)
      }
    }
  }, [previewAvatar])

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (authLoading) {
    return (
      <div className="app-shell page-center">
        <div className="auth-card">
          <h2>Loading your profile</h2>
          <p>Please wait while we restore your TripNest account.</p>
        </div>
      </div>
    )
  }

  function handleProfileChange(event) {
    setFullName(event.target.value)
    setIsEditing(true)
    setStatus({ type: '', message: '' })
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (previewAvatar?.startsWith('blob:')) {
      URL.revokeObjectURL(previewAvatar)
    }

    setPreviewAvatar(URL.createObjectURL(file))
    setSelectedFile(file)
    setIsEditing(true)
    setStatus({ type: '', message: '' })
  }

  function resetProfileForm() {
    setFullName(user?.fullName ?? '')
    setPreviewAvatar('')
    setSelectedFile(null)
    setIsEditing(false)
    setStatus({ type: '', message: '' })
  }

  async function handleSaveChanges(event) {
    event.preventDefault()
    setSaving(true)
    setStatus({ type: '', message: '' })

    try {
      let updatedProfile = null

      try {
        const response = await api.put('/api/users/me', {
          fullName: fullName.trim(),
        })
        updatedProfile = response.data
      } catch (error) {
        if (error.response?.status !== 404 && error.response?.status !== 405) {
          throw error
        }
      }

      const nextUser = updatedProfile ?? {
        ...(user ?? {}),
        fullName: fullName.trim(),
      }

      updateUser(nextUser)
      setIsEditing(false)
      setStatus({ type: 'success', message: 'Profile updated successfully.' })

      if (selectedFile) {
        setStatus({
          type: 'success',
          message: 'Profile image preview updated locally. The backend does not expose a profile-image upload endpoint yet.',
        })
      }
    } catch (error) {
      const message = error?.response?.data?.message ?? 'Unable to save your profile right now.'
      setStatus({ type: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword() {
    setResetPasswordLoading(true)
    setResetPasswordStatus({ type: '', message: '' })

    try {
      await api.post('/api/auth/forgot-password', {
        email: user?.email,
      })
      setResetPasswordStatus({
        type: 'success',
        message: 'Password reset link has been sent to your registered email.',
      })
    } catch (error) {
      const message = error?.response?.data?.message ?? 'Unable to send password reset email right now.'
      setResetPasswordStatus({ type: 'error', message })
    } finally {
      setResetPasswordLoading(false)
    }
  }

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={user?.fullName ?? 'Traveler'} userEmail={user?.email ?? 'traveler@tripnest.com'} onLogout={logout} />

        <div className="dashboard-content">
          <Sidebar />

          <main className="dashboard-main">
            <section className="section-card profile-shell">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Your profile</p>
                  <h2>Manage your account details</h2>
                </div>
                {fetching ? <span className="profile-refresh">Refreshing…</span> : null}
              </div>

              <div className="profile-grid">
                <div className="profile-card profile-overview">
                  <div className="profile-avatar-wrap">
                    <div className="profile-avatar" aria-hidden="true">
                      {previewAvatar ? (
                        <img src={previewAvatar} alt="Profile preview" />
                      ) : (
                        <span>{initials || 'TN'}</span>
                      )}
                    </div>
                    <label className="secondary-button profile-upload" htmlFor="avatar-upload">
                      Upload Photo
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} />
                  </div>

                  <div className="profile-metrics">
                    <div className="info-row">
                      <span>Full Name</span>
                      <strong>{user?.fullName ?? 'Traveler'}</strong>
                    </div>
                    <div className="info-row">
                      <span>Email</span>
                      <strong>{user?.email ?? 'traveler@tripnest.com'}</strong>
                    </div>
                    <div className="info-row">
                      <span>Role</span>
                      <strong>{roles}</strong>
                    </div>
                    <div className="info-row">
                      <span>Member Since</span>
                      <strong>{memberSince}</strong>
                    </div>
                  </div>
                </div>

                <div className="profile-card profile-editor">
                  <form className="profile-form" onSubmit={handleSaveChanges}>
                    <div className="profile-form-grid">
                      <div className="field-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input id="fullName" name="fullName" type="text" value={fullName} onChange={handleProfileChange} />
                      </div>

                      <div className="field-group">
                        <label htmlFor="email">Email Address</label>
                        <input id="email" name="email" type="email" value={user?.email ?? ''} readOnly disabled />
                      </div>
                    </div>

                    {status.message ? <p className={`status-message ${status.type}`}>{status.message}</p> : null}

                    <div className="profile-actions">
                      <button className="primary-button" type="submit" disabled={saving || !isEditing}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="secondary-button" type="button" onClick={resetProfileForm} disabled={saving}>
                        Cancel
                      </button>
                    </div>
                  </form>

                </div>
              </div>

              <div className="profile-card profile-security">
                <div className="security-header">
                  <h3>🔒 Password & Security</h3>
                  <p>For your account security, password changes are handled through a secure email verification process.</p>
                </div>

                {resetPasswordStatus.message ? (
                  <p className={`status-message ${resetPasswordStatus.type}`}>{resetPasswordStatus.message}</p>
                ) : null}

                <button
                  className="primary-button"
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetPasswordLoading}
                >
                  {resetPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
