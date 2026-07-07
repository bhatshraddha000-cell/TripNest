import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Destinations', href: '#destinations' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

function Navbar({ searchValue, onSearchChange }) {
  const { isAuthenticated, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
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

      <div className="landing-toolbar">
        <label className="search-box navbar-search" htmlFor="navbar-search">
          <span>🔎</span>
          <input
            id="navbar-search"
            type="text"
            placeholder="Search destinations..."
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {isAuthenticated ? (
          <Link className="text-link dashboard-link" to="/dashboard">
            Dashboard
          </Link>
        ) : (
          <Link className="text-link" to="/login">
            Login
          </Link>
        )}

        <Link className="primary-button landing-cta" to="/login">
          {isAuthenticated ? (user?.fullName?.split(' ')[0] ?? 'Profile') : 'Get Started'}
        </Link>
      </div>
    </header>
  )
}

export default Navbar
