function Navbar({ userName, userEmail, onLogout }) {
  const initials = (userName || 'Traveler')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="dashboard-navbar">
      <div className="navbar-brand">
        <div className="brand-mark">✈</div>
        <div>
          <strong>TripNest</strong>
          <span>Travel planning made simple</span>
        </div>
      </div>

      <label className="search-box" htmlFor="dashboard-search">
        <span>🔎</span>
        <input id="dashboard-search" type="text" placeholder="Search trips or places" />
      </label>

      <div className="navbar-actions">
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
