function UpcomingTrips({ trips }) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Planner</p>
          <h2>Upcoming Trips</h2>
        </div>
        <button className="ghost-link" type="button">
          View all
        </button>
      </div>

      <div className="trip-list">
        {trips.map((trip) => (
          <article className="trip-card" key={trip.destination}>
            <div className="trip-image">{trip.imageLabel}</div>
            <div className="trip-info">
              <div className="trip-topline">
                <strong>{trip.destination}</strong>
                <span className={`status-badge ${trip.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {trip.status}
                </span>
              </div>
              <p>{trip.date}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default UpcomingTrips
