import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { getProfileImageUrl } from '../../lib/api.js'
import { collaborationApi } from '../../lib/collaborationApi.js'
import { notificationApi } from '../../lib/notificationApi.js'
import { tripApi } from '../../lib/tripApi.js'

function Navbar({ userName, userEmail, onLogout, profileImage }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const profileUrl = getProfileImageUrl(profileImage || user?.profileImage)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [invitations, setInvitations] = useState([])
  const dropdownRef = useRef(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef(null)

  // Safe arrays
  const notifList = Array.isArray(notifications) ? notifications : []
  const invList = Array.isArray(invitations) ? invitations : []
  const searchList = Array.isArray(searchResults) ? searchResults : []

  const initials = (userName || 'Traveler')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Debounced trip search
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      setSearchError('')
      return
    }

    setIsSearching(true)
    setSearchError('')

    const timer = setTimeout(async () => {
      try {
        const results = await tripApi.searchTrips(searchQuery)
        setSearchResults(Array.isArray(results) ? results : [])
        setShowSearchDropdown(true)
      } catch (err) {
        console.error('Error searching trips:', err)
        setSearchResults([])
        setSearchError('Unable to search your trips.')
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch notifications
  const fetchData = async () => {
    try {
      const notifs = await notificationApi.getNotifications()
      const invs = await collaborationApi.getPendingInvitations()
      setNotifications(Array.isArray(notifs) ? notifs : [])
      setInvitations(Array.isArray(invs) ? invs : [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
      setInvitations([])
    }
  }

  useEffect(() => {
    fetchData()
    // Poll notifications every 10 seconds for collaborative updates
    const timer = setInterval(fetchData, 10000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifList.filter((n) => n && !n.isRead).length + invList.length

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAcceptInvite = async (e, invId, tripId) => {
    e.stopPropagation()
    try {
      await collaborationApi.acceptInvitation(invId)
      fetchData()
      navigate(`/trips/${tripId}`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRejectInvite = async (e, invId) => {
    e.stopPropagation()
    try {
      await collaborationApi.rejectInvitation(invId)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  // Group notifications by Today, Yesterday, Older
  const groupNotifications = () => {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    const groups = {
      Today: [],
      Yesterday: [],
      Older: []
    }

    notifList.forEach((n) => {
      if (!n || !n.createdAt) return
      const d = new Date(n.createdAt)
      if (isNaN(d.getTime())) return
      if (d.toDateString() === today.toDateString()) {
        groups.Today.push(n)
      } else if (d.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(n)
      } else {
        groups.Older.push(n)
      }
    })

    return groups
  }

  const grouped = groupNotifications()

  const getIcon = (type) => {
    switch (type) {
      case 'TRIP_INVITATION': return '✉'
      case 'INVITATION_REJECTED': return '❌'
      case 'MEMBER_JOINED': return '👥'
      case 'MEMBER_REMOVED': return '🚫'
      case 'EXPENSE_ADDED': return '💰'
      case 'DOCUMENT_UPLOADED': return '📄'
      case 'TRIP_UPDATED': return '✏'
      default: return '🔔'
    }
  }

  return (
    <header className="dashboard-navbar">
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="brand-mark">✈</div>
        <div>
          <strong>TripNest</strong>
          <span>Travel planning made simple</span>
        </div>
      </Link>

      <div style={{ position: 'relative', flex: 1, minWidth: '220px' }} ref={searchRef}>
        <label className="search-box" htmlFor="dashboard-search" style={{ width: '100%' }}>
          <span>🔎</span>
          <input
            id="dashboard-search"
            type="text"
            placeholder="Search trips or places"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.trim()) setShowSearchDropdown(true) }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowSearchDropdown(false)
            }}
          />
        </label>

        {showSearchDropdown && searchQuery.trim() && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'var(--surface, #ffffff)',
              color: 'var(--text, #1c1917)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow, 0 10px 30px rgba(0,0,0,0.15))',
              zIndex: 2000,
              maxHeight: '360px',
              overflowY: 'auto',
              padding: '8px 0'
            }}
          >
            <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--paragraph)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
              Trips
            </div>
            {isSearching ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--paragraph)' }}>
                Searching...
              </div>
            ) : searchError ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.88rem', color: '#ef4444' }}>
                {searchError}
              </div>
            ) : searchList.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--paragraph)' }}>
                No trips found.
              </div>
            ) : (
              searchList.map((trip) => {
                if (!trip) return null
                const title = trip.title || trip.destination || 'Trip'
                const dest = trip.destination ? `📍 ${trip.destination}` : ''
                const startDateStr = trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
                const endDateStr = trip.endDate ? new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
                const dateRangeStr = startDateStr && endDateStr ? `${startDateStr} - ${endDateStr}` : startDateStr

                return (
                  <div
                    key={trip.id || title}
                    onClick={() => {
                      setShowSearchDropdown(false)
                      setSearchQuery('')
                      if (trip.id) navigate(`/trips/${trip.id}`)
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-strong, rgba(0,0,0,0.04))'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--text)' }}>
                      {title}
                    </strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--paragraph)' }}>{dest}</span>
                      {dateRangeStr && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--paragraph)', opacity: 0.8 }}>
                          {dateRangeStr}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      <div className="navbar-actions">
        <button
          className="secondary-button home-button"
          type="button"
          onClick={() => navigate('/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button 
          className={`theme-toggle-switch ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle theme"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="toggle-icon-svg sun-svg">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="toggle-icon-svg moon-svg">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
          <div className="toggle-slider"></div>
        </button>

        {/* Notifications Bell Button and Dropdown wrapper */}
        <div className="notifications-wrapper" ref={dropdownRef}>
          <button
            className="icon-button"
            type="button"
            aria-label="Notifications"
            onClick={() => setIsOpen(!isOpen)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </button>

          {isOpen && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>
                {notifList.some((n) => n && !n.isRead) && (
                  <button onClick={handleMarkAllAsRead}>Mark all as read</button>
                )}
              </div>

              {invList.length > 0 && (
                <div className="notifications-list">
                  <div className="notifications-section-title">Invitations</div>
                  {invList.map((inv) => (
                    <div key={inv.id} className="notification-dropdown-item unread">
                      <div className="notification-icon-wrapper">✉</div>
                      <div className="notification-content">
                        <p className="notification-item-msg">
                          <strong>{inv.senderName}</strong> invited you to join <strong>{inv.tripTitle}</strong>
                        </p>
                        <div className="invitation-actions">
                          <button
                            className="inv-btn accept"
                            onClick={(e) => handleAcceptInvite(e, inv.id, inv.tripId)}
                          >
                            Accept
                          </button>
                          <button
                            className="inv-btn reject"
                            onClick={(e) => handleRejectInvite(e, inv.id)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {notifList.length === 0 && invList.length === 0 ? (
                <div className="notifications-empty">No new notifications</div>
              ) : (
                <div className="notifications-list">
                  {Object.keys(grouped).map((groupName) => {
                    const items = grouped[groupName] || []
                    if (items.length === 0) return null

                    return (
                      <div key={groupName}>
                        <div className="notifications-section-title">{groupName}</div>
                        {items.map((n) => (
                          <div
                            key={n.id}
                            className={`notification-dropdown-item ${!n.isRead ? 'unread' : ''}`}
                            onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                          >
                            <div className="notification-icon-wrapper">{getIcon(n.type)}</div>
                            <div className="notification-content">
                              <p className="notification-item-title">{n.title}</p>
                              <p className="notification-item-msg">{n.message}</p>
                              <span className="notification-item-time">
                                {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="profile-chip">
          <div className="avatar-badge" style={{ overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
            {profileUrl ? (
              <img src={profileUrl} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              initials
            )}
          </div>
          <div>
            <strong>{userName}</strong>
            <span>{userEmail}</span>
          </div>
        </div>
        <button className="secondary-button" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}

export default Navbar
