const destinations = [
  { name: 'Santorini', label: 'Sunset views' },
  { name: 'Kyoto', label: 'Cherry blossoms' },
  { name: 'Marrakech', label: 'Desert escapes' },
  { name: 'Reykjavík', label: 'Northern lights' },
]

function TravelInspiration() {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Inspiration</p>
          <h2>Travel Inspiration</h2>
        </div>
      </div>

      <div className="inspiration-grid">
        {destinations.map((destination) => (
          <article className="inspiration-card" key={destination.name}>
            <div className="inspiration-image">{destination.name[0]}</div>
            <div>
              <strong>{destination.name}</strong>
              <p>{destination.label}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default TravelInspiration
