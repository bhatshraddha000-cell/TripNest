import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import { api } from '../lib/api.js'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [fieldError, setFieldError] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim()) {
      setFieldError('Email is required')
      return
    }

    setSubmitting(true)
    setFieldError('')
    setStatus({ type: '', message: '' })

    try {
      const response = await api.post('/api/auth/forgot-password', { email })
      setStatus({
        type: 'success',
        message: response.data?.message ?? 'If an account exists for that email, a 6-digit OTP code has been sent.',
      })
      setOtpSent(true)
    } catch (error) {
      const payload = error?.response?.data
      const message = payload?.message ?? 'Unable to send OTP code right now.'
      setStatus({ type: 'error', message })
      if (payload?.errors?.email) {
        setFieldError(payload.errors.email)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="login-card-content">
        <h2 className="login-title">Forgot Password</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Enter your email address and we'll send a 6-digit OTP code to reset your password.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setFieldError('')
                setStatus({ type: '', message: '' })
              }}
              disabled={submitting}
              autoComplete="email"
            />
            {fieldError ? <p className="login-error">{fieldError}</p> : null}
          </div>

          {status.message ? <p className={`login-status ${status.type}`}>{status.message}</p> : null}

          {!otpSent ? (
            <button className="login-submit-btn" type="submit" disabled={submitting}>
              {submitting ? 'SENDING OTP...' : 'SEND OTP CODE'}
            </button>
          ) : (
            <button
              className="login-submit-btn"
              type="button"
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
            >
              ENTER OTP & RESET PASSWORD →
            </button>
          )}
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

export default ForgotPasswordPage
