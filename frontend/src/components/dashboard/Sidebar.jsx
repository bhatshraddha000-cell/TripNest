import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()

  const isAdmin = user?.roles?.includes('ADMIN') || user?.role === 'ADMIN'

  const items = isAdmin
    ? [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Admin Dashboard', path: '/admin/dashboard' },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Analytics', path: '/analytics' },
        { label: 'My Trips', path: '/trips' },
        { label: 'Itinerary', path: '/itinerary' },
        { label: 'Activity Scheduling', path: '/activity-scheduler' },
        { label: 'Destinations', path: '/destinations' },
        { label: 'Bookings', path: '/bookings' },
        { label: 'Profile', path: '/profile' },
        { label: 'Settings', path: '/settings' },
      ]

  return (
    <aside className="sidebar-card">
      <div className="sidebar-title">Planner</div>
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {items.map((item) => {
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
