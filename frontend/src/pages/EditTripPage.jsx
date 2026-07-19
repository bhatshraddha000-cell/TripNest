import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'

function EditTripPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    budget: '',
    status: 'PLANNING',
    description: ''
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchTrip() {
      if (!isAuthenticated || !id) return
      try {
        setLoading(true)
        const data = await tripApi.getTrip(id)
        setFormData({
          title: data.title,
          destination: data.destination,
          startDate: data.startDate,
          endDate: data.endDate,
          travelers: data.travelers,
          budget: data.budget.toString(),
          status: data.status,
          description: data.description ?? ''
        })
      } catch (err) {
        if (err?.response?.status === 404) {
          setError('The requested trip could not be found or you do not have permission to edit it.')
        } else {
          setError(err?.response?.data?.message ?? 'Failed to load trip details.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchTrip()
  }, [id, isAuthenticated])

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
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    setError('')

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
      await tripApi.updateTrip(id, payload)
      navigate(`/trips/${id}`)
    } catch (err) {
      const responseData = err?.response?.data
      if (responseData?.errors && typeof responseData.errors === 'object') {
        setFieldErrors(responseData.errors)
      } else {
        setError(responseData?.message ?? 'Failed to update your trip. Please try again.')
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
                  <p className="eyebrow">Planner &rarr; Edit Escape</p>
                  <h2>Modify Trip Details</h2>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Loading trip details...</p>
                </div>
              ) : error && !formData.title ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>⚠️</span>
                  <h3>Unable to edit trip</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '8px auto 24px auto', fontSize: '0.95rem' }}>
                    {error}
                  </p>
                  <Link to="/trips" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Back to My Trips
                  </Link>
                </div>
              ) : (
                <div>
                  {error && (
                    <div className="status-message error" style={{ marginBottom: '20px' }}>
                      {error}
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
                      <label htmlFor="status">Trip Status</label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={submitting}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          border: '1px solid var(--input-border)',
                          background: 'var(--input-bg)',
                          borderRadius: '16px',
                          padding: '14px 16px',
                          font: 'inherit',
                          color: 'var(--input-text)',
                          appearance: 'none',
                          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23b5c2d5%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 16px center',
                          backgroundSize: '16px'
                        }}
                      >
                        <option value="PLANNING">Planning</option>
                        <option value="UPCOMING">Upcoming</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      {fieldErrors.status ? <p className="field-error">{fieldErrors.status}</p> : null}
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
                        {submitting ? 'Saving Changes...' : 'Save Changes'}
                      </button>
                      <Link to={`/trips/${id}`} className="secondary-button" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                        Cancel
                      </Link>
                    </div>
                  </form>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default EditTripPage
