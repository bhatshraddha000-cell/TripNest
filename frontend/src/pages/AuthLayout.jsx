import backgroundImage from '../assets/backgroundimage.jpg'

function AuthLayout({ children }) {
  return (
    <div
      className="auth-page-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="auth-page-overlay" />

      <div className="auth-page-content">
        <aside className="auth-hero-section">
          <div className="auth-hero-brand">
            <div className="auth-brand-title">
              <span className="auth-brand-text">TRIPNEST</span>
              <span className="auth-brand-plane">✈️</span>
            </div>
            <div className="auth-brand-underline" />
          </div>

          <div className="auth-hero-copy">
            <h1 className="auth-hero-headline">
              EXPLORE
              <br />
              HORIZONS
            </h1>
            <p className="auth-hero-subheadline">
              Where Your Dream Destinations
              <br />
              Become Reality.
            </p>
            <p className="auth-hero-description">
              Embark on a journey where every corner of the world is within your reach.
            </p>
          </div>
        </aside>

        <main className="auth-card-section">
          <div className="auth-glass-card">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AuthLayout
