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
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const password = formData.password || ''
  const pwdChecks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
  const isPasswordValid = Object.values(pwdChecks).every(Boolean)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setStatus({ type: '', message: '' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setHasAttemptedSubmit(true)

    const errors = {}
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    }

    if (!isPasswordValid) {
      errors.password = 'Please satisfy the missing password requirements above.'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    setFieldErrors({})
    setStatus({ type: '', message: '' })

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      })
      setStatus({
        type: 'success',
        message: 'Registration successful! Redirecting you to login.',
      })
      window.setTimeout(() => navigate('/login'), 1200)
    } catch (error) {
      const fieldErrs = error.fieldErrors ?? {}
      setFieldErrors(fieldErrs)
      setStatus({
        type: 'error',
        message: error.message ?? 'Password is too weak. It must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.',
      })
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
                placeholder="Create a strong password"
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

            {hasAttemptedSubmit && !isPasswordValid ? (
              <div className="password-requirements-checklist">
                <p className="checklist-title">PASSWORD MUST CONTAIN:</p>
                <ul className="checklist-items">
                  {!pwdChecks.length ? (
                    <li className="invalid">
                      <span className="check-icon">○</span> At least 8 characters
                    </li>
                  ) : null}
                  {!pwdChecks.hasUpper ? (
                    <li className="invalid">
                      <span className="check-icon">○</span> One uppercase letter (A-Z)
                    </li>
                  ) : null}
                  {!pwdChecks.hasLower ? (
                    <li className="invalid">
                      <span className="check-icon">○</span> One lowercase letter (a-z)
                    </li>
                  ) : null}
                  {!pwdChecks.hasNumber ? (
                    <li className="invalid">
                      <span className="check-icon">○</span> One number (0-9)
                    </li>
                  ) : null}
                  {!pwdChecks.hasSpecial ? (
                    <li className="invalid">
                      <span className="check-icon">○</span> One special character (!@#$%^&*)
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            {fieldErrors.password ? <p className="login-error">{fieldErrors.password}</p> : null}
          </div>

          <div className="login-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={submitting || authLoading}
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
