import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import ItineraryManager from '../components/itinerary/ItineraryManager.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'
import { itineraryApi } from '../lib/itineraryApi.js'

function ItineraryPage() {
  const { tripId } = useParams()
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [trip, setTrip] = useState(null)
  const [tripsWithItineraries, setTripsWithItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const loadTrip = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      setError('')
      if (tripId) {
        setTrip(null)
        const fetched = await tripApi.getTrip(tripId)
        setTrip(fetched)
      } else {
        const allTrips = await tripApi.getAllTrips()
        // Fetch itinerary counts for journey planning overview
        const enriched = await Promise.all(
          (allTrips || []).map(async (t) => {
            try {
              const itins = await itineraryApi.getAllItineraries(t.id)
              return { trip: t, itineraries: itins || [] }
            } catch (e) {
              return { trip: t, itineraries: [] }
            }
          })
        )
        setTripsWithItineraries(enriched)
      }
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? 'The requested trip could not be found or you do not have permission to view it.'
          : err?.response?.data?.message ?? 'Failed to load trip details.'
      )
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, tripId])

  useEffect(() => {
    loadTrip()
  }, [loadTrip])

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />
        <div className="dashboard-content">
          <Sidebar />
          <main className="dashboard-main">
            <section className="section-card">
              {loading || (tripId && !trip && !error) ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  Loading itinerary...
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <h3>Unable to load itinerary</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
                  <Link to="/itinerary" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Back to Itineraries
                  </Link>
                </div>
              ) : !tripId ? (
                /* JOURNEY PLANNER LANDING PAGE */
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                      <p className="eyebrow">Planner</p>
                      <h2 style={{ margin: '4px 0 0 0' }}>Itinerary Planner</h2>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                        Plan your journey, one day at a time.
                      </p>
                    </div>
                    <Link to="/trips/new" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                      ✈️ Plan New Trip
                    </Link>
                  </div>

                  {tripsWithItineraries.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '16px',
                      border: '1px dashed var(--border)'
                    }}>
                      <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🗺️</span>
                      <h3>No trips available</h3>
                      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '8px auto 24px auto', fontSize: '0.95rem' }}>
                        Create a trip first to start planning your day-by-day itinerary.
                      </p>
                      <Link to="/trips/new" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        Plan New Trip
                      </Link>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                      gap: '20px',
                      marginTop: '16px'
                    }}>
                      {tripsWithItineraries.map(({ trip: item, itineraries }) => {
                        const statusStyle = getStatusColor(item.status)
                        const start = new Date(item.startDate)
                        const end = new Date(item.endDate)
                        const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
                        const plannedDays = itineraries.length
                        const progress = Math.min(100, Math.round((plannedDays / totalDays) * 100))

                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              padding: '22px',
                              borderRadius: '18px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.03))'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent, #cd7b2f)', letterSpacing: '0.04em' }}>
                                  JOURNEY
                                </span>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '0.78rem',
                                  fontWeight: 'bold',
                                  backgroundColor: statusStyle.bg,
                                  color: statusStyle.color,
                                  textTransform: 'uppercase'
                                }}>
                                  {(item.status || 'PLANNING').toLowerCase()}
                                </span>
                              </div>

                              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: 'var(--text)' }}>
                                🌍 {item.title}
                              </h3>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 14px 0' }}>
                                📍 {item.destination} · {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>

                              {/* Journey Progress Bar */}
                              <div style={{ marginTop: '14px', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                                  <span style={{ color: 'var(--text)' }}>Itinerary Progress</span>
                                  <span style={{ color: 'var(--accent, #cd7b2f)' }}>{plannedDays} / {totalDays} Days Planned ({progress}%)</span>
                                </div>
                                <div className="journey-progress-track">
                                  <div className="journey-progress-fill" style={{ width: `${progress}%` }} />
                                </div>

                                {/* Day Chips Preview */}
                                <div className="journey-day-chips">
                                  {Array.from({ length: Math.min(totalDays, 5) }).map((_, idx) => {
                                    const dayNum = idx + 1
                                    if (dayNum <= plannedDays) {
                                      return <span key={dayNum} className="journey-day-chip planned">Day {dayNum} ✓</span>
                                    } else if (dayNum === plannedDays + 1) {
                                      return <span key={dayNum} className="journey-day-chip next">Day {dayNum} →</span>
                                    } else {
                                      return <span key={dayNum} className="journey-day-chip unplanned">Day {dayNum}</span>
                                    }
                                  })}
                                  {totalDays > 5 && <span className="journey-day-chip unplanned">+{totalDays - 5} more</span>}
                                </div>
                              </div>
                            </div>

                            <Link
                              to={`/itinerary/${item.id}`}
                              className="primary-button"
                              style={{ textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '0.9rem', marginTop: '16px' }}
                            >
                              {plannedDays === 0 ? 'Start Planning' : 'Plan Itinerary'}
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* TRIP ITINERARY DETAIL MANAGER */
                trip && (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      marginBottom: '28px',
                      paddingBottom: '22px',
                      borderBottom: '1px solid var(--border)'
                    }}>
                      <div>
                        <p className="eyebrow" style={{ marginBottom: '4px' }}>
                          <Link to="/itinerary" style={{ color: 'var(--accent, #cd7b2f)', textDecoration: 'none', fontWeight: 600 }}>
                            ← Back to Itineraries
                          </Link>
                        </p>
                        <h2 style={{ margin: '4px 0', color: 'var(--text)' }}>🌍 {trip.title}</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                          📍 {trip.destination} · {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{
                          padding: '6px 10px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 'bold',
                          backgroundColor: 'rgba(205,123,47,0.12)',
                          color: '#cd7b2f'
                        }}>
                          {trip.status}
                        </span>
                        {trip.budget != null && (
                          <span style={{ color: '#cd7b2f', fontWeight: 700 }}>₹{trip.budget.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                    <ItineraryManager trip={trip} />
                  </>
                )
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default ItineraryPage
