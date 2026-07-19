import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import ActivitySchedulePanel from '../components/itinerary/ActivitySchedulePanel.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'
import { itineraryApi } from '../lib/itineraryApi.js'

function ActivitySchedulerPage() {
  const { itineraryId } = useParams()
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [entries, setEntries] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadScheduler = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      setError('')
      const trips = await tripApi.getAllTrips()
      const itineraryGroups = await Promise.all(trips.map(async (trip) => ({ trip, itineraries: await itineraryApi.getAllItineraries(trip.id) })))
      const available = itineraryGroups.flatMap(({ trip, itineraries }) => itineraries.map((itinerary) => ({ trip, itinerary })))
      setEntries(available)
      if (itineraryId) {
        const match = available.find((entry) => String(entry.itinerary.id) === itineraryId)
        if (!match) setError('The requested itinerary could not be found or you do not have permission to view it.')
        setSelected(match ?? null)
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load activity scheduling details.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, itineraryId])

  useEffect(() => { loadScheduler() }, [loadScheduler])

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  return <div className="app-shell dashboard-layout">
    <div className="dashboard-shell">
      <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />
      <div className="dashboard-content">
        <Sidebar />
        <main className="dashboard-main">
          <section className="section-card">
            {loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--paragraph)' }}>Loading activity scheduler...</div> : error ? <div style={{ textAlign: 'center', padding: '40px 20px' }}><h3>Unable to load activity scheduler</h3><p style={{ color: 'var(--paragraph)' }}>{error}</p><Link to="/itinerary" className="primary-button" style={{ display: 'inline-block', textDecoration: 'none' }}>Back to Itinerary</Link></div> : !itineraryId ? <SchedulerChooser entries={entries} /> : selected && <>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', paddingBottom: '22px', borderBottom: '1px solid var(--border)' }}>
                <div><p className="eyebrow" style={{ marginBottom: '4px' }}><Link to={`/itinerary/${selected.trip.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>Itinerary</Link> &rarr; Activity Scheduling</p><h2 style={{ margin: '4px 0' }}>{selected.trip.title}</h2><p style={{ color: 'var(--paragraph)', margin: 0 }}>{selected.trip.destination}</p></div>
                <Link to={`/itinerary/${selected.trip.id}`} className="secondary-button" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>Back to Itinerary</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                <SchedulerDetail label="DAY" value={`Day ${selected.itinerary.dayNumber}`} /><SchedulerDetail label="DAY TITLE" value={selected.itinerary.title} /><SchedulerDetail label="DATE" value={new Date(selected.itinerary.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} />
              </div>
              <ActivitySchedulePanel tripId={selected.trip.id} itineraryId={selected.itinerary.id} />
            </>}
          </section>
        </main>
      </div>
    </div>
  </div>
}

function SchedulerChooser({ entries }) {
  return <><div style={{ marginBottom: '28px' }}><p className="eyebrow">Planner</p><h2 style={{ margin: '4px 0' }}>Activity Scheduling</h2><p style={{ color: 'var(--paragraph)', margin: 0 }}>Choose an itinerary day to schedule its activities.</p></div>{entries.length === 0 ? <div className="itinerary-empty-state"><h4>No itinerary days available.</h4><p>Create an itinerary day before scheduling activities.</p><Link to="/itinerary" className="primary-button" style={{ display: 'inline-block', textDecoration: 'none' }}>Go to Itinerary</Link></div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>{entries.map(({ trip, itinerary }) => <div key={itinerary.id} className="itinerary-day-card" style={{ padding: '20px' }}><p className="eyebrow" style={{ margin: '0 0 4px' }}>{trip.title}</p><h3 style={{ margin: '0 0 6px' }}>Day {itinerary.dayNumber}: {itinerary.title}</h3><p style={{ color: 'var(--paragraph)', margin: '0 0 16px' }}>{itinerary.date}</p><Link to={`/activity-scheduler/${itinerary.id}`} className="primary-button" style={{ display: 'inline-block', textDecoration: 'none' }}>Manage Activities</Link></div>)}</div>}</>
}

function SchedulerDetail({ label, value }) { return <div style={{ padding: '16px', background: 'var(--surface-strong)', border: '1px solid var(--border)', borderRadius: '14px' }}><span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--paragraph)', marginBottom: '5px' }}>{label}</span><strong>{value}</strong></div> }

export default ActivitySchedulerPage
