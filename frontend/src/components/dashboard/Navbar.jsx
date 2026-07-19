import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext.jsx'

function Navbar({ userName, userEmail, onLogout }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const initials = (userName || 'Traveler')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
        <button className="icon-button" type="button" aria-label="Notifications">
          🔔
        </button>
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
