import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function DashboardPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <div className="dashboard-nav">
          <div>
            <strong>TripNest Dashboard</strong>
            <span>Authenticated area protected by your JWT.</span>
          </div>

          <button className="secondary-button" type="button" onClick={logout}>
            Logout
          </button>
        </div>

        <section className="dashboard-hero">
          <h1>Hello, {user?.fullName ?? 'Traveler'}.</h1>
          <p>
            This page is using your current Bearer token to fetch safe profile data from
            <code> /api/users/me </code>
            after login and after browser refresh.
          </p>
        </section>

        <section className="dashboard-card">
          <h2>Your account snapshot</h2>
          <div className="dashboard-grid">
            <div className="info-row">
              <span>User ID</span>
              <strong>{user?.userId ?? '-'}</strong>
            </div>

            <div className="info-row">
              <span>Full name</span>
              <strong>{user?.fullName ?? '-'}</strong>
            </div>

            <div className="info-row">
              <span>Email</span>
              <strong>{user?.email ?? '-'}</strong>
            </div>

            <div className="info-row">
              <span>Roles</span>
              <div className="roles-list">
                {user?.roles?.map((role) => (
                  <span className="role-pill" key={role}>
                    {role}
                  </span>
                )) ?? <strong>-</strong>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardPage
