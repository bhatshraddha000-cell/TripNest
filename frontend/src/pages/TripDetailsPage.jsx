import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'
import { itineraryApi } from '../lib/itineraryApi.js'
import { activityApi } from '../lib/activityApi.js'

function TripDetailsPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const { id: tripId } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteTripModal, setShowDeleteTripModal] = useState(false)
  const [deletingTrip, setDeletingTrip] = useState(false)

  // Accordion state
  const [expandedDays, setExpandedDays] = useState({})

  // Itinerary Modal State
  const [itineraryModal, setItineraryModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' or 'edit'
    id: null,
    formData: { dayNumber: 1, date: '', title: '', notes: '' },
    fieldErrors: {},
    error: '',
    submitting: false
  })

  // Activity Modal State
  const [activityModal, setActivityModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' or 'edit'
    itineraryId: null,
    id: null,
    formData: {
      title: '',
      description: '',
      location: '',
      startTime: '',
      endTime: '',
      activityType: 'SIGHTSEEING',
      estimatedCost: '0',
      notes: ''
    },
    fieldErrors: {},
    error: '',
    submitting: false
  })

  // Delete Confirm Modal State (for itinerary day / activity)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    type: 'itinerary', // 'itinerary' or 'activity'
    itineraryId: null,
    id: null,
    title: '',
    submitting: false
  })

  const loadAllData = useCallback(async () => {
    if (!isAuthenticated || !tripId) return
    try {
      setLoading(true)
      const tripData = await tripApi.getTrip(tripId)
      setTrip(tripData)
      const itineraryData = await itineraryApi.getAllItineraries(tripId)
      setItineraries(itineraryData)
    } catch (err) {
      if (err?.response?.status === 404) {
        setError('The requested trip could not be found or you do not have permission to view it.')
      } else {
        setError(err?.response?.data?.message ?? 'Failed to load trip details.')
      }
    } finally {
      setLoading(false)
    }
  }, [tripId, isAuthenticated])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  async function handleDeleteTrip() {
    setDeletingTrip(true)
    try {
      await tripApi.deleteTrip(tripId)
      navigate('/trips')
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to delete the trip.')
      setShowDeleteTripModal(false)
    } finally {
      setDeletingTrip(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANNING': return { bg: 'rgba(205, 123, 47, 0.12)', color: '#cd7b2f' }
      case 'UPCOMING': return { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }
      case 'ONGOING': return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }
      case 'COMPLETED': return { bg: 'rgba(107, 114, 128, 0.12)', color: '#6b7280' }
      case 'CANCELLED': return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }
      default: return { bg: 'rgba(107, 114, 128, 0.12)', color: '#6b7280' }
    }
  }

  const getActivityTypeColor = (type) => {
    switch (type) {
      case 'SIGHTSEEING': return { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }
      case 'TRANSPORTATION': return { bg: 'rgba(205, 123, 47, 0.12)', color: '#cd7b2f' }
      case 'ACCOMMODATION': return { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }
      case 'DINING': return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }
      case 'ADVENTURE': return { bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' }
      case 'SHOPPING': return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }
      default: return { bg: 'rgba(107, 114, 128, 0.12)', color: '#6b7280' }
    }
  }

  const formatDates = (start, end) => {
    const s = new Date(start)
    const e = new Date(end)
    const diffTime = Math.abs(e - s)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    return {
      formatted: `${s.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      duration: `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`
    }
  }

  const toggleDayExpand = (id) => {
    setExpandedDays(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Itinerary Modal Handlers
  const handleOpenItineraryModal = (mode, dayObj = null) => {
    if (mode === 'create') {
      // Auto-compute dayNumber and date suggestions
      const maxDay = itineraries.length === 0 ? 0 : Math.max(...itineraries.map(i => i.dayNumber))
      let nextDate = trip.startDate
      if (itineraries.length > 0) {
        const sortedItineraries = [...itineraries].sort((a,b) => new Date(a.date) - new Date(b.date))
        const lastItinerary = sortedItineraries[sortedItineraries.length - 1]
        const d = new Date(lastItinerary.date)
        d.setDate(d.getDate() + 1)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        nextDate = `${yyyy}-${mm}-${dd}`
        if (new Date(nextDate) > new Date(trip.endDate)) {
          nextDate = trip.endDate
        }
      }

      setItineraryModal({
        isOpen: true,
        mode: 'create',
        id: null,
        formData: { dayNumber: maxDay + 1, date: nextDate, title: '', notes: '' },
        fieldErrors: {},
        error: '',
        submitting: false
      })
    } else {
      setItineraryModal({
        isOpen: true,
        mode: 'edit',
        id: dayObj.id,
        formData: {
          dayNumber: dayObj.dayNumber,
          date: dayObj.date,
          title: dayObj.title,
          notes: dayObj.notes ?? ''
        },
        fieldErrors: {},
        error: '',
        submitting: false
      })
    }
  }

  const handleItinerarySubmit = async (e) => {
    e.preventDefault()
    setItineraryModal(prev => ({ ...prev, submitting: true, error: '', fieldErrors: {} }))
    const { dayNumber, date, title, notes } = itineraryModal.formData

    // Client Validation
    const errors = {}
    if (!dayNumber || parseInt(dayNumber, 10) < 1) errors.dayNumber = 'Day number must be at least 1'
    if (!date) errors.date = 'Date is required'
    if (!title.trim()) errors.title = 'Title is required'

    if (date) {
      const start = new Date(trip.startDate)
      const end = new Date(trip.endDate)
      const d = new Date(date)
      if (d < start || d > end) {
        errors.date = `Date must be between trip bounds (${trip.startDate} to ${trip.endDate})`
      }
    }

    if (Object.keys(errors).length > 0) {
      setItineraryModal(prev => ({ ...prev, fieldErrors: errors, submitting: false }))
      return
    }

    try {
      const payload = {
        dayNumber: parseInt(dayNumber, 10),
        date,
        title,
        notes: notes.trim() ? notes : null
      }

      if (itineraryModal.mode === 'create') {
        await itineraryApi.createItinerary(tripId, payload)
      } else {
        await itineraryApi.updateItinerary(tripId, itineraryModal.id, payload)
      }

      setItineraryModal(prev => ({ ...prev, isOpen: false }))
      // reload
      const updatedItineraries = await itineraryApi.getAllItineraries(tripId)
      setItineraries(updatedItineraries)
    } catch (err) {
      const responseData = err?.response?.data
      if (responseData?.errors && typeof responseData.errors === 'object') {
        setItineraryModal(prev => ({ ...prev, fieldErrors: responseData.errors, submitting: false }))
      } else {
        setItineraryModal(prev => ({
          ...prev,
          error: responseData?.message ?? 'Failed to save itinerary day. Duplicate day or date ranges are not allowed.',
          submitting: false
        }))
      }
    }
  }

  // Activity Modal Handlers
  const handleOpenActivityModal = (mode, itineraryId, actObj = null) => {
    if (mode === 'create') {
      setActivityModal({
        isOpen: true,
        mode: 'create',
        itineraryId,
        id: null,
        formData: {
          title: '',
          description: '',
          location: '',
          startTime: '',
          endTime: '',
          activityType: 'SIGHTSEEING',
          estimatedCost: '0',
          notes: ''
        },
        fieldErrors: {},
        error: '',
        submitting: false
      })
    } else {
      setActivityModal({
        isOpen: true,
        mode: 'edit',
        itineraryId,
        id: actObj.id,
        formData: {
          title: actObj.title,
          description: actObj.description ?? '',
          location: actObj.location ?? '',
          startTime: actObj.startTime ? actObj.startTime.substring(0, 5) : '',
          endTime: actObj.endTime ? actObj.endTime.substring(0, 5) : '',
          activityType: actObj.activityType,
          estimatedCost: actObj.estimatedCost.toString(),
          notes: actObj.notes ?? ''
        },
        fieldErrors: {},
        error: '',
        submitting: false
      })
    }
  }

  const handleActivitySubmit = async (e) => {
    e.preventDefault()
    setActivityModal(prev => ({ ...prev, submitting: true, error: '', fieldErrors: {} }))
    const { title, description, location, startTime, endTime, activityType, estimatedCost, notes } = activityModal.formData

    // Client Validation
    const errors = {}
    if (!title.trim()) errors.title = 'Title is required'
    if (!activityType) errors.activityType = 'Activity type is required'
    if (estimatedCost === '' || parseFloat(estimatedCost) < 0) {
      errors.estimatedCost = 'Estimated cost cannot be negative'
    }

    if (startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      if (eh < sh || (eh === sh && em < sm)) {
        errors.endTime = 'End time cannot be before start time'
      }
    }

    if (Object.keys(errors).length > 0) {
      setActivityModal(prev => ({ ...prev, fieldErrors: errors, submitting: false }))
      return
    }

    try {
      const payload = {
        title,
        description: description.trim() ? description : null,
        location: location.trim() ? location : null,
        startTime: startTime ? `${startTime}:00` : null,
        endTime: endTime ? `${endTime}:00` : null,
        activityType,
        estimatedCost: parseFloat(estimatedCost),
        notes: notes.trim() ? notes : null
      }

      if (activityModal.mode === 'create') {
        await activityApi.createActivity(tripId, activityModal.itineraryId, payload)
      } else {
        await activityApi.updateActivity(tripId, activityModal.itineraryId, activityModal.id, payload)
      }

      setActivityModal(prev => ({ ...prev, isOpen: false }))
      // reload
      const updatedItineraries = await itineraryApi.getAllItineraries(tripId)
      setItineraries(updatedItineraries)
    } catch (err) {
      const responseData = err?.response?.data
      if (responseData?.errors && typeof responseData.errors === 'object') {
        setActivityModal(prev => ({ ...prev, fieldErrors: responseData.errors, submitting: false }))
      } else {
        setActivityModal(prev => ({
          ...prev,
          error: responseData?.message ?? 'Failed to save activity.',
          submitting: false
        }))
      }
    }
  }

  // Delete Dialog Confirm
  const handleOpenDeleteConfirm = (type, itineraryId, id, title) => {
    setDeleteConfirmModal({
      isOpen: true,
      type,
      itineraryId,
      id,
      title,
      submitting: false
    })
  }

  const handleDeleteConfirmSubmit = async () => {
    setDeleteConfirmModal(prev => ({ ...prev, submitting: true }))
    try {
      if (deleteConfirmModal.type === 'itinerary') {
        await itineraryApi.deleteItinerary(tripId, deleteConfirmModal.id)
      } else {
        await activityApi.deleteActivity(tripId, deleteConfirmModal.itineraryId, deleteConfirmModal.id)
      }
      setDeleteConfirmModal(prev => ({ ...prev, isOpen: false }))
      // reload
      const updatedItineraries = await itineraryApi.getAllItineraries(tripId)
      setItineraries(updatedItineraries)
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Failed to perform delete action.')
      setDeleteConfirmModal(prev => ({ ...prev, isOpen: false }))
    }
  }

  const formatTime12h = (timeStr) => {
    if (!timeStr) return ''
    const [hStr, mStr] = timeStr.split(':')
    let h = parseInt(hStr, 10)
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12
    h = h ? h : 12
    return `${h}:${mStr} ${ampm}`
  }

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />

        <div className="dashboard-content">
          <Sidebar />

          <main className="dashboard-main">
            <section className="section-card">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Loading trip details...</p>
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>⚠️</span>
                  <h3>Unable to load trip</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '8px auto 24px auto', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {error}
                  </p>
                  <Link to="/trips" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Back to My Trips
                  </Link>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '24px' }}>
                    <div>
                      <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to="/trips" style={{ color: 'inherit', textDecoration: 'none' }}>Planner</Link>
                        <span>&rarr;</span>
                        <span>Trip Details</span>
                      </p>
                      <h2 style={{ fontSize: '2rem', margin: '4px 0' }}>{trip.title}</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0 }}>📍 {trip.destination}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <Link to={`/trips/${trip.id}/edit`} className="secondary-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✏️ Edit Details
                      </Link>
                      <button
                        onClick={() => setShowDeleteTripModal(true)}
                        className="secondary-button"
                        style={{ border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                      >
                        🗑️ Delete Trip
                      </button>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                  }}>
                    <div style={{ padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>TRIP STATUS</span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        backgroundColor: getStatusColor(trip.status).bg,
                        color: getStatusColor(trip.status).color,
                        textTransform: 'uppercase'
                      }}>
                        {trip.status}
                      </span>
                    </div>

                    <div style={{ padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>DATES & DURATION</span>
                      <strong style={{ fontSize: '1rem', display: 'block' }}>{formatDates(trip.startDate, trip.endDate).duration}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDates(trip.startDate, trip.endDate).formatted}</span>
                    </div>

                    <div style={{ padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>TOTAL BUDGET</span>
                      <strong style={{ fontSize: '1.4rem', color: '#cd7b2f', display: 'block' }}>₹{trip.budget.toLocaleString('en-IN')}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Total expenses</span>
                    </div>

                    <div style={{ padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>COMPANIONS</span>
                      <strong style={{ fontSize: '1.2rem', display: 'block' }}>👥 {trip.travelers}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{trip.travelers === 1 ? 'Solo Trip' : 'Group members'}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Description & Planning Notes</h3>
                    {trip.description ? (
                      <div style={{
                        padding: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                        lineHeight: '1.6',
                        fontSize: '0.95rem',
                        whiteSpace: 'pre-wrap',
                        color: 'var(--text-secondary)'
                      }}>
                        {trip.description}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.92rem' }}>No description added yet.</p>
                    )}
                  </div>

                  {/* DAY-BY-DAY ITINERARY SECTION */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '1.4rem', margin: 0 }}>🗺️ Day-by-Day Itinerary</h3>
                      <button className="primary-button" onClick={() => handleOpenItineraryModal('create')} style={{ fontSize: '0.88rem', padding: '10px 16px' }}>
                        ➕ Add Day
                      </button>
                    </div>

                    {itineraries.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        borderRadius: '16px',
                        border: '1px dashed rgba(255, 255, 255, 0.1)'
                      }}>
                        <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0', fontSize: '0.95rem' }}>
                          No itinerary days planned yet. Start building your step-by-step escape schedule by adding a day!
                        </p>
                        <button className="secondary-button" onClick={() => handleOpenItineraryModal('create')}>
                          Add First Itinerary Day
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {itineraries.map((day) => {
                          const isExpanded = !!expandedDays[day.id]
                          return (
                            <div key={day.id} style={{
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              borderRadius: '16px',
                              backgroundColor: 'rgba(255, 255, 255, 0.02)',
                              overflow: 'hidden'
                            }}>
                              {/* Accordion Header */}
                              <div style={{
                                padding: '18px 24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                userSelect: 'none',
                                transition: 'background-color 0.2s'
                              }}
                              onClick={() => toggleDayExpand(day.id)}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <span style={{ fontSize: '1.25rem', color: '#cd7b2f', fontWeight: 'bold' }}>Day {day.dayNumber}</span>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ fontSize: '1.08rem' }}>{day.title}</strong>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
                                      📅 {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleOpenItineraryModal('edit', day)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--text-secondary)',
                                      cursor: 'pointer',
                                      fontSize: '0.88rem',
                                      padding: '6px'
                                    }}
                                    title="Edit day attributes"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteConfirm('itinerary', null, day.id, `Day ${day.dayNumber}: ${day.title}`)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      fontSize: '0.88rem',
                                      padding: '6px'
                                    }}
                                    title="Delete day plan"
                                  >
                                    🗑️ Delete
                                  </button>
                                  <span style={{
                                    fontSize: '1.2rem',
                                    color: 'var(--text-secondary)',
                                    marginLeft: '10px',
                                    display: 'inline-block',
                                    transition: 'transform 0.2s',
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                  }} onClick={() => toggleDayExpand(day.id)}>
                                    &rsaquo;
                                  </span>
                                </div>
                              </div>

                              {/* Accordion Expanded Content */}
                              {isExpanded && (
                                <div style={{
                                  padding: '0 24px 24px 24px',
                                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                                  backgroundColor: 'rgba(0, 0, 0, 0.1)'
                                }}>
                                  {day.notes && (
                                    <div style={{
                                      padding: '12px 0 16px 0',
                                      color: 'var(--text-secondary)',
                                      fontSize: '0.9rem',
                                      lineHeight: '1.5',
                                      borderBottom: '1px dashed rgba(255, 255, 255, 0.05)',
                                      marginBottom: '16px'
                                    }}>
                                      <strong>Notes:</strong> {day.notes}
                                    </div>
                                  )}

                                  {/* Activities Header */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: day.notes ? '0 0 16px 0' : '16px 0' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>Activities</h4>
                                    <button
                                      className="secondary-button"
                                      onClick={() => handleOpenActivityModal('create', day.id)}
                                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                    >
                                      ➕ Add Activity
                                    </button>
                                  </div>

                                  {/* Activities List */}
                                  {day.activities.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                                      No activities scheduled for this day yet. Add one to complete your schedule.
                                    </p>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      {day.activities.map((act) => {
                                        const typeStyle = getActivityTypeColor(act.activityType)
                                        return (
                                          <div key={act.id} style={{
                                            padding: '14px 18px',
                                            borderRadius: '12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                            border: '1px solid rgba(255, 255, 255, 0.03)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '12px'
                                          }}>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: '1', minWidth: '240px' }}>
                                              {/* Left indicator with time / type */}
                                              <div style={{ minWidth: '95px' }}>
                                                {act.startTime ? (
                                                  <span style={{ fontSize: '0.85rem', fontWeight: '500', display: 'block' }}>
                                                    {formatTime12h(act.startTime)}
                                                    {act.endTime && ` - ${formatTime12h(act.endTime)}`}
                                                  </span>
                                                ) : (
                                                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: 'block' }}>Flexible</span>
                                                )}
                                                <span style={{
                                                  display: 'inline-block',
                                                  marginTop: '4px',
                                                  padding: '2px 8px',
                                                  borderRadius: '12px',
                                                  fontSize: '0.7rem',
                                                  fontWeight: 'bold',
                                                  backgroundColor: typeStyle.bg,
                                                  color: typeStyle.color
                                                }}>
                                                  {act.activityType.toLowerCase()}
                                                </span>
                                              </div>

                                              {/* Mid details */}
                                              <div style={{ flex: 1 }}>
                                                <strong style={{ fontSize: '0.98rem', display: 'block' }}>{act.title}</strong>
                                                {act.location && <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block', marginTop: '2px' }}>📍 {act.location}</span>}
                                                {act.description && <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>{act.description}</p>}
                                                {act.notes && (
                                                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                    💡 {act.notes}
                                                  </p>
                                                )}
                                              </div>
                                            </div>

                                            {/* Right Column actions & cost */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end' }}>
                                              <div style={{ textAlign: 'right' }}>
                                                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>COST</span>
                                                <span style={{ fontWeight: '500', color: '#cd7b2f', fontSize: '0.92rem' }}>
                                                  {act.estimatedCost > 0 ? `₹${act.estimatedCost.toLocaleString('en-IN')}` : 'Free'}
                                                </span>
                                              </div>

                                              <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                  onClick={() => handleOpenActivityModal('edit', day.id, act)}
                                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
                                                  title="Edit activity"
                                                >
                                                  ✏️
                                                </button>
                                                <button
                                                  onClick={() => handleOpenDeleteConfirm('activity', day.id, act.id, act.title)}
                                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
                                                  title="Delete activity"
                                                >
                                                  🗑️
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* Delete Trip Confirmation Modal */}
      {showDeleteTripModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#161d2b', padding: '30px', borderRadius: '20px', maxWidth: '450px', width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem' }}>🗑️ Delete Escape Plan?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Are you sure you want to delete **"{trip?.title}"**? This action is permanent and cannot be undone. All plans, itineraries, and activities will be lost.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="secondary-button" onClick={() => setShowDeleteTripModal(false)} disabled={deletingTrip}>
                Keep Plan
              </button>
              <button className="primary-button" onClick={handleDeleteTrip} disabled={deletingTrip} style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}>
                {deletingTrip ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Itinerary Modal (Add/Edit Itinerary Day) */}
      {itineraryModal.isOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#161d2b', padding: '30px', borderRadius: '20px', maxWidth: '520px', width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem' }}>
              {itineraryModal.mode === 'create' ? '🗺️ Add Itinerary Day' : '✏️ Edit Itinerary Day'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
              Define the date and general title for this planning day.
            </p>

            {itineraryModal.error && (
              <div className="status-message error" style={{ marginBottom: '16px', fontSize: '0.88rem' }}>
                {itineraryModal.error}
              </div>
            )}

            <form onSubmit={handleItinerarySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="field-group">
                  <label htmlFor="dayNumber">Day Number</label>
                  <input
                    id="dayNumber"
                    type="number"
                    min="1"
                    value={itineraryModal.formData.dayNumber}
                    onChange={e => setItineraryModal(p => ({ ...p, formData: { ...p.formData, dayNumber: e.target.value } }))}
                    disabled={itineraryModal.submitting}
                  />
                  {itineraryModal.fieldErrors.dayNumber ? <p className="field-error">{itineraryModal.fieldErrors.dayNumber}</p> : null}
                </div>

                <div className="field-group">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={itineraryModal.formData.date}
                    onChange={e => setItineraryModal(p => ({ ...p, formData: { ...p.formData, date: e.target.value } }))}
                    disabled={itineraryModal.submitting}
                  />
                  {itineraryModal.fieldErrors.date ? <p className="field-error">{itineraryModal.fieldErrors.date}</p> : null}
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="title">Day Title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Flight Arrival & Check-in, Shrines Tour"
                  value={itineraryModal.formData.title}
                  onChange={e => setItineraryModal(p => ({ ...p, formData: { ...p.formData, title: e.target.value } }))}
                  disabled={itineraryModal.submitting}
                />
                {itineraryModal.fieldErrors.title ? <p className="field-error">{itineraryModal.fieldErrors.title}</p> : null}
              </div>

              <div className="field-group">
                <label htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  rows="3"
                  placeholder="General notes for this day..."
                  value={itineraryModal.formData.notes}
                  onChange={e => setItineraryModal(p => ({ ...p, formData: { ...p.formData, notes: e.target.value } }))}
                  disabled={itineraryModal.submitting}
                  style={{
                    width: '100%', boxSizing: 'border-box', border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)', borderRadius: '12px', padding: '10px 14px',
                    font: 'inherit', color: 'var(--input-text)', resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setItineraryModal(p => ({ ...p, isOpen: false }))}
                  disabled={itineraryModal.submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={itineraryModal.submitting}>
                  {itineraryModal.submitting ? 'Saving...' : 'Save Day'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Modal (Add/Edit Activity) */}
      {activityModal.isOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#161d2b', padding: '30px', borderRadius: '20px', maxWidth: '580px', width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem' }}>
              {activityModal.mode === 'create' ? '➕ Schedule Activity' : '✏️ Edit Activity'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
              Add a timed task, cost estimation, and notes for this day.
            </p>

            {activityModal.error && (
              <div className="status-message error" style={{ marginBottom: '16px', fontSize: '0.88rem' }}>
                {activityModal.error}
              </div>
            )}

            <form onSubmit={handleActivitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="field-group">
                <label htmlFor="actTitle">Activity Title</label>
                <input
                  id="actTitle"
                  type="text"
                  placeholder="e.g. Dinner at Tokyo Skytree, Sushi Workshop"
                  value={activityModal.formData.title}
                  onChange={e => setActivityModal(p => ({ ...p, formData: { ...p.formData, title: e.target.value } }))}
                  disabled={activityModal.submitting}
                />
                {activityModal.fieldErrors.title ? <p className="field-error">{activityModal.fieldErrors.title}</p> : null}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="field-group">
                  <label htmlFor="activityType">Category</label>
                  <select
                    id="activityType"
                    value={activityModal.formData.activityType}
                    onChange={e => setActivityModal(p => ({ ...p, formData: { ...p.formData, activityType: e.target.value } }))}
                    disabled={activityModal.submitting}
                    style={{
                      width: '100%', boxSizing: 'border-box', border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)', borderRadius: '16px', padding: '14px 16px',
                      font: 'inherit', color: 'var(--input-text)'
                    }}
                  >
                    <option value="SIGHTSEEING">Sightseeing</option>
                    <option value="TRANSPORTATION">Transportation</option>
                    <option value="ACCOMMODATION">Accommodation</option>
                    <option value="DINING">Dining</option>
                    <option value="ADVENTURE">Adventure</option>
                    <option value="SHOPPING">Shopping</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="field-group">
                  <label htmlFor="estimatedCost">Estimated Cost (INR)</label>
                  <input
                    id="estimatedCost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="₹"
                    value={activityModal.formData.estimatedCost}
                    onChange={e => setActivityModal(p => ({ ...p, formData: { ...p.formData, estimatedCost: e.target.value } }))}
                    disabled={activityModal.submitting}
                  />
                  {activityModal.fieldErrors.estimatedCost ? <p className="field-error">{activityModal.fieldErrors.estimatedCost}</p> : null}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="field-group">
                  <label htmlFor="startTime">Start Time (Optional)</label>
                  <input
                    id="startTime"
                    type="time"
                    value={activityModal.formData.startTime}
                    onChange={e => setActivityModal(p => ({ ...p, formData: { ...p.formData, startTime: e.target.value } }))}
                    disabled={activityModal.submitting}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="endTime">End Time (Optional)</label>
                  <input
                    id="endTime"
                    type="time"
                    value={activityModal.formData.endTime}
                    onChange={e => setActivityModal(p => ({ ...p, formData: { ...p.formData, endTime: e.target.value } }))}
                    disabled={activityModal.submitting}
                  />
                  {activityModal.fieldErrors.endTime ? <p className="field-error">{activityModal.fieldErrors.endTime}</p> : null}
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="location">Location / Venue (Optional)</label>
                <input
                  id="location"
                  type="text"
                  placeholder="Address or venue name"
                  value={activityModal.formData.location}
                  onChange={e => setActivityModal(p => ({ ...p, formData: { ...p.formData, location: e.target.value } }))}
                  disabled={activityModal.submitting}
                />
              </div>

              <div className="field-group">
                <label htmlFor="actDescription">Short Description (Optional)</label>
                <textarea
                  id="actDescription"
                  rows="2"
                  placeholder="Brief details about what to do..."
                  value={activityModal.formData.description}
                  onChange={e => setActivityModal(p => ({ ...p, formData: { ...p.formData, description: e.target.value } }))}
                  disabled={activityModal.submitting}
                  style={{
                    width: '100%', boxSizing: 'border-box', border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)', borderRadius: '12px', padding: '10px 14px',
                    font: 'inherit', color: 'var(--input-text)', resize: 'vertical'
                  }}
                />
              </div>

              <div className="field-group">
                <label htmlFor="actNotes">Additional Notes / Tips (Optional)</label>
                <textarea
                  id="actNotes"
                  rows="2"
                  placeholder="Booking codes, links, or advice..."
                  value={activityModal.formData.notes}
                  onChange={e => setActivityModal(p => ({ ...p, formData: { ...p.formData, notes: e.target.value } }))}
                  disabled={activityModal.submitting}
                  style={{
                    width: '100%', boxSizing: 'border-box', border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)', borderRadius: '12px', padding: '10px 14px',
                    font: 'inherit', color: 'var(--input-text)', resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setActivityModal(p => ({ ...p, isOpen: false }))}
                  disabled={activityModal.submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={activityModal.submitting}>
                  {activityModal.submitting ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal (For Itinerary / Activity) */}
      {deleteConfirmModal.isOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#161d2b', padding: '30px', borderRadius: '20px', maxWidth: '450px', width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem' }}>
              {deleteConfirmModal.type === 'itinerary' ? '🗑️ Delete Day Plan?' : '🗑️ Delete Activity?'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              {deleteConfirmModal.type === 'itinerary'
                ? `Are you sure you want to delete **"${deleteConfirmModal.title}"**? This will permanently delete this day and all its scheduled activities.`
                : `Are you sure you want to delete the activity **"${deleteConfirmModal.title}"** from your schedule?`
              }
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="secondary-button" onClick={() => setDeleteConfirmModal(p => ({ ...p, isOpen: false }))} disabled={deleteConfirmModal.submitting}>
                Keep
              </button>
              <button
                className="primary-button"
                onClick={handleDeleteConfirmSubmit}
                disabled={deleteConfirmModal.submitting}
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                {deleteConfirmModal.submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TripDetailsPage
