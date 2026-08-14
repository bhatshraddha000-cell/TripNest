import { useEffect, useState } from 'react'
import { collaborationApi } from '../lib/collaborationApi.js'

function MembersTab({ tripId, tripRole, maxCapacity }) {
  const [members, setMembers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isGroupAdmin = tripRole === 'GROUP_ADMIN'
  const isFull = typeof maxCapacity === 'number' && maxCapacity > 0 && members.length >= maxCapacity

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const data = await collaborationApi.getTripMembers(tripId)
      setMembers(data)
    } catch (err) {
      setError('Failed to load group members.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [tripId])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim() || isFull) return
    try {
      setSearchLoading(true)
      setError('')
      const results = await collaborationApi.searchUsers(searchQuery)
      
      // Filter out users who are already members
      const memberEmails = members.map(m => m.email.toLowerCase())
      const filtered = results.filter(r => !memberEmails.includes(r.email.toLowerCase()))
      
      setSearchResults(filtered)
      if (filtered.length === 0) {
        setError('No unregistered or non-member users found matching query.')
      }
    } catch (err) {
      setError('Failed to search users.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleInvite = async (emailOrUsername) => {
    if (isFull) {
      setError(`This trip has reached its maximum capacity of ${maxCapacity} travelers.`)
      return
    }
    try {
      setError('')
      setSuccess('')
      await collaborationApi.inviteMember(tripId, emailOrUsername)
      setSuccess(`Invitation sent successfully to ${emailOrUsername}!`)
      setSearchQuery('')
      setSearchResults([])
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to send invitation.')
    }
  }

  const handleRemove = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from this trip?`)) return
    try {
      setError('')
      setSuccess('')
      await collaborationApi.removeMember(tripId, userId)
      setSuccess(`${userName} was removed from the trip.`)
      fetchMembers()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to remove member.')
    }
  }

  const getInitials = (name) => {
    return (name || 'U')
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Capacity Indicator Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '16px', background: isFull ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)', border: isFull ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>TRIP CAPACITY</span>
          <strong style={{ fontSize: '1.1rem', color: isFull ? '#ef4444' : 'var(--text)' }}>
            {members.length} / {maxCapacity ?? '—'} Travelers {isFull ? '(FULL)' : ''}
          </strong>
        </div>
        {isFull && (
          <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Maximum capacity reached</span>
        )}
      </div>

      {error && <div className="status-message error" style={{ padding: '12px', borderRadius: '8px', margin: 0 }}>{error}</div>}
      {success && <div className="status-message success" style={{ padding: '12px', borderRadius: '8px', margin: 0, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>{success}</div>}

      {/* Invite Member Section (only visible to GROUP_ADMIN) */}
      {isGroupAdmin && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px', opacity: isFull ? 0.75 : 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Invite Travel Companion</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
            {isFull
              ? `This trip has reached its maximum capacity of ${maxCapacity} travelers. Remove a member or increase capacity to invite more companions.`
              : 'Search registered TripNest users by email address or full name.'}
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder={isFull ? `Capacity full (${members.length}/${maxCapacity})` : 'Enter email or name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isFull}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text)',
                outline: 'none'
              }}
            />
            <button className="primary-button" type="submit" disabled={searchLoading || isFull}>
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && !isFull && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map(res => (
                <div
                  key={res.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1f6e8a, #4bbf7b)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {getInitials(res.fullName)}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.9rem', display: 'block' }}>{res.fullName}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{res.email}</span>
                    </div>
                  </div>
                  <button
                    className="secondary-button"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => handleInvite(res.email)}
                    disabled={isFull}
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Member List Section */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Trip Companions</h3>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading members...</p>
        ) : members.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No companions on this trip yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {members.map(member => {
              const isAdmin = member.tripRole === 'GROUP_ADMIN'
              return (
                <div
                  key={member.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'var(--card-bg, rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isAdmin ? 'linear-gradient(135deg, #cd7b2f, #f1a80a)' : 'linear-gradient(135deg, #1f6e8a, #4bbf7b)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.95rem'
                    }}>
                      {getInitials(member.fullName)}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isAdmin ? '👑' : '👤'} {member.fullName}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{member.email}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '2px', color: isAdmin ? '#cd7b2f' : 'var(--text-secondary)' }}>
                        {isAdmin ? 'Group Admin' : 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button (only visible to GROUP_ADMIN, and not for themselves) */}
                  {isGroupAdmin && !isAdmin && (
                    <button
                      onClick={() => handleRemove(member.userId, member.fullName)}
                      style={{
                        background: 'none',
                        border: '0',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        padding: '6px'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MembersTab
