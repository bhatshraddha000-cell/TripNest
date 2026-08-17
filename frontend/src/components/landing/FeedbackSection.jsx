import { useState, useEffect } from 'react'
import { feedbackApi } from '../../lib/feedbackApi.js'

function FeedbackSection() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [recentFeedbacks, setRecentFeedbacks] = useState([])
  const [loadingFeedback, setLoadingFeedback] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const fetchRecentFeedback = async () => {
    try {
      setLoadingFeedback(true)
      const data = await feedbackApi.getRecentFeedback()
      setRecentFeedbacks(data)
    } catch (err) {
      console.error('Failed to load recent feedback:', err)
    } finally {
      setLoadingFeedback(false)
    }
  }

  useEffect(() => {
    fetchRecentFeedback()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.')
      return
    }

    if (!message.trim() || message.trim().length < 5) {
      setErrorMsg('Feedback message must be at least 5 characters long.')
      return
    }

    try {
      setSubmitting(true)
      await feedbackApi.submitFeedback(email.trim(), message.trim())
      setSuccessMsg('Thank you for your feedback!')
      setMessage('')
      setEmail('')
      fetchRecentFeedback()
    } catch (err) {
      console.error('Feedback submission error:', err)
      const serverMessage = err.response?.data?.message || err.response?.data?.error
      if (serverMessage) {
        setErrorMsg(serverMessage)
      } else if (err.response?.status === 400 || err.response?.status === 404) {
        setErrorMsg('Only registered TripNest users can submit feedback.')
      } else {
        setErrorMsg('Only registered TripNest users can submit feedback.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="content-section feedback-section" style={{ padding: '60px 0' }}>
      <div className="section-heading" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <p className="eyebrow">FEEDBACK</p>
        <h2>What travelers say about TripNest.</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '8px auto 0' }}>
          Share your experience or read genuine feedback from verified TripNest community members.
        </p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Feedback Form Card */}
        <div
          className="testimonial-card"
          style={{
            padding: '36px',
            borderRadius: '24px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.35rem', fontWeight: 800 }}>Share Your Feedback</h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Enter your registered email address and let us know about your travel planning experience.
          </p>

          {successMsg && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontWeight: 700,
                marginBottom: '20px',
                fontSize: '0.95rem',
              }}
            >
              ✓ {successMsg}
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontWeight: 700,
                marginBottom: '20px',
                fontSize: '0.95rem',
              }}
            >
              ⚠ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="feedback-email" style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.88rem' }}>
                Email Address
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email (e.g. traveler@example.com)"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border, #cbd5e1)',
                  backgroundColor: 'var(--surface-strong, #ffffff)',
                  color: 'var(--text-primary, #1e293b)',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label htmlFor="feedback-message" style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.88rem' }}>
                Feedback Message
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write your feedback message here..."
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border, #cbd5e1)',
                  backgroundColor: 'var(--surface-strong, #ffffff)',
                  color: 'var(--text-primary, #1e293b)',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="primary-button"
              style={{
                alignSelf: 'flex-start',
                padding: '12px 28px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

        {/* Recent Feedback Display Grid */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <p className="eyebrow" style={{ margin: 0 }}>RECENT FEEDBACK</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800 }}>Latest Community Stories</h3>
          </div>

          {loadingFeedback ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Loading feedback...
            </div>
          ) : recentFeedbacks.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                borderRadius: '20px',
                backgroundColor: 'var(--surface)',
                border: '1px dashed var(--border)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              No feedback yet. Be the first to share your experience!
            </div>
          ) : (
            <div className="testimonials-grid">
              {recentFeedbacks.map((fb) => (
                <div key={fb.id} className="testimonial-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <p style={{ margin: '0 0 16px 0', fontStyle: 'italic', fontSize: '0.98rem', lineHeight: '1.6' }}>
                    "{fb.message}"
                  </p>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-primary, #1e293b)' }}>
                      {fb.userName}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)' }}>
                      Verified TripNest User
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default FeedbackSection
