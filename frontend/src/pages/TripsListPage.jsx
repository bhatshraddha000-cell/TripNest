import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'

function TripsListPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchTrips() {
      if (!isAuthenticated) return
      try {
        setLoading(true)
        const data = await tripApi.getAllTrips()
        setTrips(data)
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load your trips. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchTrips()
  }, [isAuthenticated])

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

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

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />

        <div className="dashboard-content">
          <Sidebar />

          <main className="dashboard-main">
            <section className="section-card">
              <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <p className="eyebrow">Planner</p>
                  <h2>My Trips</h2>
                </div>
                <Link to="/trips/new" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  ✈️ Plan New Trip
                </Link>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Loading your adventures...</p>
                </div>
              ) : error ? (
                <div className="status-message error" style={{ marginBottom: '20px' }}>
                  <p style={{ margin: 0 }}>{error}</p>
                </div>
              ) : trips.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '16px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)'
                }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🗺️</span>
                  <h3>No trips found</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '8px auto 24px auto', fontSize: '0.95rem' }}>
                    You haven't planned any trips yet. Create your first adventure to start tracking details, budgets, and companions!
                  </p>
                  <Link to="/trips/new" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Create First Trip
                  </Link>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '20px',
                  marginTop: '16px'
                }}>
                  {trips.map((trip) => {
                    const statusStyle = getStatusColor(trip.status)
                    return (
                      <div key={trip.id} className="activity-card" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.03))'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)'
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
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
                              {trip.status.toLowerCase()}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              👥 {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
                            </span>
                          </div>

                          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{trip.title}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>📍 {trip.destination}</p>
                          
                          {trip.description && (
                            <p style={{
                              fontSize: '0.88rem',
                              color: 'var(--text-secondary)',
                              margin: '0 0 20px 0',
                              lineHeight: '1.4',
                              display: '-webkit-box',
                              WebkitLineClamp: '2',
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {trip.description}
                            </p>
                          )}
                        </div>

                        <div style={{
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          paddingTop: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 'auto'
                        }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DATES</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                              {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>BUDGET</span>
                            <strong style={{ color: '#cd7b2f', fontSize: '1.05rem' }}>₹{trip.budget.toLocaleString('en-IN')}</strong>
                          </div>
                        </div>

                        <Link to={`/trips/${trip.id}`} style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 1,
                          textIndent: '-9999px'
                        }}>
                          View Details
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default TripsListPage
