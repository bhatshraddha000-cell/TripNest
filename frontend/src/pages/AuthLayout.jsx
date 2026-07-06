import { Link } from 'react-router-dom'

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="app-shell auth-layout">
      <aside className="auth-aside">
        <div className="auth-brand">
          <span className="auth-brand-mark">TN</span>
          <span>TripNest</span>
        </div>

        <div className="auth-copy">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="field-help">
          Planning feels lighter when your people, budgets, and routes stay in one place.
        </div>
      </aside>

      <main className="auth-panel">
        <section className="auth-card">
          <Link className="ghost-link" to="/login">
            Back to login
          </Link>
          {children}
          {footer}
        </section>
      </main>
    </div>
  )
}

export default AuthLayout
