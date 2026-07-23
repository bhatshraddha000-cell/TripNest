import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import './AttractionDetailsPage.css'
import { api } from '../lib/api.js'
import { ArrowLeft } from 'lucide-react'

// Fix for default leaflet marker icon not showing correctly in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function AttractionDetailsPage() {
  const { xid } = useParams()
  const { user, logout, isAuthenticated } = useAuth()
  const [attraction, setAttraction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const loadDetails = useCallback(async () => {
    if (!xid) {
      setLoading(false);
      return;
    }
    const requestUrl = `/api/attractions/${xid}`;
    try {
      setLoading(true)
      const response = await api.get(requestUrl);
      console.log('AttractionDetailsPage: API response data:', response.data);
      setAttraction(response.data)
    } catch (err) {
      console.error('AttractionDetailsPage: API error:', err.message);
      if (err.response) {
        console.error('AttractionDetailsPage: Error response status:', err.response.status);
        console.error('AttractionDetailsPage: Error response data:', err.response.data);
      }
      console.error('AttractionDetailsPage: Request URL was:', requestUrl);
      setError('No detailed information available.')
    } finally {
      setLoading(false)
    }
  }, [xid])

  useEffect(() => {
    if (isAuthenticated) loadDetails()
  }, [isAuthenticated, loadDetails])

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  if (loading) return (
    <div className="app-shell dashboard-layout premium-details-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />
        <div className="dashboard-content">
          <Sidebar />
          <main className="dashboard-main details-main">
            <div className="details-loading"><div className="spinner"></div></div>
          </main>
        </div>
      </div>
    </div>
  );

  if (error || !attraction) return (
    <div className="app-shell dashboard-layout premium-details-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />
        <div className="dashboard-content">
          <Sidebar />
          <main className="dashboard-main details-main">
             <div className="details-error">
               <h3>{error || 'Attraction not found'}</h3>
               <button onClick={() => window.history.back()} className="primary-button">Go Back</button>
             </div>
          </main>
        </div>
      </div>
    </div>
  );

  const getAvailableImages = (attr) => {
    if (!attr) return [];
    const images = [];
    if (attr.preview) images.push(attr.preview);
    if (attr.image) images.push(attr.image);
    if (attr.thumbnail) images.push(attr.thumbnail);
    if (attr.originalImage) images.push(attr.originalImage);
    if (attr.heroImage && !images.includes(attr.heroImage)) images.push(attr.heroImage);
    if (attr.fallbackImage) images.push(attr.fallbackImage);
    images.push('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop');
    return [...new Set(images)].filter(Boolean);
  };

  const availableImages = getAvailableImages(attraction);
  const rawHeroImg = availableImages[currentImageIndex] || availableImages[0];
  const baseURL = api.defaults.baseURL || 'http://localhost:8081';
  const heroImg = rawHeroImg ? `${baseURL}/api/images/proxy?url=${encodeURIComponent(rawHeroImg)}` : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop';

  return (
    <div className="app-shell dashboard-layout premium-details-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />
        <div className="dashboard-content">
          <Sidebar />
          <main className="dashboard-main details-main p-0">
            {/* HERO SECTION */}
            <section className="hero-section attraction-hero" style={{ position: 'relative' }}>
              <img 
                src={heroImg} 
                alt={attraction.name} 
                className="hero-img" 
                onError={() => {
                  if (currentImageIndex < availableImages.length - 1) {
                    setCurrentImageIndex(prev => prev + 1);
                  }
                }}
              />
              <div className="hero-overlay"></div>
              <div className="hero-content fade-in">
                <button onClick={() => window.history.back()} className="premium-back-button">
                  <ArrowLeft size={18} className="back-icon" />
                  <span>Back</span>
                </button>
                <h1>{attraction.name}</h1>
                {attraction.category && <p className="hero-category">{attraction.category.replace(/_/g, ' ')}</p>}
              </div>
            </section>

            {/* QUICK STATS BAR */}
            <section className="quick-stats glass-panel slide-up">
              {attraction.rating && (
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <div>
                    <small>Rating</small>
                    <p>{attraction.rating}/7</p>
                  </div>
                </div>
              )}
              {attraction.location && (
                <div className="stat-item">
                  <span className="stat-icon">📍</span>
                  <div>
                    <small>Location</small>
                    <p className="truncate-text" title={attraction.location}>{attraction.location}</p>
                  </div>
                </div>
              )}
              {attraction.website && (
                <div className="stat-item">
                  <span className="stat-icon">🌐</span>
                  <div>
                    <small>Website</small>
                    <p><a href={attraction.website} target="_blank" rel="noreferrer">Visit Site</a></p>
                  </div>
                </div>
              )}
              {attraction.wikipediaLink && (
                <div className="stat-item">
                  <span className="stat-icon">📚</span>
                  <div>
                    <small>Wikipedia</small>
                    <p><a href={attraction.wikipediaLink} target="_blank" rel="noreferrer">Read More</a></p>
                  </div>
                </div>
              )}
            </section>

            {/* TWO COLUMN CONTENT */}
            <div className="content-grid">
              
              {/* LEFT COLUMN */}
              <div className="content-main">
                {attraction.description && (
                  <section className="info-section slide-up delay-1">
                    <h2>About {attraction.name}</h2>
                    <p className="description-text" dangerouslySetInnerHTML={{ __html: attraction.description }}></p>
                  </section>
                )}

                {(attraction.openingHours || attraction.entryFee) && (
                  <section className="info-section slide-up delay-2">
                    <h2>Visitor Info</h2>
                    <div className="visitor-info-cards">
                      {attraction.openingHours && (
                        <div className="info-card">
                          <span className="info-icon">🕒</span>
                          <div>
                            <h4>Opening Hours</h4>
                            <p>{attraction.openingHours}</p>
                          </div>
                        </div>
                      )}
                      {attraction.entryFee && (
                        <div className="info-card">
                          <span className="info-icon">🎫</span>
                          <div>
                            <h4>Entry Fee</h4>
                            <p>{attraction.entryFee}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div className="content-sidebar slide-up delay-2">
                {attraction.latitude && attraction.longitude && (
                  <section className="info-section map-section">
                    <h2>Location</h2>
                    <div className="map-container glass-panel leaflet-map-wrapper">
                      <MapContainer 
                        center={[attraction.latitude, attraction.longitude]} 
                        zoom={15} 
                        scrollWheelZoom={false}
                        style={{ height: "300px", width: "100%", borderRadius: "12px" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[attraction.latitude, attraction.longitude]}>
                          <Popup>
                            <strong>{attraction.name}</strong><br/>
                            {attraction.category && <span>{attraction.category.replace(/_/g, ' ')}</span>}
                          </Popup>
                        </Marker>
                      </MapContainer>
                      <div className="map-actions">
                         <a 
                           href={`https://www.google.com/maps?q=${attraction.latitude},${attraction.longitude}`}
                           target="_blank" 
                           rel="noreferrer"
                           className="google-maps-btn"
                         >
                           🗺️ Open in Google Maps
                         </a>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  )
}

export default AttractionDetailsPage
