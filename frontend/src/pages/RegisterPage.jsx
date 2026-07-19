import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function RegisterPage() {
  const navigate = useNavigate()
  const { register, authLoading } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setStatus({ type: '', message: '' })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const errors = {}
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    setFieldErrors({})
    setStatus({ type: '', message: '' })

    try {
      await register(formData)
      setStatus({
        type: 'success',
        message: 'Registration successful! Redirecting you to login.',
      })
      window.setTimeout(() => navigate('/login'), 1200)
    } catch (error) {
      const fieldErrs = error.fieldErrors ?? {}
      setFieldErrors(fieldErrs)
      setStatus({ type: 'error', message: error.message ?? 'Registration failed' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="login-card-content">
        <h2 className="login-title">Create Account</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              disabled={submitting || authLoading}
              autoComplete="name"
            />
            {fieldErrors.fullName ? <p className="login-error">{fieldErrors.fullName}</p> : null}
          </div>

          <div className="login-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting || authLoading}
              autoComplete="email"
            />
            {fieldErrors.email ? <p className="login-error">{fieldErrors.email}</p> : null}
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password (min 8 chars)"
                value={formData.password}
                onChange={handleChange}
                disabled={submitting || authLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
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
            {fieldErrors.password ? <p className="login-error">{fieldErrors.password}</p> : null}
          </div>

          {status.message ? <p className={`login-status ${status.type}`}>{status.message}</p> : null}

          <button className="login-submit-btn" type="submit" disabled={submitting || authLoading}>
            {submitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="login-footer">
          <span>Already registered? </span>
          <Link className="login-create-link" to="/login">
            Sign In Here
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
