import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'

function CreateTripPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    budget: '',
    description: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: name === 'travelers' ? parseInt(value, 10) || 1 : value
    }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setGeneralError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    setGeneralError('')

    const errors = {}
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.destination.trim()) errors.destination = 'Destination is required'
    if (!formData.startDate) errors.startDate = 'Start date is required'
    if (!formData.endDate) errors.endDate = 'End date is required'
    if (formData.travelers < 1) errors.travelers = 'Travelers count must be at least 1'
    if (formData.budget === '' || parseFloat(formData.budget) < 0) {
      errors.budget = 'Budget cannot be negative'
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (end < start) {
        errors.endDate = 'End date cannot be before start date'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        ...formData,
        budget: parseFloat(formData.budget)
      }
      await tripApi.createTrip(payload)
      navigate('/trips')
    } catch (err) {
      const responseData = err?.response?.data
      if (responseData?.errors && typeof responseData.errors === 'object') {
        setFieldErrors(responseData.errors)
      } else {
        setGeneralError(responseData?.message ?? 'Failed to plan your trip. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />

        <div className="dashboard-content">
          <Sidebar />

          <main className="dashboard-main">
            <section className="section-card" style={{ maxWidth: '680px' }}>
              <div className="section-heading" style={{ marginBottom: '24px' }}>
                <div>
                  <p className="eyebrow">Planner</p>
                  <h2>Plan a New Escape</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '4px 0 0 0' }}>
                    Provide details about your upcoming adventure to get started.
                  </p>
                </div>
              </div>

              {generalError && (
                <div className="status-message error" style={{ marginBottom: '20px' }}>
                  {generalError}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit} style={{ gap: '20px' }}>
                <div className="field-group">
                  <label htmlFor="title">Trip Title</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="e.g. Euro summer getaway, Japan Cherry Blossoms"
                  />
                  {fieldErrors.title ? <p className="field-error">{fieldErrors.title}</p> : null}
                </div>

                <div className="field-group">
                  <label htmlFor="destination">Destination</label>
                  <input
                    id="destination"
                    name="destination"
                    type="text"
                    value={formData.destination}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="e.g. Paris, Tokyo, Bali"
                  />
                  {fieldErrors.destination ? <p className="field-error">{fieldErrors.destination}</p> : null}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="field-group">
                    <label htmlFor="startDate">Start Date</label>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                    {fieldErrors.startDate ? <p className="field-error">{fieldErrors.startDate}</p> : null}
                  </div>

                  <div className="field-group">
                    <label htmlFor="endDate">End Date</label>
                    <input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                    {fieldErrors.endDate ? <p className="field-error">{fieldErrors.endDate}</p> : null}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="field-group">
                    <label htmlFor="travelers">Number of Travelers</label>
                    <input
                      id="travelers"
                      name="travelers"
                      type="number"
                      min="1"
                      value={formData.travelers}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                    {fieldErrors.travelers ? <p className="field-error">{fieldErrors.travelers}</p> : null}
                  </div>

                  <div className="field-group">
                    <label htmlFor="budget">Estimated Budget (INR)</label>
                    <input
                      id="budget"
                      name="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="₹"
                      value={formData.budget}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                    {fieldErrors.budget ? <p className="field-error">{fieldErrors.budget}</p> : null}
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="description">Trip Description (Optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="Notes about destinations, hotels, flights, or ideas..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      borderRadius: '16px',
                      padding: '14px 16px',
                      font: 'inherit',
                      color: 'var(--input-text)',
                      resize: 'vertical'
                    }}
                  />
                  {fieldErrors.description ? <p className="field-error">{fieldErrors.description}</p> : null}
                </div>

                <div className="profile-actions" style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
                  <button className="primary-button" type="submit" disabled={submitting}>
                    {submitting ? 'Planning Trip...' : 'Create Trip'}
                  </button>
                  <Link to="/trips" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                    Cancel
                  </Link>
                </div>
              </form>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default CreateTripPage
