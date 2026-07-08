import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, authLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname ?? '/'

  if (isAuthenticated && !authLoading) {
    return <Navigate to={redirectTo} replace />
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
      await login(formData)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFieldErrors(error.fieldErrors ?? {})
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Pick up right where your plans left off."
      subtitle="Sign in to load your TripNest profile and continue managing your shared travel space."
      footer={
        <p className="field-help">
          Need an account? <Link className="inline-link" to="/register">Create one now</Link>.
        </p>
      }
    >
      <h2>Welcome back</h2>
      <p>Enter your TripNest credentials to unlock your dashboard.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={submitting || authLoading}
            autoComplete="email"
          />
          {fieldErrors.email ? <p className="field-error">{fieldErrors.email}</p> : null}
        </div>

        <div className="field-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            disabled={submitting || authLoading}
            autoComplete="current-password"
          />
          {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
        </div>

        {status.message ? <p className={`status-message ${status.type}`}>{status.message}</p> : null}

        <div className="form-footer">
          <button className="primary-button" type="submit" disabled={submitting || authLoading}>
            {submitting ? 'Signing in...' : 'Login'}
          </button>
          <Link className="ghost-link" to="/register">
            Create account
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
