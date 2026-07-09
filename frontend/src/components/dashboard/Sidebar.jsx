import { Link, useLocation } from 'react-router-dom'

const menuItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'My Trips', path: '/my-trips' },
  { label: 'Itinerary', path: '/itinerary' },
  { label: 'Budget', path: '/budget' },
  { label: 'Expenses', path: '/expenses' },
  { label: 'Groups', path: '/groups' },
  { label: 'Destinations', path: '/destinations' },
  { label: 'Saved Places', path: '/saved' },
  { label: 'Notifications', path: '/notifications' },
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
          const isActive = location.pathname === item.path
          const isDashboardActive = item.path === '/dashboard' && location.pathname === '/dashboard'
          const isProfileActive = item.path === '/profile' && location.pathname === '/profile'
          const isExactMatch = isActive || isDashboardActive || isProfileActive

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
