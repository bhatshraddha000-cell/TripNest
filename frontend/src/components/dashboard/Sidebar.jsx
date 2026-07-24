import { Link, useLocation } from 'react-router-dom'

const menuItems = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'My Trips', path: '/trips' },
  { label: 'Itinerary', path: '/itinerary' },
  { label: 'Activity Scheduling', path: '/activity-scheduler' },
  { label: 'Destinations', path: '/destinations' },
  { label: 'Bookings', path: '/bookings' },
  { label: 'Profile', path: '/profile' },
  { label: 'Settings', path: '/settings' },
]

function Sidebar() {
  const location = useLocation()

  return (
    <aside className="sidebar-card">
      <div className="sidebar-title">Planner</div>
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {menuItems.map((item) => {
          const isExactMatch = item.path === '/'
            ? location.pathname === item.path
            : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)

          return (
            <Link
              key={item.label}
              className={`sidebar-link ${isExactMatch ? 'active' : ''}`}
              to={item.path}
            >
              <span>{item.label}</span>
              {isExactMatch ? <strong>●</strong> : null}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
