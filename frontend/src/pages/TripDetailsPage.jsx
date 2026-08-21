import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { tripApi } from '../lib/tripApi.js'
import MembersTab from '../components/MembersTab.jsx'
import ExpensesTab from '../components/ExpensesTab.jsx'
import DocumentsTab from '../components/DocumentsTab.jsx'
import ChatTab from '../components/ChatTab.jsx'
import ConfirmationModal from '../components/common/ConfirmationModal.jsx'

function TripDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [searchParams])


  const loadTrip = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      setError('')
      setTrip(await tripApi.getTrip(id))
    } catch (err) {
      setError(err?.response?.status === 404 ? 'The requested trip could not be found or you do not have permission to view it.' : err?.response?.data?.message ?? 'Failed to load trip details.')
    } finally {
      setLoading(false)
    }
  }, [id, isAuthenticated])

  useEffect(() => { loadTrip() }, [loadTrip])

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />

  const statusColor = (status) => ({ PLANNING: '#cd7b2f', UPCOMING: '#2563eb', ONGOING: '#10b981', COMPLETED: '#6b7280', CANCELLED: '#ef4444' }[status] ?? '#6b7280')
  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'
  const formatDates = () => new Date(trip.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' – ' + new Date(trip.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const deleteTrip = async () => {
    try {
      setDeleting(true)
      setDeleteError('')
      await tripApi.deleteTrip(id)
      navigate('/trips')
    } catch (err) {
      setDeleteError(err?.response?.data?.message ?? 'Failed to delete the trip.')
      setShowDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />
        <div className="dashboard-content">
          <Sidebar />
          <main className="dashboard-main">
            <section className="section-card">
              {loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Loading trip details...</div> : error ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}><h3>Unable to load trip</h3><p style={{ color: 'var(--text-secondary)' }}>{error}</p><Link to="/trips" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>Back to My Trips</Link></div>
              ) : <>
                {deleteError && (
                  <div className="status-message error" style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                    {deleteError}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px' }}>
                  <div><p className="eyebrow"><Link to="/trips" style={{ color: 'inherit', textDecoration: 'none' }}>Planner</Link> &rarr; Trip Details</p><h2 style={{ fontSize: '2rem', margin: '4px 0' }}>{trip.title}</h2><p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0 }}>{trip.destination}</p></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <Link to={`/itinerary/${trip.id}`} className="primary-button" style={{ textDecoration: 'none' }}>Manage Itinerary</Link>
                    {trip.tripRole === 'GROUP_ADMIN' && (
                      <>
                        <Link to={`/trips/${trip.id}/edit`} className="secondary-button" style={{ textDecoration: 'none' }}>Edit Details</Link>
                        <button onClick={() => setShowDelete(true)} className="secondary-button" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>Delete Trip</button>
                      </>
                    )}
                  </div>
                </div>

                <div className="trip-tabs">
                  <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                  <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>Expenses</button>
                  <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents</button>
                  <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members</button>
                  <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Chat</button>
                </div>

                {activeTab === 'overview' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                      <div style={cardStyle}><span style={labelStyle}>TRIP STATUS</span><span style={{ color: statusColor(trip.status), fontWeight: 700 }}>{trip.status}</span></div>
                      <div style={cardStyle}><span style={labelStyle}>DATES</span><strong>{formatDates()}</strong></div>
                      <div style={cardStyle}><span style={labelStyle}>TOTAL BUDGET</span><strong style={{ color: '#cd7b2f', fontSize: '1.25rem' }}>₹{trip.budget?.toLocaleString('en-IN') ?? '—'}</strong></div>
                      <div style={cardStyle}><span style={labelStyle}>TRAVELERS</span><strong>{trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}</strong></div>
                    </div>
                    <div><h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Description & Planning Notes</h3>{trip.description ? <div style={{ ...cardStyle, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{trip.description}</div> : <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No description added yet.</p>}</div>
                  </>
                )}

                {activeTab === 'expenses' && (
                  <ExpensesTab tripId={trip.id} tripRole={trip.tripRole} currentUserId={user?.userId} />
                )}

                {activeTab === 'documents' && (
                  <DocumentsTab tripId={trip.id} tripRole={trip.tripRole} currentUserId={user?.userId} />
                )}

                {activeTab === 'members' && (
                  <MembersTab tripId={trip.id} tripRole={trip.tripRole} maxCapacity={trip.travelers} />
                )}

                {activeTab === 'chat' && (
                  <ChatTab
                    tripId={trip.id}
                    currentUserId={user?.id ?? user?.userId}
                    tripTitle={trip.title}
                    destination={trip.destination}
                    memberCount={trip.travelers}
                  />
                )}
              </>}
            </section>
          </main>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showDelete}
        title="Delete Escape Plan?"
        message={`Are you sure you want to delete “${trip?.title}”? All associated itinerary days and activities will be lost.`}
        cancelLabel="Keep Plan"
        confirmLabel="Yes, Delete"
        onConfirm={deleteTrip}
        onCancel={() => setShowDelete(false)}
        submitting={deleting}
        isDanger
      />
    </div>
  )
}


const cardStyle = { padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }
const labelStyle = { fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }

export default TripDetailsPage
