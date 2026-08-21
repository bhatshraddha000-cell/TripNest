import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import { api } from '../lib/api.js'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const emailParam = searchParams.get('email') || ''
  const otpParam = searchParams.get('otp') || ''
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: emailParam,
    otp: otpParam,
    newPassword: '',
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const errors = {}
    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    }
    if (!formData.otp.trim() || formData.otp.length !== 6) {
      errors.otp = 'A valid 6-digit OTP code is required'
    }
    if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long'
    }
    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      const response = await api.post('/api/auth/reset-password', {
        email: formData.email,
        token: formData.otp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      })
      setStatus({ type: 'success', message: response.data?.message ?? 'Password reset successfully!' })
      setFormData({ email: '', otp: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (error) {
      const payload = error?.response?.data
      const message = payload?.message ?? 'Unable to reset password right now.'
      setStatus({ type: 'error', message })
      if (payload?.errors) {
        setFieldErrors(payload.errors)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="login-card-content">
        <h2 className="login-title">Reset Password</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Enter the 6-digit OTP verification code from your email and set your new password.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
              autoComplete="email"
            />
            {fieldErrors.email ? <p className="login-error">{fieldErrors.email}</p> : null}
          </div>

          <div className="login-field">
            <label htmlFor="otp">Verification Code (OTP)</label>
            <input
              id="otp"
              name="otp"
              type="text"
              placeholder="6-digit OTP code"
              maxLength={6}
              value={formData.otp}
              onChange={handleChange}
              disabled={submitting}
              style={{ letterSpacing: '3px', fontWeight: 'bold', fontSize: '1.1rem' }}
            />
            {fieldErrors.otp || fieldErrors.token ? (
              <p className="login-error">{fieldErrors.otp || fieldErrors.token}</p>
            ) : null}
          </div>

          <div className="login-field">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password (min 8 chars)"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={submitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.newPassword ? <p className="login-error">{fieldErrors.newPassword}</p> : null}
          </div>

          <div className="login-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={submitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword ? <p className="login-error">{fieldErrors.confirmPassword}</p> : null}
          </div>

          {status.message ? <p className={`login-status ${status.type}`}>{status.message}</p> : null}

          <button className="login-submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'RESETTING PASSWORD...' : 'RESET PASSWORD'}
          </button>
        </form>

        <div className="login-footer">
          <span>Remembered your password? </span>
          <Link className="login-create-link" to="/login">
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default ResetPasswordPage
