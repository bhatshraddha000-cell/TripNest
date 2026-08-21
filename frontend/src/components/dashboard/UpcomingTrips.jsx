import { useNavigate } from 'react-router-dom'

function formatTripDate(startDate, endDate) {
  if (!startDate) return 'Date TBD'
  const start = new Date(startDate)
  if (isNaN(start.getTime())) return startDate
  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  if (!endDate) {
    return start.toLocaleDateString('en-US', options)
  }
  const end = new Date(endDate)
  if (isNaN(end.getTime())) {
    return start.toLocaleDateString('en-US', options)
  }
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', options)}`
}

function UpcomingTrips({ trips = [] }) {
  const navigate = useNavigate()

  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Planner</p>
          <h2>Upcoming Trips</h2>
        </div>
        <button className="ghost-link" type="button" onClick={() => navigate('/trips')}>
          View all
        </button>
      </div>

      <div className="trip-list">
        {(!trips || trips.length === 0) ? (
          <p style={{ color: '#64748b', fontSize: '0.95rem', padding: '16px 0', margin: 0 }}>
            No upcoming trips
          </p>
        ) : (
          trips.map((trip) => {
            const tripId = trip.id
            const destinationName = trip.destination || trip.title || 'Trip'
            const rawStatus = trip.status ? String(trip.status) : 'Planning'
            const displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase()
            const statusClass = rawStatus.toLowerCase().replace(/\s+/g, '-')
            const dateDisplay = trip.date || formatTripDate(trip.startDate, trip.endDate)
            const icon = trip.imageLabel || '🏝'

            return (
              <article
                className="trip-card"
                key={tripId || destinationName}
                onClick={() => tripId && navigate(`/trips/${tripId}`)}
                style={tripId ? { cursor: 'pointer' } : {}}
              >
                <div className="trip-image">{icon}</div>
                <div className="trip-info">
                  <div className="trip-topline">
                    <strong>{destinationName}</strong>
                    <span className={`status-badge ${statusClass}`}>
                      {displayStatus}
                    </span>
                  </div>
                  <p>{dateDisplay}</p>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export default UpcomingTrips
