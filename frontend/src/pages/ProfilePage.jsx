import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api, getProfileImageUrl } from '../lib/api.js'

function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout, authLoading, isAuthenticated, loadCurrentUser, updateUser } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [previewAvatar, setPreviewAvatar] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [resetPasswordStatus, setResetPasswordStatus] = useState({ type: '', message: '' })

  const currentPhotoUrl = isPhotoRemoved
    ? ''
    : previewAvatar || getProfileImageUrl(user?.profileImage)

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

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const isValidType = validTypes.includes(file.type.toLowerCase()) || Boolean(file.name.match(/\.(jpg|jpeg|png|webp)$/i))

    if (!isValidType) {
      setStatus({ type: 'error', message: 'Invalid file format. Please upload a JPG, PNG, or WEBP image.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'File size exceeds maximum limit of 5MB.' })
      return
    }

    if (previewAvatar?.startsWith('blob:')) {
      URL.revokeObjectURL(previewAvatar)
    }

    setPreviewAvatar(URL.createObjectURL(file))
    setSelectedFile(file)
    setIsPhotoRemoved(false)
    setIsEditing(true)
    setStatus({ type: '', message: '' })
  }

  function handleRemoveAvatar() {
    if (previewAvatar?.startsWith('blob:')) {
      URL.revokeObjectURL(previewAvatar)
    }
    setPreviewAvatar('')
    setSelectedFile(null)
    setIsPhotoRemoved(true)
    setIsEditing(true)
    setStatus({ type: '', message: '' })
  }

  function resetProfileForm() {
    setFullName(user?.fullName ?? '')
    if (previewAvatar?.startsWith('blob:')) {
      URL.revokeObjectURL(previewAvatar)
    }
    setPreviewAvatar('')
    setSelectedFile(null)
    setIsPhotoRemoved(false)
    setIsEditing(false)
    setStatus({ type: '', message: '' })
  }

  async function handleSaveChanges(event) {
    event.preventDefault()
    if (saving) return

    if (!fullName || !fullName.trim()) {
      setStatus({ type: 'error', message: 'Full name cannot be blank.' })
      return
    }

    setSaving(true)
    setStatus({ type: '', message: '' })

    try {
      let updatedProfileResponse = null

      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const photoRes = await api.post('/api/users/me/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        updatedProfileResponse = photoRes.data
      } else if (isPhotoRemoved && user?.profileImage) {
        const photoRes = await api.delete('/api/users/me/photo')
        updatedProfileResponse = photoRes.data
      }

      const trimmedName = fullName.trim()
      if (trimmedName !== user?.fullName || !updatedProfileResponse) {
        const nameRes = await api.put('/api/users/me', {
          fullName: trimmedName,
        })
        updatedProfileResponse = nameRes.data
      }

      if (updatedProfileResponse) {
        updateUser(updatedProfileResponse)
      }

      if (previewAvatar?.startsWith('blob:')) {
        URL.revokeObjectURL(previewAvatar)
      }
      setPreviewAvatar('')
      setSelectedFile(null)
      setIsPhotoRemoved(false)
      setIsEditing(false)
      setStatus({ type: 'success', message: 'Profile updated successfully.' })
    } catch (error) {
      const message = error?.response?.data?.message ?? error?.message ?? 'Unable to save your profile right now.'
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
      navigate(`/reset-password?email=${encodeURIComponent(user?.email ?? '')}`)
    } catch (error) {
      const message = error?.response?.data?.message ?? 'Unable to send password reset OTP code right now.'
      setResetPasswordStatus({ type: 'error', message })
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
                      {currentPhotoUrl ? (
                        <img src={currentPhotoUrl} alt="Profile photo" />
                      ) : (
                        <span>{initials || 'TN'}</span>
                      )}
                    </div>

                    {!currentPhotoUrl ? (
                      <label className="secondary-button profile-upload" htmlFor="avatar-upload">
                        Upload Photo
                      </label>
                    ) : (
                      <button className="secondary-button profile-upload" type="button" onClick={handleRemoveAvatar}>
                        Remove Photo
                      </button>
                    )}

                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
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

                <div className="profile-right-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

                  <div className="profile-card profile-security" style={{ marginTop: 0 }}>
                    <div className="security-header">
                      <h3>🔒 Password & Security</h3>
                      <p>Send an OTP code to your registered email address to reset your password.</p>
                    </div>

                    {resetPasswordStatus.message ? (
                      <p className={`status-message ${resetPasswordStatus.type}`}>{resetPasswordStatus.message}</p>
                    ) : null}

                    <div className="security-actions">
                      <button
                        className="primary-button security-btn"
                        type="button"
                        onClick={handleResetPassword}
                        disabled={resetPasswordLoading}
                      >
                        {resetPasswordLoading ? 'Sending OTP...' : 'Change Password'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
