const destinations = [
  { name: 'Bali', country: 'Indonesia', description: 'Sun-drenched beaches and jungle retreats.', rating: '4.9' },
  { name: 'Goa', country: 'India', description: 'Relaxed coastal escapes and vibrant nightlife.', rating: '4.8' },
  { name: 'Kerala', country: 'India', description: 'Backwaters, spices, and serene houseboats.', rating: '4.9' },
  { name: 'Manali', country: 'India', description: 'Snowy peaks, cozy stays, and mountain air.', rating: '4.7' },
  { name: 'Paris', country: 'France', description: 'Classic romance wrapped in timeless charm.', rating: '4.9' },
  { name: 'Switzerland', country: 'Europe', description: 'Alpine adventures with postcard-perfect views.', rating: '4.8' },
  { name: 'Maldives', country: 'Indian Ocean', description: 'Private villas floating above turquoise waters.', rating: '5.0' },
  { name: 'Japan', country: 'Asia', description: 'Cherry blossoms, tech cities, and quiet temples.', rating: '4.8' },
]

function DestinationsSection({ searchValue }) {
  const filteredDestinations = destinations.filter((destination) => {
    const term = searchValue.trim().toLowerCase()

    if (!term) {
      return true
    }

    return [destination.name, destination.country, destination.description]
      .join(' ')
      .toLowerCase()
      .includes(term)
  })

  return (
    <section className="content-section" id="destinations">
      <div className="section-heading">
        <p className="eyebrow">Popular escapes</p>
        <h2>Discover destinations made for shared memories.</h2>
      </div>

      <div className="destination-grid">
        {filteredDestinations.map((destination) => (
          <article className="destination-card" key={destination.name}>
            <div className="destination-image">✦</div>
            <div className="destination-body">
              <div className="destination-topline">
                <div>
                  <h3>{destination.name}</h3>
                  <p>{destination.country}</p>
                </div>
                <span>★ {destination.rating}</span>
              </div>
              <p>{destination.description}</p>
              <button type="button">Explore</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DestinationsSection
