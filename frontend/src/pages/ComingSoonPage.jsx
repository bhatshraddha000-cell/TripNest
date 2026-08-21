import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'

function ComingSoonPage({ featureName }) {
  const { user, logout } = useAuth()

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />

        <div className="dashboard-content">
          <Sidebar />

          <main className="dashboard-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <section className="section-card" style={{
              textAlign: 'center',
              maxWidth: '500px',
              padding: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px' }}>✨</span>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>{featureName} is Coming Soon</h2>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                margin: '0 0 24px 0'
              }}>
                We are currently building the <strong>{featureName}</strong> system for future milestones of TripNest.
                <br /><br />
                Currently, you can manage your plans, schedule day-wise itineraries, and schedule activities by selecting <strong>My Trips</strong> from the planner panel.
              </p>
              <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: 'rgba(205, 123, 47, 0.15)', color: '#cd7b2f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Next Milestone Feature
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default ComingSoonPage
