import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { isAdminUser } from '../lib/authUtils.js'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, authLoading, user } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated && !authLoading) {
    if (isAdminUser(user)) {
      return <Navigate to="/admin/dashboard" replace />
    }
    const requestedPath = location.state?.from?.pathname
    const destination = (requestedPath && requestedPath !== '/' && requestedPath !== '/login' && requestedPath !== '/dashboard')
      ? requestedPath
      : '/dashboard'
    return <Navigate to={destination} replace />
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    setStatus({ type: '', message: '' })

    try {
      const loginRes = await login(formData)
      const currentUser = loginRes?.user || user
      if (isAdminUser(currentUser)) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        const requestedPath = location.state?.from?.pathname
        const destination = (requestedPath && requestedPath !== '/' && requestedPath !== '/login' && requestedPath !== '/dashboard')
          ? requestedPath
          : '/dashboard'
        navigate(destination, { replace: true })
      }
    } catch (error) {
      setFieldErrors(error.fieldErrors ?? {})
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="login-card-content">
        <h2 className="login-title">Sign In</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email</label>
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={submitting || authLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
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
            <div className="forgot-link-wrapper">
              <Link className="login-forgot-link" to="/forgot-password">
                Forgot password?
              </Link>
            </div>
          </div>

          {status.message ? <p className={`login-status ${status.type}`}>{status.message}</p> : null}

          <button className="login-submit-btn" type="submit" disabled={submitting || authLoading}>
            {submitting ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>


        <div className="login-footer">
          <span>Are you new? </span>
          <Link className="login-create-link" to="/register">
            Create an Account
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
