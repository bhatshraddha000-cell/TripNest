import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { destinationService } from '../../lib/destinationService.js'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Destinations', href: '#destinations' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

function Navbar({ searchValue, onSearchChange }) {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)

  // Search dropdown state
  const [searchQuery, setSearchQuery] = useState(searchValue || '')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced destination search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      setSearchError('')
      return
    }

    setIsSearching(true)
    setSearchError('')

    const timer = setTimeout(async () => {
      try {
        const results = await destinationService.searchDestinations(searchQuery)
        setSearchResults(results || [])
        setShowSearchDropdown(true)
      } catch (err) {
        setSearchError('Unable to search destinations.')
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleInputChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    if (onSearchChange) onSearchChange(val)
  }

  const handleResultClick = (dest) => {
    setShowSearchDropdown(false)
    setSearchQuery('')
    if (dest.tripId) {
      navigate(`/destinations/${dest.tripId}`)
    } else {
      navigate(`/explore/${encodeURIComponent(dest.destination || dest.name)}`)
    }
  }

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
        <div style={{ position: 'relative' }} ref={searchRef}>
          <label className="search-box navbar-search" htmlFor="navbar-search">
            <span>🔎</span>
            <input
              id="navbar-search"
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => { if (searchQuery.trim()) setShowSearchDropdown(true) }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowSearchDropdown(false)
              }}
            />
          </label>

          {showSearchDropdown && searchQuery.trim() && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                minWidth: '240px',
                background: 'var(--surface, #ffffff)',
                color: 'var(--text, #1c1917)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow, 0 10px 30px rgba(0,0,0,0.15))',
                zIndex: 2000,
                maxHeight: '360px',
                overflowY: 'auto',
                padding: '8px 0'
              }}
            >
              <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--paragraph)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                Destinations
              </div>
              {isSearching ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--paragraph)' }}>
                  Searching destinations...
                </div>
              ) : searchError ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.88rem', color: '#ef4444' }}>
                  {searchError}
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--paragraph)' }}>
                  No destinations found.
                </div>
              ) : (
                searchResults.map((dest, idx) => (
                  <div
                    key={dest.destination || idx}
                    onClick={() => handleResultClick(dest)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-strong, rgba(0,0,0,0.04))'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1f6e8a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>
                      {(dest.destination || 'D')[0].toUpperCase()}
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--text)' }}>
                        {dest.destination}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--paragraph)' }}>
                        📍 {dest.country || 'Destination Guide'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

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
