import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'
import { documentApi } from '../lib/documentApi.js'

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
    status: 'PLANNING',
    description: ''
  })

  const [selectedFiles, setSelectedFiles] = useState([])
  const [existingTrips, setExistingTrips] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [createdTrip, setCreatedTrip] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    async function loadTrips() {
      try {
        const trips = await tripApi.getAllTrips()
        setExistingTrips(trips)
      } catch (err) {
        console.error('Failed to load trips for overlap validation:', err)
      }
    }
    loadTrips()
  }, [isAuthenticated])

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

  function handleFileChange(event) {
    if (event.target.files) {
      const filesArr = Array.from(event.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArr])
    }
  }

  function removeFile(index) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
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
      } else {
        const isOverlap = existingTrips.some((t) => {
          if (t.status === 'CANCELLED') return false
          return formData.startDate <= t.endDate && formData.endDate >= t.startDate
        })
        if (isOverlap) {
          errors.startDate = 'Trip dates overlap with an existing trip. Please choose a different date range.'
          setGeneralError('Trip dates overlap with an existing trip. Please choose a different date range.')
        }
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
      const trip = await tripApi.createTrip(payload)

      // Upload selected documents if any
      if (selectedFiles.length > 0 && trip?.id) {
        for (const file of selectedFiles) {
          try {
            await documentApi.uploadDocument(trip.id, file, 'GENERAL')
          } catch (docErr) {
            console.error('Failed to upload document:', docErr)
          }
        }
      }

      setCreatedTrip(trip)
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

              {createdTrip ? (
                <div style={{ textAlign: 'center', padding: '28px 12px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Trip created successfully!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Your escape is ready for its day-by-day plan.</p>
                  <div className="profile-actions" style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="primary-button" onClick={() => navigate(`/itinerary/${createdTrip.id}`)}>Create Itinerary</button>
                    <Link to="/trips" className="secondary-button" style={{ textDecoration: 'none' }}>Back to My Trips</Link>
                  </div>
                </div>
              ) : <form className="auth-form" onSubmit={handleSubmit} style={{ gap: '20px' }}>
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

                <div className="field-group">
                  <label htmlFor="documents">Attach Documents (Optional)</label>
                  <input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    disabled={submitting}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      border: '1px dashed var(--input-border)',
                      background: 'var(--input-bg)',
                      borderRadius: '16px',
                      padding: '12px 16px',
                      color: 'var(--input-text)'
                    }}
                  />
                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', background: 'var(--card-bg, #f3f4f6)', padding: '6px 12px', borderRadius: '8px' }}>
                          <span>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                          <button type="button" onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="profile-actions" style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
                  <button className="primary-button" type="submit" disabled={submitting}>
                    {submitting ? 'Planning Trip...' : 'Create Trip'}
                  </button>
                  <Link to="/trips" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                    Cancel
                  </Link>
                </div>
              </form>}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default CreateTripPage
