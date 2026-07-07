const menuItems = [
  'Dashboard',
  'My Trips',
  'Itinerary',
  'Budget',
  'Expenses',
  'Groups',
  'Destinations',
  'Saved Places',
  'Notifications',
  'Settings',
]

function Sidebar() {
  return (
    <aside className="sidebar-card">
      <div className="sidebar-title">Planner</div>
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {menuItems.map((item, index) => (
          <button
            key={item}
            className={`sidebar-link ${index === 0 ? 'active' : ''}`}
            type="button"
          >
            <span>{item}</span>
            {index === 0 ? <strong>●</strong> : null}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
