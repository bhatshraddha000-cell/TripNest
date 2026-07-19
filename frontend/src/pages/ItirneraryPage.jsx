import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import ItineraryManager from '../components/itinerary/ItineraryManager.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'

function ItineraryPage() {
  const { tripId } = useParams()
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [trip, setTrip] = useState(null)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTrip = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      setError('')
      if (tripId) setTrip(await tripApi.getTrip(tripId))
      else setTrips(await tripApi.getAllTrips())
    } catch (err) {
      setError(err?.response?.status === 404 ? 'The requested trip could not be found or you do not have permission to view it.' : err?.response?.data?.message ?? 'Failed to load trip details.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, tripId])

  useEffect(() => { loadTrip() }, [loadTrip])

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />
        <div className="dashboard-content">
          <Sidebar />
          <main className="dashboard-main">
            <section className="section-card">
              {loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Loading itinerary...</div> : error ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}><h3>Unable to load itinerary</h3><p style={{ color: 'var(--text-secondary)' }}>{error}</p><Link to="/trips" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>Back to My Trips</Link></div>
              ) : !tripId ? <>
                <div style={{ marginBottom: '28px' }}><p className="eyebrow">Planner</p><h2 style={{ margin: '4px 0' }}>Itinerary</h2><p style={{ color: 'var(--text-secondary)', margin: 0 }}>Choose a trip to plan its day-by-day itinerary.</p></div>
                {trips.length === 0 ? <div style={{ textAlign: 'center', padding: '45px 20px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}><p style={{ color: 'var(--text-secondary)' }}>Create a trip before building an itinerary.</p><Link to="/trips/new" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>Plan New Trip</Link></div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>{trips.map((item) => <div key={item.id} style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}><h3 style={{ margin: '0 0 6px' }}>{item.title}</h3><p style={{ color: 'var(--text-secondary)', margin: '0 0 16px' }}>{item.destination}</p><Link to={`/itinerary/${item.id}`} className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>Manage Itinerary</Link></div>)}</div>}
              </> : <>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', paddingBottom: '22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div><p className="eyebrow" style={{ marginBottom: '4px' }}><Link to="/trips" style={{ color: 'inherit', textDecoration: 'none' }}>Planner</Link> &rarr; Itinerary</p><h2 style={{ margin: '4px 0' }}>{trip.title}</h2><p style={{ color: 'var(--text-secondary)', margin: 0 }}>{trip.destination} · {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><span style={{ padding: '6px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 'bold', backgroundColor: 'rgba(205,123,47,0.12)', color: '#cd7b2f' }}>{trip.status}</span>{trip.budget != null && <span style={{ color: '#cd7b2f', fontWeight: 700 }}>₹{trip.budget.toLocaleString('en-IN')}</span>}</div>
                </div>
                <ItineraryManager trip={trip} />
              </>}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default ItineraryPage
