import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { destinationService } from '../../lib/destinationService.js'
import { publicDestinationService } from '../../lib/publicDestinationService.js'

function TravelInspiration() {
  const navigate = useNavigate()
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDestinations() {
      try {
        setLoading(true)
        setError('')

        let myDests = []
        try {
          const res = await destinationService.getMyDestinations()
          if (Array.isArray(res)) {
            myDests = res.map((d) => ({
              id: d.tripId,
              name: d.destination,
              label: d.country ? `Destination in ${d.country}` : 'Upcoming trip destination',
              isUserTrip: true,
              tripId: d.tripId,
              imageUrl: d.imageUrl
            }))
          }
        } catch (err) {
          console.warn('Could not load user destinations, falling back to featured:', err)
        }

        // Fetch popular destinations to fill up to 4 items
        const popular = await publicDestinationService.getRandomDestinations(8)
        const popularFormatted = (popular || []).map((p) => ({
          id: p.name,
          name: p.name,
          label: p.description || `${p.country || 'Global'} getaway`,
          isUserTrip: false,
          imageUrl: p.imageUrl
        }))

        // Combine user destinations first, then fill remainder from popular
        const combinedMap = new Map()
        myDests.forEach((d) => {
          if (d && d.name) {
            combinedMap.set(d.name.toLowerCase(), d)
          }
        })
        popularFormatted.forEach((p) => {
          if (p && p.name && !combinedMap.has(p.name.toLowerCase())) {
            combinedMap.set(p.name.toLowerCase(), p)
          }
        })

        const combinedList = Array.from(combinedMap.values()).slice(0, 4)
        setDestinations(combinedList)
      } catch (err) {
        console.error('Failed to load travel inspiration:', err)
        setError('Unable to load travel inspiration.')
      } finally {
        setLoading(false)
      }
    }

    fetchDestinations()
  }, [])

  const handleCardClick = (dest) => {
    if (dest.isUserTrip && dest.tripId) {
      navigate(`/destinations/${dest.tripId}`)
    } else {
      navigate(`/explore/${encodeURIComponent(dest.name)}`)
    }
  }

  return (
    <section className="section-card">
      <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow">Inspiration</p>
          <h2>Travel Inspiration</h2>
        </div>
        <Link to="/destinations" style={{ textDecoration: 'none', color: '#1f6e8a', fontSize: '0.85rem', fontWeight: '600' }}>
          View All ➔
        </Link>
      </div>

      {loading ? (
        <div className="inspiration-grid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <article className="inspiration-card" key={idx} style={{ opacity: 0.6 }}>
              <div className="inspiration-image">...</div>
              <div>
                <strong>Loading...</strong>
                <p>Discovering places</p>
              </div>
            </article>
          ))}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          <p>{error}</p>
        </div>
      ) : destinations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          <p>No destinations available right now.</p>
          <Link to="/destinations" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>
            Explore Destinations
          </Link>
        </div>
      ) : (
        <div className="inspiration-grid">
          {destinations.map((destination) => {
            const initial = (destination.name || 'D')[0].toUpperCase()
            return (
              <article
                className="inspiration-card"
                key={destination.name}
                onClick={() => handleCardClick(destination)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="inspiration-image">{initial}</div>
                <div>
                  <strong>{destination.name}</strong>
                  <p style={{ margin: '2px 0 0 0' }}>{destination.label}</p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default TravelInspiration
