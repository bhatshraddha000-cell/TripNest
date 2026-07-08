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
  const [fieldErrors, setFieldErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

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
      await register(formData)
      setStatus({
        type: 'success',
        message: 'Registration successful. Redirecting you to login.',
      })
      window.setTimeout(() => navigate('/login'), 1200)
    } catch (error) {
      setFieldErrors(error.fieldErrors ?? {})
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Start your next shared escape."
      subtitle="Create your TripNest account to sync plans, people, and travel decisions in one place."
      footer={
        <p className="field-help">
          Already registered? <Link className="inline-link" to="/login">Sign in here</Link>.
        </p>
      }
    >
      <h2>Create account</h2>
      <p>Use your name, email, and a secure password to join TripNest.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            disabled={submitting || authLoading}
            autoComplete="name"
          />
          {fieldErrors.fullName ? <p className="field-error">{fieldErrors.fullName}</p> : null}
        </div>

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
            autoComplete="new-password"
          />
          {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
        </div>

        {status.message ? <p className={`status-message ${status.type}`}>{status.message}</p> : null}

        <button className="primary-button" type="submit" disabled={submitting || authLoading}>
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage
