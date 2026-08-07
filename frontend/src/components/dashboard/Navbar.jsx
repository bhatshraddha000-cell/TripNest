import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext.jsx'
import { notificationApi } from '../../lib/notificationApi.js'
import { collaborationApi } from '../../lib/collaborationApi.js'

function Navbar({ userName, userEmail, onLogout }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [invitations, setInvitations] = useState([])
  const dropdownRef = useRef(null)

  const initials = (userName || 'Traveler')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Fetch data
  const fetchData = async () => {
    try {
      const notifs = await notificationApi.getNotifications()
      const invs = await collaborationApi.getPendingInvitations()
      setNotifications(notifs)
      setInvitations(invs)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    fetchData()
    // Poll notifications every 10 seconds for collaborative updates
    const timer = setInterval(fetchData, 10000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length + invitations.length

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

    notifications.forEach(n => {
      const d = new Date(n.createdAt)
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

      <label className="search-box" htmlFor="dashboard-search">
        <span>🔎</span>
        <input id="dashboard-search" type="text" placeholder="Search trips or places" />
      </label>

      <div className="navbar-actions">
        <button
          className="secondary-button home-button"
          type="button"
          onClick={() => navigate('/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>🏠</span>
          <span>Home</span>
        </button>

        <button className="icon-button" type="button" aria-label="Toggle theme" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Notifications Bell Button and Dropdown wrapper */}
        <div className="notifications-wrapper" ref={dropdownRef}>
          <button
            className="icon-button"
            type="button"
            aria-label="Notifications"
            onClick={() => setIsOpen(!isOpen)}
          >
            🔔
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </button>

          {isOpen && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>
                {notifications.some(n => !n.isRead) && (
                  <button onClick={handleMarkAllAsRead}>Mark all as read</button>
                )}
              </div>

              {invitations.length > 0 && (
                <div className="notifications-list">
                  <div className="notifications-section-title">Invitations</div>
                  {invitations.map((inv) => (
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

              {notifications.length === 0 && invitations.length === 0 ? (
                <div className="notifications-empty">No new notifications</div>
              ) : (
                <div className="notifications-list">
                  {Object.keys(grouped).map((groupName) => {
                    const items = grouped[groupName]
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
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <div className="avatar-badge">{initials}</div>
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
