import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicDestinationService } from '../lib/publicDestinationService.js';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/landing/Navbar.jsx';
import Footer from '../components/landing/Footer.jsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './PublicDestinationDetailsPage.css';
import L from 'leaflet';

// Fix leaflet icon issue in react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function PublicDestinationSkeleton() {
  return (
    <div className="public-destination-page">
      <Navbar />
      <div className="hero-skeleton"></div>
      <div className="content-container two-column-grid">
        <div className="content-main">
          <div className="block-skeleton"></div>
          <div className="block-skeleton" style={{ height: '300px' }}></div>
        </div>
        <div className="content-sidebar">
          <div className="block-skeleton" style={{ height: '250px' }}></div>
          <div className="block-skeleton" style={{ height: '400px' }}></div>
        </div>
      </div>
    </div>
  );
}

function DebugPanel({ debugInfo }) {
  if (!import.meta.env.DEV) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      background: 'rgba(0,0,0,0.8)',
      color: '#0f172a',
      padding: '1rem',
      borderRadius: '8px',
      zIndex: 9999,
      maxWidth: '300px',
      fontSize: '0.8rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(8px)'
    }}>
      <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem', marginTop: 0 }}>🔧 Debug Panel (Dev Only)</h4>
      <div style={{ color: '#f1f5f9' }}>
        <strong>Cache:</strong> {debugInfo.cache}<br/>
        <strong>Coordinates:</strong> {debugInfo.sources.coordinates}<br/>
        <strong>Weather:</strong> {debugInfo.sources.weather}<br/>
        <strong>Description:</strong> {debugInfo.sources.description}<br/>
        <strong>Image:</strong> {debugInfo.sources.image}<br/>
        <strong>Attractions:</strong> {debugInfo.sources.attractions}
      </div>
    </div>
  );
}

function PublicDestinationDetailsPage() {
  const { destinationName } = useParams();
  const { isAuthenticated } = useAuth();
  
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const abortControllerRef = useRef(null);

  const loadData = useCallback(async () => {
    // Cancel previous request if switching destinations quickly
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError('');
      setDetails(null);
      
      const data = await publicDestinationService.getDestinationDetails(
        destinationName, 
        abortControllerRef.current.signal
      );
      
      setDetails(data);
    } catch (err) {
      if (err.name === 'AbortError') return; // Ignore aborts
      setError('We could not resolve this destination using public APIs. Please check the spelling or try a major city.');
    } finally {
      setLoading(false);
    }
  }, [destinationName]);

  useEffect(() => {
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  if (loading) return <PublicDestinationSkeleton />;

  if (error) {
    return (
      <div className="public-destination-page">
        <Navbar />
        <div className="error-state-container fade-in">
          <div className="error-illustration">🗺️</div>
          <h2>Destination Not Found</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="primary-button" onClick={loadData}>Retry</button>
            <Link to="/" className="secondary-button">Back to Home</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!details) return null;

  return (
    <div className="public-destination-page">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="hero-fullwidth fade-in">
        {details.heroImage ? (
          <img src={details.heroImage} alt={details.name} loading="lazy" />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#1e293b' }}></div>
        )}
        <div className="hero-gradient"></div>
        <Link to="/#destinations" className="back-btn-overlay">← Back</Link>
        <div className="hero-content">
          <div className="hero-meta fade-in" style={{ animationDelay: '0.2s' }}>
            {details.country && <span className="hero-chip">📍 {details.country}</span>}
            {details.region && <span className="hero-chip">🗺️ {details.region}</span>}
          </div>
          <h1 className="slide-up" style={{ animationDelay: '0.3s' }}>{details.name}</h1>
        </div>
      </section>

      <div className="content-container two-column-grid">
        <div className="content-main">
          
          {/* 2. ABOUT DESTINATION */}
          <section className="info-section slide-up" style={{ animationDelay: '0.1s' }}>
            <h2>About {details.name}</h2>
            <div className="glass-panel text-content-panel">
              {details.overview ? (
                <p>{details.overview}</p>
              ) : (
                <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>Information currently unavailable.</p>
              )}
            </div>
          </section>

          {/* 3. IMAGE GALLERY */}
          {details.gallery && details.gallery.length > 0 && (
            <section className="info-section slide-up" style={{ animationDelay: '0.2s' }}>
              <h2>Gallery</h2>
              <div className="gallery-masonry">
                {details.gallery.map((img, idx) => (
                  <div className="gallery-item" key={idx}>
                    <img src={img} alt={`${details.name} view ${idx + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. ATTRACTIONS */}
          <section className="info-section slide-up" style={{ animationDelay: '0.3s' }}>
            <h2>Top Attractions</h2>
            {details.topAttractions && details.topAttractions.length > 0 ? (
              <div className="attractions-grid">
                {details.topAttractions.map((attr, idx) => (
                  <div className="attraction-card" key={idx}>
                    {attr.image && (
                      <div className="attraction-img-wrapper">
                        <img src={attr.image} alt={attr.name} loading="lazy" />
                        <span className="attraction-badge">{attr.category}</span>
                      </div>
                    )}
                    <div className="attraction-content">
                      <h4>{attr.name}</h4>
                      <p className="attraction-desc">
                        {attr.description && attr.description.length > 150 
                          ? `${attr.description.substring(0, 147)}...` 
                          : attr.description}
                      </p>
                      {attr.lat && attr.lon && !/^(climate|history|economy|demographics|geography|politics|transport|education|architecture|culture) of/i.test(attr.name) && (
                        <a href="#map-section" className="map-link-btn" onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
                        }}>📍 View on Map</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel">
                <p style={{ fontStyle: 'italic', color: '#94a3b8', margin: 0 }}>Attraction information currently unavailable.</p>
              </div>
            )}
          </section>
          
        </div>

        <div className="content-sidebar">
          
          {/* 5. WEATHER CARD */}
          <section className="info-section slide-up" style={{ animationDelay: '0.1s' }}>
            <h2>Current Weather</h2>
            <div className="glass-panel weather-panel">
              {details.weather ? (
                <>
                  <div className="weather-header">
                    <div className="weather-temp">{details.weather.temperature}°C</div>
                    <div className="weather-cond">{details.weather.condition}</div>
                    {details.weather.localTime && <div className="weather-time">Local Time: {details.weather.localTime}</div>}
                  </div>
                  <div className="weather-stats-grid">
                    <div className="w-stat-card">
                      <span>Feels Like</span>
                      <strong>{details.weather.feelsLike}</strong>
                    </div>
                    <div className="w-stat-card">
                      <span>Humidity</span>
                      <strong>{details.weather.humidity}</strong>
                    </div>
                    <div className="w-stat-card">
                      <span>Wind Speed</span>
                      <strong>{details.weather.wind}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ fontStyle: 'italic', color: '#94a3b8', margin: 0 }}>Weather information currently unavailable.</p>
              )}
            </div>
          </section>

          {/* 6. INTERACTIVE MAP */}
          <section id="map-section" className="info-section slide-up" style={{ animationDelay: '0.2s' }}>
            <h2>Map & Locations</h2>
            <div className="map-wrapper glass-panel">
              {details.latitude && details.longitude ? (
                <>
                  <MapContainer center={[details.latitude, details.longitude]} zoom={13} scrollWheelZoom={false} className="premium-map">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Destination Marker */}
                    <Marker position={[details.latitude, details.longitude]}>
                      <Popup>
                        <strong>{details.name}</strong><br/>City Center
                      </Popup>
                    </Marker>
                    {/* Attraction Markers */}
                    {details.topAttractions?.map((attr) => (
                      attr.lat && attr.lon && (
                        <Marker key={attr.id} position={[attr.lat, attr.lon]}>
                          <Popup>
                            <strong>{attr.name}</strong><br/>{attr.category}
                          </Popup>
                        </Marker>
                      )
                    ))}
                  </MapContainer>
                  <a href={`https://www.google.com/maps?q=${details.latitude},${details.longitude}`} target="_blank" rel="noreferrer" className="google-maps-link">
                    🗺️ Open in Google Maps
                  </a>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <p style={{ fontStyle: 'italic', color: '#94a3b8', margin: 0 }}>Map data currently unavailable.</p>
                </div>
              )}
            </div>
          </section>

          {/* 7. EXTERNAL LINKS */}
          <section className="info-section slide-up" style={{ animationDelay: '0.4s' }}>
            <h2>Essential Info</h2>
            <div className="glass-panel links-panel">
              {details.wikipediaLink && (
                <a href={details.wikipediaLink} target="_blank" rel="noreferrer" className="external-link-card">
                  <span>📖 Wikipedia Article</span>
                  <span>↗</span>
                </a>
              )}
              <a href={`https://www.google.com/search?q=Official+Tourism+${details.name}`} target="_blank" rel="noreferrer" className="external-link-card">
                <span>🌐 Official Tourism Website</span>
                <span>↗</span>
              </a>
            </div>
          </section>

        </div>
      </div>
      
      {/* 8. CALL TO ACTION */}
      <section className="cta-fullwidth fade-in">
        <div className="cta-content">
          <h2>Ready to Plan Your Journey?</h2>
          <p>Turn your dream vacation to {details.name} into reality with our smart itinerary planner.</p>
          <div className="cta-buttons">
            {isAuthenticated ? (
              <Link to="/trips/new" className="primary-button cta-btn">Start Planning Trip</Link>
            ) : (
              <>
                <Link to="/login" className="primary-button cta-btn">Login</Link>
                <Link to="/register" className="secondary-button cta-btn outline-light">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
      {details.debug && <DebugPanel debugInfo={details.debug} />}
    </div>
  );
}

export default PublicDestinationDetailsPage;
