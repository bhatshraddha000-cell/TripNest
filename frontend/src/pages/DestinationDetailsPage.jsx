import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { destinationService } from '../lib/destinationService.js'
import './DestinationsPage.css'

const DestinationForm = lazy(() => import('../components/destinations/DestinationForm.jsx'))
const fallbackImage = 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=80'
const isAdmin = (user) => user?.roles?.some((role) => role === 'ROLE_ADMIN' || role === 'ADMIN')
const prettyCategory = (category) => category?.replace('_', ' ') ?? 'Destination'

function DestinationDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [destination, setDestination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const admin = useMemo(() => isAdmin(user), [user])

  const loadDestination = useCallback(async () => { try { setLoading(true); setError(''); setDestination(await destinationService.getDestinationById(id)) } catch (requestError) { setError(requestError?.response?.status === 404 ? 'This destination could not be found.' : requestError?.response?.data?.message ?? 'Unable to load destination details.') } finally { setLoading(false) } }, [id])
  useEffect(() => { if (isAuthenticated) loadDestination() }, [isAuthenticated, loadDestination])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])
  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />

  async function updateDestination(payload) { try { setSubmitting(true); await destinationService.updateDestination(id, payload); await loadDestination(); setEditing(false); setToast('Destination updated successfully.') } finally { setSubmitting(false) } }
  async function deleteDestination() { if (!window.confirm(`Delete ${destination.name}? This cannot be undone.`)) return; try { setDeleting(true); await destinationService.deleteDestination(id); navigate('/destinations') } catch (requestError) { setError(requestError?.response?.data?.message ?? 'Unable to delete this destination.') } finally { setDeleting(false) } }
  const displayName = user?.fullName ?? 'Traveler'; const displayEmail = user?.email ?? 'traveler@tripnest.com'

  return <div className="app-shell dashboard-layout"><div className="dashboard-shell"><Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} /><div className="dashboard-content"><Sidebar /><main className="dashboard-main"><section className="section-card destination-page">
    {loading ? <div className="destination-state"><p>Loading destination details…</p></div> : error ? <div className="destination-state"><h3>Unable to load destination</h3><p>{error}</p><button className="primary-button" onClick={loadDestination}>Retry</button><button className="secondary-button" onClick={() => navigate('/destinations')}>Back to destinations</button></div> : <>
      <button className="destination-back" onClick={() => navigate('/destinations')}>← Back to destinations</button>
      <div className="destination-hero"><img src={destination.imageUrl || fallbackImage} alt={destination.name} onError={(event) => { event.currentTarget.src = fallbackImage }} /><div><p className="eyebrow">{prettyCategory(destination.category)}</p><h1>{destination.name}</h1><p>📍 {[destination.state, destination.country].filter(Boolean).join(', ')}</p></div></div>
      <div className="destination-detail-actions">{admin ? <><button className="secondary-button" onClick={() => setEditing(true)}>Edit</button><button className="secondary-button destination-delete" onClick={deleteDestination} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button></> : null}</div>
      <div className="destination-details-grid"><div className="destination-description-panel"><h3>About {destination.name}</h3><p>{destination.description || 'No description has been added for this destination yet.'}</p></div><div className="destination-facts"><div><span>Category</span><strong>{prettyCategory(destination.category)}</strong></div><div><span>Best time to visit</span><strong>{destination.bestTimeToVisit || 'Not specified'}</strong></div><div><span>Weather</span><strong>{destination.weatherInfo || 'Not specified'}</strong></div><div><span>Country</span><strong>{destination.country}</strong></div>{destination.state ? <div><span>State / region</span><strong>{destination.state}</strong></div> : null}</div></div>
    </>}
  </section></main></div></div>
  {editing ? <div className="modal-overlay destination-modal"><div className="destination-modal-card"><div className="destination-modal-heading"><h3>Edit destination</h3><button className="destination-close" onClick={() => setEditing(false)} aria-label="Close">×</button></div><Suspense fallback={<p>Loading form…</p>}><DestinationForm destination={destination} onSubmit={updateDestination} onCancel={() => setEditing(false)} submitting={submitting} /></Suspense></div></div> : null}
  {toast ? <div className="destination-toast" role="status">{toast}</div> : null}
  </div>
}

export default DestinationDetailsPage
