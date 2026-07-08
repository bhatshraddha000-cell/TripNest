import { Link } from 'react-router-dom'

function CTASection() {
  return (
    <section className="cta-section">
      <div>
        <p className="eyebrow">Start planning</p>
        <h2>Ready for your next adventure?</h2>
        <p>Bring your group together and turn travel ideas into shared plans in minutes.</p>
      </div>

      <div className="cta-actions">
        <Link className="primary-button" to="/login">
          Start Planning
        </Link>
        <Link className="secondary-button" to="/login">
          Login
        </Link>
      </div>
    </section>
  )
}

export default CTASection
