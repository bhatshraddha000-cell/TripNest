import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const slides = [
  {
    name: 'Bali',
    country: 'Indonesia',
    rating: '4.9',
    description: 'Tropical paradise with beaches, temples, and serene escapes.',
    image:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Switzerland',
    country: 'Europe',
    rating: '4.8',
    description: 'Alpine lakes, scenic trains, and postcard-perfect villages.',
    image:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Paris',
    country: 'France',
    rating: '4.9',
    description: 'Romantic streets, timeless landmarks, and café culture.',
    image:
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Goa',
    country: 'India',
    rating: '4.8',
    description: 'Relaxed beaches, ocean sunsets, and vibrant coastal energy.',
    image:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Maldives',
    country: 'Indian Ocean',
    rating: '5.0',
    description: 'Crystal waters, floating villas, and dreamy island evenings.',
    image:
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1000&q=80',
  },
]

function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [typedText, setTypedText] = useState('')
  const heroVisualRef = useRef(null)

  const currentSlide = useMemo(() => slides[activeSlide], [activeSlide])

  useEffect(() => {
    const text = 'Complex Trips'
    let index = 0

    const interval = window.setInterval(() => {
      setTypedText(text.slice(0, index))
      index += 1

      if (index > text.length) {
        window.clearInterval(interval)
      }
    }, 90)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 4000)

    return () => window.clearInterval(interval)
  }, [])

  function changeSlide(direction) {
    setActiveSlide((current) => (current + direction + slides.length) % slides.length)
  }

  useEffect(() => {
    let frameId = 0

    const handlePointerMove = (event) => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 8
        const y = (event.clientY / window.innerHeight - 0.5) * 8
        const clampedX = Math.max(-10, Math.min(10, x))
        const clampedY = Math.max(-10, Math.min(10, y))

        if (heroVisualRef.current) {
          heroVisualRef.current.style.setProperty('--hero-tilt-x', `${clampedX * 0.25}px`)
          heroVisualRef.current.style.setProperty('--hero-tilt-y', `${clampedY * 0.25}px`)
        }
      })
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [])

  return (
    <section className="hero-section" id="home">
      <div className="hero-ambient" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
      </div>

      <div className="hero-copy">
        <p className="eyebrow">AI-powered travel planning</p>
        <h1>
          Simple Planning for
          <span className="typewriter"> {typedText}</span>
        </h1>
        <p className="hero-text">
          Plan unforgettable journeys with your friends. Manage itineraries, budgets, expenses,
          and memories in one collaborative platform.
        </p>

        <div className="hero-actions">
          <Link className="primary-button hero-button" to="/login">
            Get Started
          </Link>
          <a className="secondary-button hero-button" href="#destinations">
            Explore Destinations
          </a>
        </div>

        <div className="hero-badges">
          <span>✓ Trusted by Travelers</span>
          <span>✓ Secure</span>
          <span>✓ Fast Planning</span>
        </div>

      </div>

      <div className="hero-visual" ref={heroVisualRef}>
        <div className="hero-carousel" key={currentSlide.name}>
          <img src={currentSlide.image} alt={currentSlide.name} />
          <div className="hero-card glass-card">
            <div className="hero-card-top">
              <div>
                <p className="eyebrow">Featured destination</p>
                <h2>{currentSlide.name}</h2>
              </div>
              <span className="rating-pill">★ {currentSlide.rating}</span>
            </div>
            <p>{currentSlide.country}</p>
            <p className="hero-slide-copy">{currentSlide.description}</p>
          </div>

          <button className="carousel-arrow left" type="button" onClick={() => changeSlide(-1)}>
            ‹
          </button>
          <button className="carousel-arrow right" type="button" onClick={() => changeSlide(1)}>
            ›
          </button>
          <div className="carousel-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.name}
                className={`dot ${index === activeSlide ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`Show ${slide.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
