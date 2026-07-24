import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { destinationService } from '../lib/destinationService.js'
import './DestinationDetailsPage.css'

function DestinationDetailsPage() {
  const { tripId } = useParams()
  const { user, logout, isAuthenticated } = useAuth()
  const [destination, setDestination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDetails = useCallback(async () => {
    if (!tripId || tripId === 'undefined') {
      setLoading(false);
      setDestination(null);
      return;
    }
    try {
      setLoading(true)
      const data = await destinationService.getDestinationDetails(tripId)
      setDestination(data)
    } catch (err) {
      setError('Unable to load destination details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    if (isAuthenticated) loadDetails()
  }, [isAuthenticated, loadDetails])

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  if (loading) return <div className="details-loading"><div className="spinner"></div></div>
  if (error) return <div className="details-error"><h3>{error}</h3><Link to="/destinations" className="primary-button">Go Back</Link></div>
  if (!destination) return <div className="details-error"><h3>Destination not found</h3><Link to="/destinations" className="primary-button">Go Back</Link></div>

  const hasLeftContent = Boolean(
    destination.description ||
    (destination.pointsOfInterest && destination.pointsOfInterest.length > 0) ||
    (destination.travelTips && destination.travelTips.length > 0) ||
    (destination.localFoods && destination.localFoods.length > 0)
  );

  return (
    <div className="app-shell dashboard-layout premium-details-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />
        <div className="dashboard-content">
          <Sidebar />
          <main className="dashboard-main details-main p-0">
            {/* HERO SECTION */}
            <section className="hero-section">
              {destination.heroImage && <img src={destination.heroImage} alt={destination.name} className="hero-img" />}
              <div className="hero-overlay"></div>
              <div className="hero-content fade-in">
                <Link to="/destinations" className="back-link">← Back to Destinations</Link>
                <h1>{destination.name}</h1>
                <p className="hero-country">📍 {destination.country}</p>
              </div>
            </section>

            {/* QUICK STATS BAR */}
            <section className="quick-stats glass-panel slide-up">
              {destination.currentTemperature != null && (
                <div className="stat-item">
                  <span className="stat-icon">☀️</span>
                  <div>
                    <small>Weather</small>
                    <p>{destination.currentTemperature}°C</p>
                  </div>
                </div>
              )}
              {(destination.timezoneAbbreviation || destination.timezone) && (
                <div className="stat-item">
                  <span className="stat-icon">🕒</span>
                  <div>
                    <small>Timezone</small>
                    <p>{destination.timezoneAbbreviation || destination.timezone}</p>
                  </div>
                </div>
              )}
              {destination.currency && (
                <div className="stat-item">
                  <span className="stat-icon">💱</span>
                  <div>
                    <small>Currency</small>
                    <p>{destination.currency}</p>
                  </div>
                </div>
              )}
              {destination.language && (
                <div className="stat-item">
                  <span className="stat-icon">🗣️</span>
                  <div>
                    <small>Language</small>
                    <p>{destination.language}</p>
                  </div>
                </div>
              )}
              {destination.bestTime && (
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <div>
                    <small>Best Time</small>
                    <p>{destination.bestTime}</p>
                  </div>
                </div>
              )}
            </section>

            {/* TWO COLUMN CONTENT */}
            <div className={`content-grid ${!hasLeftContent ? 'single-column-layout' : ''}`}>
              
              {/* LEFT COLUMN */}
              {hasLeftContent && (
                <div className="content-main">
                {destination.description && (
                  <section className="info-section slide-up delay-1">
                    <h2>About {destination.name}</h2>
                    <p className="description-text">{destination.description}</p>
                  </section>
                )}

                {(destination.topAttractions && destination.topAttractions.length > 0) ? (
                  <section className="info-section slide-up delay-2">
                    <h2>Top Attractions</h2>
                    <div className="attraction-list">
                      {destination.topAttractions.map((attraction, i) => (
                        <Link to={`/attraction/${attraction.xid}`} className="attraction-list-item" key={i}>
                          <div className="attraction-item-left">
                            <span className="attraction-icon">🏛️</span>
                            <h4>{attraction.name}</h4>
                          </div>
                          <span className="attraction-arrow">›</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : (
                  destination.pointsOfInterest && destination.pointsOfInterest.length > 0 && (
                    <section className="info-section slide-up delay-2">
                      <h2>Top Attractions</h2>
                      <div className="attraction-carousel">
                        {destination.pointsOfInterest.map((poi, i) => (
                          <div className="attraction-card" key={i}>
                            <div className="attraction-img">🗺️</div>
                            <h4>{poi}</h4>
                          </div>
                        ))}
                      </div>
                    </section>
                  )
                )}

                {destination.travelTips && destination.travelTips.length > 0 && (
                  <section className="info-section slide-up delay-3">
                    <h2>Travel Tips</h2>
                    <ul className="travel-tips-timeline">
                      {destination.travelTips.map((tip, i) => (
                        <li key={i}>
                          <div className="timeline-dot"></div>
                          <p>{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                
                {destination.localFoods && destination.localFoods.length > 0 && (
                  <section className="info-section slide-up delay-4">
                    <h2>Local Foods to Try</h2>
                    <div className="food-grid">
                      {destination.localFoods.map((food, i) => (
                        <div className="food-card" key={i}>
                          <span>🍽️</span>
                          <p>{food}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
              )}

              {/* RIGHT COLUMN */}
              <div className="content-sidebar slide-up delay-2">
                {destination.latitude && destination.longitude && (
                  <section className="info-section map-section">
                    <h2>Interactive Map</h2>
                    <div className="map-container glass-panel">
                      <iframe 
                        title={`Map of ${destination.name}`}
                        width="100%" 
                        height="300" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight="0" 
                        marginWidth="0" 
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${destination.longitude-0.05},${destination.latitude-0.05},${destination.longitude+0.05},${destination.latitude+0.05}&layer=mapnik&marker=${destination.latitude},${destination.longitude}`}>
                      </iframe>
                    </div>
                  </section>
                )}

                {destination.nearbyPlaces && destination.nearbyPlaces.length > 0 && (
                  <section className="info-section">
                    <h2>Nearby Places</h2>
                    <ul className="nearby-list glass-panel">
                      {destination.nearbyPlaces.map((place, i) => (
                        <li key={i}><span>📍</span> {place}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>

            {/* FULL WIDTH GALLERY */}
            {destination.gallery && destination.gallery.length > 0 && (
              <section className="info-section gallery-section slide-up delay-5">
                <h2>Photo Gallery</h2>
                <div className="photo-gallery">
                  {destination.gallery.map((img, i) => (
                    <div className="gallery-item" key={i}>
                      <img src={img} alt={`Gallery ${i}`} loading="lazy" />
                    </div>
                  ))}
                </div>
              </section>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}

export default DestinationDetailsPage
