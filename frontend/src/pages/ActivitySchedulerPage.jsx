import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import ActivitySchedulePanel from '../components/itinerary/ActivitySchedulePanel.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'
import { itineraryApi } from '../lib/itineraryApi.js'
import { activityApi } from '../lib/activityApi.js'

function ActivitySchedulerPage() {
  const { itineraryId } = useParams()
  const { user, logout, authLoading, isAuthenticated } = useAuth()

  const [tripsData, setTripsData] = useState([])
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [tripItinerariesWithActivities, setTripItinerariesWithActivities] = useState([])

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

  const formatTimeStr = (value) => {
    if (!value) return 'Flexible time'
    try {
      return new Date(`2000-01-01T${value}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } catch (e) {
      return value
    }
  }

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      setError('')

      if (itineraryId) {
        // Direct detail link
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
        // Landing page: fetch user trips with activity stats
        const allTrips = await tripApi.getAllTrips()
        const enrichedTrips = await Promise.all(
          (allTrips || []).map(async (t) => {
            try {
              const itins = await itineraryApi.getAllItineraries(t.id)
              let totalActs = 0
              for (const itin of itins || []) {
                try {
                  const acts = await activityApi.getAllActivities(t.id, itin.id)
                  totalActs += (acts || []).length
                } catch (e) {
                  // ignore
                }
              }
              return { trip: t, itineraryCount: (itins || []).length, totalActivities: totalActs }
            } catch (e) {
              return { trip: t, itineraryCount: 0, totalActivities: 0 }
            }
          })
        )
        setTripsData(enrichedTrips)
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

  const handleSelectTrip = async (tripItem) => {
    try {
      setLoading(true)
      setError('')
      setSelectedTrip(tripItem)

      const itins = await itineraryApi.getAllItineraries(tripItem.id)
      const enrichedDays = await Promise.all(
        (itins || []).map(async (itin) => {
          try {
            const acts = await activityApi.getAllActivities(tripItem.id, itin.id)
            const sorted = [...(acts || [])].sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'))
            return {
              itinerary: itin,
              activities: sorted,
              firstActivityTime: sorted.length > 0 && sorted[0].startTime ? sorted[0].startTime : null
            }
          } catch (e) {
            return { itinerary: itin, activities: [], firstActivityTime: null }
          }
        })
      )
      setTripItinerariesWithActivities(enrichedDays)
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
                  /* LEVEL 1: TRIP SELECTION FOR SCHEDULING */
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <p className="eyebrow">SCHEDULER</p>
                        <h2 style={{ margin: '4px 0 0 0' }}>Activity Scheduler</h2>
                        <p style={{ color: 'var(--paragraph)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                          Organize every activity, place, and time of your journey.
                        </p>
                      </div>
                      <Link to="/trips/new" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        ✈️ Plan New Trip
                      </Link>
                    </div>

                    {tripsData.length === 0 ? (
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
                        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                        gap: '20px',
                        marginTop: '16px'
                      }}>
                        {tripsData.map(({ trip: item, itineraryCount, totalActivities }) => {
                          const statusStyle = getStatusColor(item.status)
                          const start = new Date(item.startDate)
                          const end = new Date(item.endDate)

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
                                  <span className="schedule-time-pill">
                                    ⏱ SCHEDULE
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
                                  {item.title}
                                </h3>
                                <p style={{ color: 'var(--paragraph)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
                                  📍 {item.destination} · {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>

                                <div style={{
                                  padding: '12px 14px',
                                  borderRadius: '12px',
                                  background: 'var(--surface-strong, rgba(0,0,0,0.04))',
                                  border: '1px solid var(--border)',
                                  display: 'flex',
                                  justifyContent: 'space-around',
                                  alignItems: 'center',
                                  textAlign: 'center',
                                  margin: '12px 0 16px 0'
                                }}>
                                  <div>
                                    <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent, #cd7b2f)' }}>
                                      {totalActivities}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--paragraph)', textTransform: 'uppercase', fontWeight: 600 }}>
                                      Activities
                                    </span>
                                  </div>
                                  <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
                                  <div>
                                    <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                                      {itineraryCount}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--paragraph)', textTransform: 'uppercase', fontWeight: 600 }}>
                                      Days
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="primary-button"
                                style={{ width: '100%', fontSize: '0.9rem', marginTop: '8px' }}
                                onClick={() => handleSelectTrip(item)}
                              >
                                Open Schedule
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  /* LEVEL 2: ITINERARY DAY SELECTION FOR SCHEDULING */
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
                        📍 {selectedTrip.destination} — Select a day to view and schedule activities.
                      </p>
                    </div>

                    {tripItinerariesWithActivities.length === 0 ? (
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
                          Create an itinerary day for {selectedTrip.title} first to start scheduling activities!
                        </p>
                        <Link to={`/itinerary/${selectedTrip.id}`} className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                          Create Itinerary Day
                        </Link>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                        gap: '18px',
                        marginTop: '16px'
                      }}>
                        {tripItinerariesWithActivities.map(({ itinerary: itin, activities, firstActivityTime }) => (
                          <div
                            key={itin.id}
                            style={{
                              padding: '22px',
                              borderRadius: '18px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface-strong, rgba(255, 255, 255, 0.03))',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span className="schedule-time-pill">
                                  🕘 DAY {itin.dayNumber}
                                </span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent, #cd7b2f)' }}>
                                  {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'}
                                </span>
                              </div>

                              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--text)' }}>
                                {itin.title}
                              </h3>
                              <p style={{ color: 'var(--paragraph)', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
                                📅 {itin.date ? new Date(itin.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}
                              </p>

                              {firstActivityTime && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--paragraph)', margin: '0 0 16px 0', opacity: 0.9 }}>
                                  ⏱ First activity: <strong>{formatTimeStr(firstActivityTime)}</strong>
                                </p>
                              )}
                            </div>

                            <Link
                              to={`/activity-scheduler/${itin.id}`}
                              className="primary-button"
                              style={{ textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '0.88rem', marginTop: '12px' }}
                            >
                              Open Schedule ➔
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
                        <h2 style={{ margin: '4px 0', color: 'var(--text)' }}>⏱ {detailEntry.trip.title}</h2>
                        <p style={{ color: 'var(--paragraph)', margin: 0 }}>📍 {detailEntry.trip.destination}</p>
                      </div>
                      <Link to={`/itinerary/${detailEntry.trip.id}`} className="secondary-button" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
                        View Itinerary
                      </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                      <SchedulerDetail label="SCHEDULE DAY" value={`Day ${detailEntry.itinerary.dayNumber}`} />
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
