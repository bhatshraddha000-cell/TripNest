import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { destinationService } from '../lib/destinationService.js'
import './DestinationsPage.css'

const DestinationForm = lazy(() => import('../components/destinations/DestinationForm.jsx'))
const categories = ['ALL', 'BEACH', 'MOUNTAIN', 'HISTORICAL', 'ADVENTURE', 'HILL_STATION', 'CITY']
const fallbackImage = 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80'

const getErrorMessage = (error) => error?.response?.data?.message ?? 'We could not load destinations. Please try again.'
const prettyCategory = (category) => category?.replace('_', ' ') ?? 'Destination'
const isAdmin = (user) => user?.roles?.some((role) => role === 'ROLE_ADMIN' || role === 'ADMIN')

function DestinationsPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [destinations, setDestinations] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  const loadDestinations = useCallback(async (searchValue = '', categoryValue = 'ALL') => {
    try {
      setLoading(true)
      setError('')
      const data = searchValue.trim()
        ? await destinationService.searchDestinations(searchValue.trim())
        : categoryValue !== 'ALL'
          ? await destinationService.filterByCategory(categoryValue)
          : await destinationService.getAllDestinations()
      setDestinations(data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const timer = window.setTimeout(() => loadDestinations(query, category), query ? 400 : 0)
    return () => window.clearTimeout(timer)
  }, [category, isAuthenticated, loadDestinations, query])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const admin = useMemo(() => isAdmin(user), [user])
  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  async function createDestination(payload) {
    try {
      setSubmitting(true)
      await destinationService.createDestination(payload)
      setFormOpen(false)
      setToast('Destination added successfully.')
      await loadDestinations(query, category)
    } finally {
      setSubmitting(false)
    }
  }

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />

  return <div className="app-shell dashboard-layout">
    <div className="dashboard-shell">
      <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />
      <div className="dashboard-content">
        <Sidebar />
        <main className="dashboard-main">
          <section className="section-card destination-page">
            <div className="destination-heading">
              <div><p className="eyebrow">Discover</p><h2>Destinations</h2><p>Find the perfect place for your next escape.</p></div>
              {admin ? <button className="primary-button" onClick={() => setFormOpen(true)}>+ Add Destination</button> : null}
            </div>
            <div className="destination-toolbar">
              <label className="destination-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search destinations..." aria-label="Search destinations" /></label>
              <select value={category} onChange={(event) => { setCategory(event.target.value); setQuery('') }} aria-label="Filter destinations by category">
                {categories.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All categories' : prettyCategory(item)}</option>)}
              </select>
            </div>
            {loading ? <DestinationSkeleton /> : error ? <div className="destination-state"><h3>Unable to load destinations</h3><p>{error}</p><button className="primary-button" onClick={() => loadDestinations(query, category)}>Retry</button></div> : destinations.length === 0 ? <div className="destination-state"><span>🧭</span><h3>No destinations found</h3><p>Try another search term or category.</p></div> : <div className="destination-grid">
              {destinations.map((destination) => <article className="destination-card" key={destination.id}>
                <img src={destination.imageUrl || fallbackImage} alt={destination.name} loading="lazy" onError={(event) => { event.currentTarget.src = fallbackImage }} />
                <div className="destination-card-content"><div className="destination-card-topline"><span>{prettyCategory(destination.category)}</span>{destination.rating ? <span>★ {destination.rating}</span> : null}</div><h3>{destination.name}</h3><p className="destination-location">📍 {[destination.state, destination.country].filter(Boolean).join(', ')}</p><p className="destination-description">{destination.description || 'Discover memorable sights, local culture, and experiences.'}</p><div className="destination-card-footer"><small>Best time: {destination.bestTimeToVisit || 'Anytime'}</small><Link className="secondary-button" to={`/destinations/${destination.id}`}>View Details</Link></div></div>
              </article>)}
            </div>}
          </section>
        </main>
      </div>
    </div>
    {toast ? <div className="destination-toast" role="status">{toast}</div> : null}
    {formOpen ? <div className="modal-overlay destination-modal"><div className="destination-modal-card"><div className="destination-modal-heading"><h3>Add a destination</h3><button className="destination-close" onClick={() => setFormOpen(false)} aria-label="Close">×</button></div><Suspense fallback={<p>Loading form…</p>}><DestinationForm onSubmit={createDestination} onCancel={() => setFormOpen(false)} submitting={submitting} /></Suspense></div></div> : null}
  </div>
}

function DestinationSkeleton() { return <div className="destination-grid">{Array.from({ length: 6 }, (_, index) => <div className="destination-card destination-skeleton" key={index}><div /><section><i /><i /><i /></section></div>)}</div> }

export default DestinationsPage
