import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-brand">
        <div className="brand-icon">✈</div>
        <div>
          <strong>TripNest</strong>
          <p>Plan together. Travel better.</p>
        </div>
      </div>

      <div className="footer-links">
        <h4>Quick Links</h4>
        <Link to="/">Home</Link>
        <Link to="/#features">Features</Link>
        <Link to="/#destinations">Destinations</Link>
      </div>

      <div className="footer-links">
        <h4>Support</h4>
        <Link to="/contact">Contact</Link>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms">Terms</Link>
      </div>

      <div className="footer-links">
        <h4>Follow</h4>
        <div className="social-links">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer">X</a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
