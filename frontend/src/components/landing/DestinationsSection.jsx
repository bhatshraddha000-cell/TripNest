import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { publicDestinationService } from '../../lib/publicDestinationService'
// Ensure we use the exact same styles as DestinationsPage
import '../../pages/DestinationsPage.css'

function DestinationSkeleton() {
  return (
    <div className="destination-grid">
      {Array.from({ length: 8 }, (_, index) => (
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

function DestinationsSection({ searchValue }) {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDestinations = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await publicDestinationService.getRandomDestinations(8)
      setDestinations(data)
    } catch (err) {
      setError('We could not load popular destinations at the moment.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDestinations()
  }, [fetchDestinations])

  const filteredDestinations = destinations.filter((destination) => {
    const term = searchValue?.trim().toLowerCase() || ''
    if (!term) return true
    return [destination.name, destination.country, destination.description]
      .join(' ')
      .toLowerCase()
      .includes(term)
  })

  return (
    <section className="content-section dynamic-destinations-main" id="destinations" style={{ padding: '0' }}>
      <div className="section-heading" style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">Popular escapes</p>
        <h2>Discover destinations made for shared memories.</h2>
      </div>

      {loading ? (
        <DestinationSkeleton />
      ) : error ? (
        <div className="destination-state error-state">
          <h3>Unable to load destinations</h3>
          <p>{error}</p>
          <button className="primary-button" onClick={fetchDestinations}>Retry</button>
        </div>
      ) : (
        <div className="destination-grid">
          {filteredDestinations.map((dest, i) => (
            <article className="destination-card glass-card fade-in" key={dest.name} style={{animationDelay: `${i * 0.1}s`}}>
              <div className="card-image-wrapper">
                {dest.imageUrl && <img src={dest.imageUrl} alt={dest.name} loading="lazy" />}
                <div className="card-overlay"></div>
              </div>
              <div className="card-content">
                <div className="card-topline" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>📍 {dest.country}</span>
                  <span style={{ fontWeight: '600', color: '#ffb400' }}>★ {dest.rating}</span>
                </div>
                <h3>{dest.name}</h3>
                <p className="card-description" style={{ fontSize: '0.9rem', opacity: '0.9', minHeight: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{dest.description}</p>
                <div className="card-footer" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <Link to={`/explore/${dest.name}`} className="secondary-button view-details-btn" style={{ width: '100%', display: 'block' }}>
                    Explore
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default DestinationsSection
