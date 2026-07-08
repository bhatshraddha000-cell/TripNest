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
        <a href="#home">Home</a>
        <a href="#features">Features</a>
        <a href="#destinations">Destinations</a>
      </div>

      <div className="footer-links">
        <h4>Support</h4>
        <a href="#contact">Contact</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms</a>
      </div>

      <div className="footer-links">
        <h4>Follow</h4>
        <div className="social-links">
          <a href="#">Instagram</a>
          <a href="#">X</a>
          <a href="#">LinkedIn</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
