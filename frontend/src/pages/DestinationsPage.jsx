import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { destinationService } from '../lib/destinationService.js'
import './DestinationsPage.css'

function DestinationsPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDestinations = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await destinationService.getMyDestinations()
      setDestinations(data)
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? 'We could not load your destinations. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    loadDestinations()
  }, [isAuthenticated, loadDestinations])

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />
        <div className="dashboard-content">
          <Sidebar />
          <main className="dashboard-main dynamic-destinations-main">
            {loading ? (
              <DestinationSkeleton />
            ) : error ? (
              <div className="destination-state error-state">
                <h3>Unable to load destinations</h3>
                <p>{error}</p>
                <button className="primary-button" onClick={loadDestinations}>Retry</button>
              </div>
            ) : !destinations || destinations.length === 0 ? (
              <div className="destination-state empty-state">
                <div className="empty-state-content glass-card">
                  <span className="empty-icon">🌍</span>
                  <h2>The world is waiting</h2>
                  <p>You have no upcoming trips. Plan your first trip to unlock personalized destination guides.</p>
                  <Link to="/trips/new" className="primary-button cta-button">Plan your first trip</Link>
                </div>
              </div>
            ) : (
              <div className="destinations-container">
                <header className="destinations-header">
                  <p className="eyebrow">Your Adventures</p>
                  <h2>Upcoming Destinations</h2>
                </header>
                <div className="destination-grid">
                  {destinations.map((dest, i) => (
                    <article className="destination-card glass-card fade-in" key={dest.tripId || i} style={{animationDelay: `${i * 0.1}s`}}>
                      <div className="card-image-wrapper">
                        {dest.imageUrl && <img src={dest.imageUrl} alt={dest.destination} loading="lazy" />}
                        <div className="card-overlay"></div>
                      </div>
                      <div className="card-content">
                        <div className="card-topline">
                          <span>📍 {dest.country}</span>
                        </div>
                        <h3>{dest.destination}</h3>
                        <p className="card-description">Ready for your upcoming trip to {dest.destination}?</p>
                        <div className="card-footer">
                          <Link className="secondary-button view-details-btn" to={`/destinations/${dest.tripId}`}>
                            Explore Guide
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function DestinationSkeleton() {
  return (
    <div className="destination-grid">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="destination-card destination-skeleton glass-card" key={index}>
          <div className="skeleton-img" />
          <section className="skeleton-content">
            <i className="skeleton-line" />
            <i className="skeleton-line" />
            <i className="skeleton-line short" />
          </section>
        </div>
      ))}
    </div>
  )
}

export default DestinationsPage
