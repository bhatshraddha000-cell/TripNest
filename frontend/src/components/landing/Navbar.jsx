import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Destinations', href: '#destinations' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`landing-navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <Link to="/" className="brand-markup">
        <div className="brand-icon">✈</div>
        <span>TripNest</span>
      </Link>

      <nav className="landing-nav-links" aria-label="Primary navigation">
        {links.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <div className="landing-nav-actions">
        <Link className="text-link" to="/login">
          Login
        </Link>
        <Link className="primary-button landing-cta" to="/login">
          Get Started
        </Link>
      </div>
    </header>
  )
}

export default Navbar
