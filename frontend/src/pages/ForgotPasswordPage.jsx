import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import { api } from '../lib/api.js'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [fieldError, setFieldError] = useState('')

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
      setStatus({ type: 'success', message: response.data?.message ?? 'Check your email for reset instructions.' })
      setEmail('')
    } catch (error) {
      const payload = error?.response?.data
      const message = payload?.message ?? 'Unable to send reset instructions right now.'
      setStatus({ type: 'error', message })
      if (payload?.errors?.email) {
        setFieldError(payload.errors.email)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we’ll send the reset link to the address on file."
      footer={
        <p className="field-help">
          Remembered it? <Link className="inline-link" to="/login">Back to login</Link>.
        </p>
      }
    >
      <h2>Forgot password</h2>
      <p>We’ll send a secure reset link to your inbox.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setFieldError('')
              setStatus({ type: '', message: '' })
            }}
            disabled={submitting}
            autoComplete="email"
          />
          {fieldError ? <p className="field-error">{fieldError}</p> : null}
        </div>

        {status.message ? <p className={`status-message ${status.type}`}>{status.message}</p> : null}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
