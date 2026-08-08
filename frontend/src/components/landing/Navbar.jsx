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

        <button 
          className={`theme-toggle-switch ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle theme"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="toggle-icon-svg sun-svg">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="toggle-icon-svg moon-svg">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
          <div className="toggle-slider"></div>
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
