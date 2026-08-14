import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tripApi } from '../../lib/tripApi.js'
import { collaborationApi } from '../../lib/collaborationApi.js'

function QuickActions() {
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState(null) // 'join' | 'expense' | 'itinerary'
  const [userTrips, setUserTrips] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  const handleActionClick = async (actionType) => {
    setModalError('')

    if (actionType === 'create') {
      navigate('/trips/new')
      return
    }

    if (actionType === 'join') {
      try {
        setLoading(true)
        setActiveModal('join')
        const invs = await collaborationApi.getPendingInvitations()
        setInvitations(invs || [])
      } catch (err) {
        setModalError('Failed to load trip invitations.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (actionType === 'expense' || actionType === 'itinerary') {
      try {
        setLoading(true)
        const trips = await tripApi.getAllTrips()
        const tripList = Array.isArray(trips) ? trips : []
        setUserTrips(tripList)

        if (tripList.length === 1) {
          const tripId = tripList[0].id
          if (actionType === 'expense') {
            navigate(`/trips/${tripId}?tab=expenses`)
          } else {
            navigate(`/itinerary/${tripId}`)
          }
          return
        }

        setActiveModal(actionType)
      } catch (err) {
        setModalError('Failed to load your trips.')
        setActiveModal(actionType)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleAcceptInvite = async (invId, tripId) => {
    try {
      setLoading(true)
      await collaborationApi.acceptInvitation(invId)
      setActiveModal(null)
      navigate(`/trips/${tripId}`)
    } catch (err) {
      setModalError(err?.response?.data?.message ?? 'Failed to accept invitation.')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectInvite = async (invId) => {
    try {
      setLoading(true)
      await collaborationApi.rejectInvitation(invId)
      setInvitations((prev) => prev.filter((i) => i.id !== invId))
    } catch (err) {
      setModalError(err?.response?.data?.message ?? 'Failed to reject invitation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Actions</p>
          <h2>Quick Actions</h2>
        </div>
      </div>

      <div className="actions-grid">
        <button
          className="action-button"
          type="button"
          onClick={() => handleActionClick('create')}
        >
          <span>✦</span>
          Create Trip
        </button>

        <button
          className="action-button"
          type="button"
          onClick={() => handleActionClick('join')}
        >
          <span>➕</span>
          Join Trip
        </button>

        <button
          className="action-button"
          type="button"
          onClick={() => handleActionClick('expense')}
        >
          <span>💳</span>
          Add Expense
        </button>

        <button
          className="action-button"
          type="button"
          onClick={() => handleActionClick('itinerary')}
        >
          <span>🗺</span>
          Plan Itinerary
        </button>
      </div>

      {/* Action Modals */}
      {activeModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              color: 'var(--text, #1c1917)',
              padding: '28px',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '480px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow, 0 20px 40px rgba(0,0,0,0.2))',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--heading, var(--text))', fontWeight: 700 }}>
                {activeModal === 'join' && '✉️ Join Trip & Invitations'}
                {activeModal === 'expense' && '💳 Select Trip to Add Expense'}
                {activeModal === 'itinerary' && '🗺️ Select Trip for Itinerary'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--paragraph, var(--text))', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="status-message error" style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px' }}>
                {modalError}
              </div>
            )}

            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--paragraph)', padding: '20px 0' }}>Loading...</p>
            ) : (
              <>
                {/* Join Trip Modal Content */}
                {activeModal === 'join' && (
                  <div>
                    {invitations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>📫</span>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: 'var(--text)' }}>No Pending Invitations</h4>
                        <p style={{ color: 'var(--paragraph)', fontSize: '0.88rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                          You don't have any pending trip invitations. Ask a Group Admin to invite you using your registered email address!
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <Link to="/trips" className="primary-button" onClick={() => setActiveModal(null)} style={{ textDecoration: 'none', fontSize: '0.88rem' }}>
                            View My Trips
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ color: 'var(--paragraph)', fontSize: '0.88rem', margin: '0 0 8px 0' }}>
                          You have been invited to join the following trip{invitations.length > 1 ? 's' : ''}:
                        </p>
                        {invitations.map((inv) => (
                          <div
                            key={inv.id}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '12px',
                              background: 'var(--surface-strong, #f4efe4)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text)' }}>{inv.tripTitle}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--paragraph)' }}>Invited by {inv.senderName}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="primary-button"
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                onClick={() => handleAcceptInvite(inv.id, inv.tripId)}
                              >
                                Accept
                              </button>
                              <button
                                className="secondary-button"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                                onClick={() => handleRejectInvite(inv.id)}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Add Expense / Plan Itinerary Modal Content */}
                {(activeModal === 'expense' || activeModal === 'itinerary') && (
                  <div>
                    {userTrips.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>✈️</span>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: 'var(--text)' }}>No Active Trips Found</h4>
                        <p style={{ color: 'var(--paragraph)', fontSize: '0.88rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                          {activeModal === 'expense'
                            ? 'Create a trip first to start tracking and splitting trip expenses!'
                            : 'Create a trip first to start planning your day-by-day itinerary!'}
                        </p>
                        <button
                          className="primary-button"
                          onClick={() => {
                            setActiveModal(null)
                            navigate('/trips/new')
                          }}
                        >
                          Plan New Trip
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ color: 'var(--paragraph)', fontSize: '0.88rem', margin: '0 0 8px 0' }}>
                          Choose a trip to proceed:
                        </p>
                        {userTrips.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setActiveModal(null)
                              if (activeModal === 'expense') {
                                navigate(`/trips/${t.id}?tab=expenses`)
                              } else {
                                navigate(`/itinerary/${t.id}`)
                              }
                            }}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '14px',
                              background: 'var(--surface-strong, #f4efe4)',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--accent, #cd7b2f)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border)'
                            }}
                          >
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text)' }}>{t.title}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--paragraph)' }}>📍 {t.destination}</span>
                            </div>
                            <span style={{ color: 'var(--accent, #cd7b2f)', fontWeight: 'bold', fontSize: '0.9rem' }}>Select ➔</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default QuickActions
