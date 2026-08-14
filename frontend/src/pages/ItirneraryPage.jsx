import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import ItineraryManager from '../components/itinerary/ItineraryManager.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'

function ItineraryPage() {
  const { tripId } = useParams()
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [trip, setTrip] = useState(null)
  const [trips, setTrips] = useState([])
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
        setTrips(allTrips || [])
      }
    } catch (err) {
      setError(err?.response?.status === 404
        ? 'The requested trip could not be found or you do not have permission to view it.'
        : err?.response?.data?.message ?? 'Failed to load trip details.')
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
                /* TRIP SELECTION LANDING PAGE */
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                      <p className="eyebrow">Planner</p>
                      <h2 style={{ margin: '4px 0 0 0' }}>Itinerary</h2>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                        Choose a trip to plan its day-by-day itinerary.
                      </p>
                    </div>
                    <Link to="/trips/new" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                      ✈️ Plan New Trip
                    </Link>
                  </div>

                  {trips.length === 0 ? (
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
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '20px',
                      marginTop: '16px'
                    }}>
                      {trips.map((item) => {
                        const statusStyle = getStatusColor(item.status)
                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              padding: '20px',
                              borderRadius: '16px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.03))'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
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
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                  👥 {item.travelers ?? 1} {item.travelers === 1 ? 'traveler' : 'travelers'}
                                </span>
                              </div>

                              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'var(--text)' }}>{item.title}</h3>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>📍 {item.destination}</p>

                              {item.description && (
                                <p style={{
                                  fontSize: '0.88rem',
                                  color: 'var(--text-secondary)',
                                  margin: '0 0 16px 0',
                                  lineHeight: '1.4',
                                  display: '-webkit-box',
                                  WebkitLineClamp: '2',
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div style={{
                              borderTop: '1px solid var(--border)',
                              paddingTop: '16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '16px'
                            }}>
                              <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DATES</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                                  {new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>BUDGET</span>
                                <strong style={{ color: '#cd7b2f', fontSize: '1.05rem' }}>₹{(item.budget || 0).toLocaleString('en-IN')}</strong>
                              </div>
                            </div>

                            <Link
                              to={`/itinerary/${item.id}`}
                              className="primary-button"
                              style={{ textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '0.9rem' }}
                            >
                              Manage Itinerary
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
                        <h2 style={{ margin: '4px 0', color: 'var(--text)' }}>{trip.title}</h2>
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
