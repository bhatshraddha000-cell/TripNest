import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="app-shell not-found-layout">
      <div className="page-center">
        <section className="not-found-card">
          <h1>404</h1>
          <p>The page you requested is not available in this TripNest milestone yet.</p>
          <Link className="primary-button" to="/login">
            Go to login
          </Link>
        </section>
      </div>
    </div>
  )
}

export default NotFoundPage
