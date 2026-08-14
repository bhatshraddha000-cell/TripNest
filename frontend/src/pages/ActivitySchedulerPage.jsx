import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import ActivitySchedulePanel from '../components/itinerary/ActivitySchedulePanel.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'
import { itineraryApi } from '../lib/itineraryApi.js'

function ActivitySchedulerPage() {
  const { itineraryId } = useParams()
  const { user, logout, authLoading, isAuthenticated } = useAuth()

  const [trips, setTrips] = useState([])
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [tripItineraries, setTripItineraries] = useState([])

  const [detailEntry, setDetailEntry] = useState(null)
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

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      setError('')

      if (itineraryId) {
        // Direct detail link or day selected
        const allTrips = await tripApi.getAllTrips()
        let matched = null
        for (const t of allTrips) {
          const itins = await itineraryApi.getAllItineraries(t.id)
          const found = itins.find((i) => String(i.id) === String(itineraryId))
          if (found) {
            matched = { trip: t, itinerary: found }
            break
          }
        }
        if (!matched) {
          setError('The requested itinerary day could not be found or you do not have permission to view it.')
        } else {
          setDetailEntry(matched)
        }
      } else {
        // Landing page: fetch all user trips
        const allTrips = await tripApi.getAllTrips()
        setTrips(allTrips || [])
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load activity scheduling details.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, itineraryId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSelectTrip = async (trip) => {
    try {
      setLoading(true)
      setError('')
      setSelectedTrip(trip)
      const itins = await itineraryApi.getAllItineraries(trip.id)
      setTripItineraries(itins || [])
    } catch (err) {
      setError('Failed to load itinerary days for this trip.')
    } finally {
      setLoading(false)
    }
  }

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
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--paragraph)' }}>
                  Loading activity scheduler...
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <h3>Unable to load activity scheduler</h3>
                  <p style={{ color: 'var(--paragraph)' }}>{error}</p>
                  <Link to="/activity-scheduler" className="primary-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
                    Back to Activity Scheduling
                  </Link>
                </div>
              ) : !itineraryId ? (
                /* LANDING & DAY SELECTION */
                !selectedTrip ? (
                  /* LEVEL 1: TRIP SELECTION */
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <p className="eyebrow">Planner</p>
                        <h2 style={{ margin: '4px 0 0 0' }}>Activity Scheduling</h2>
                        <p style={{ color: 'var(--paragraph)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                          Choose a trip to schedule activities.
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
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🗓️</span>
                        <h3>No trips available</h3>
                        <p style={{ color: 'var(--paragraph)', maxWidth: '400px', margin: '8px auto 24px auto', fontSize: '0.95rem' }}>
                          Create a trip first to start scheduling activities.
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
                                  <span style={{ color: 'var(--paragraph)', fontSize: '0.85rem' }}>
                                    👥 {item.travelers ?? 1} {item.travelers === 1 ? 'traveler' : 'travelers'}
                                  </span>
                                </div>

                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'var(--text)' }}>{item.title}</h3>
                                <p style={{ color: 'var(--paragraph)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>📍 {item.destination}</p>
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
                                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--paragraph)' }}>DATES</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                                    {new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="primary-button"
                                style={{ width: '100%', fontSize: '0.9rem' }}
                                onClick={() => handleSelectTrip(item)}
                              >
                                Schedule Activities
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  /* LEVEL 2: ITINERARY DAY SELECTION FOR SELECTED TRIP */
                  <>
                    <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                      <p className="eyebrow" style={{ marginBottom: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedTrip(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent, #cd7b2f)', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                        >
                          ← Select Another Trip
                        </button>
                      </p>
                      <h2 style={{ margin: '4px 0 0 0', color: 'var(--text)' }}>{selectedTrip.title}</h2>
                      <p style={{ color: 'var(--paragraph)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                        📍 {selectedTrip.destination} — Select an itinerary day to schedule activities.
                      </p>
                    </div>

                    {tripItineraries.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '16px',
                        border: '1px dashed var(--border)'
                      }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🗓️</span>
                        <h3>No itinerary days available for this trip</h3>
                        <p style={{ color: 'var(--paragraph)', maxWidth: '400px', margin: '8px auto 24px auto', fontSize: '0.95rem' }}>
                          Create an itinerary day for {selectedTrip.title} to start scheduling activities!
                        </p>
                        <Link to={`/itinerary/${selectedTrip.id}`} className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                          Create Itinerary Day
                        </Link>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '16px',
                        marginTop: '16px'
                      }}>
                        {tripItineraries.map((itin) => (
                          <div
                            key={itin.id}
                            style={{
                              padding: '20px',
                              borderRadius: '16px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface-strong, rgba(255, 255, 255, 0.03))',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <span style={{
                                fontSize: '0.78rem',
                                fontWeight: 'bold',
                                color: 'var(--accent, #cd7b2f)',
                                textTransform: 'uppercase',
                                display: 'block',
                                marginBottom: '4px'
                              }}>
                                Day {itin.dayNumber}
                              </span>
                              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--text)' }}>
                                {itin.title}
                              </h3>
                              <p style={{ color: 'var(--paragraph)', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
                                📅 {itin.date ? new Date(itin.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}
                              </p>
                            </div>

                            <Link
                              to={`/activity-scheduler/${itin.id}`}
                              className="primary-button"
                              style={{ textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '0.88rem' }}
                            >
                              Manage Activities
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              ) : (
                /* DETAIL PAGE: ACTIVITY SCHEDULER PANEL */
                detailEntry && (
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
                          <Link to="/activity-scheduler" style={{ color: 'var(--accent, #cd7b2f)', textDecoration: 'none', fontWeight: 600 }}>
                            ← Back to Activity Scheduling
                          </Link>
                        </p>
                        <h2 style={{ margin: '4px 0', color: 'var(--text)' }}>{detailEntry.trip.title}</h2>
                        <p style={{ color: 'var(--paragraph)', margin: 0 }}>📍 {detailEntry.trip.destination}</p>
                      </div>
                      <Link to={`/itinerary/${detailEntry.trip.id}`} className="secondary-button" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
                        View Itinerary
                      </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                      <SchedulerDetail label="DAY" value={`Day ${detailEntry.itinerary.dayNumber}`} />
                      <SchedulerDetail label="DAY TITLE" value={detailEntry.itinerary.title} />
                      <SchedulerDetail label="DATE" value={detailEntry.itinerary.date ? new Date(detailEntry.itinerary.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} />
                    </div>

                    <ActivitySchedulePanel
                      tripId={detailEntry.trip.id}
                      itineraryId={detailEntry.itinerary.id}
                      tripRole={detailEntry.trip.tripRole}
                    />
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

function SchedulerDetail({ label, value }) {
  return (
    <div style={{ padding: '16px', background: 'var(--surface-strong)', border: '1px solid var(--border)', borderRadius: '14px' }}>
      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--paragraph)', marginBottom: '5px' }}>{label}</span>
      <strong style={{ color: 'var(--text)' }}>{value}</strong>
    </div>
  )
}

export default ActivitySchedulerPage
