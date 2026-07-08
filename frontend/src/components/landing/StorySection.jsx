import { useEffect, useRef, useState } from 'react'

const quote =
  'TripNest is where journeys begin — where every destination becomes a story, every budget finds its balance, and every traveler finds their path. However you explore, we help you plan the trip that\'s uniquely yours.'

function StorySection() {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const [showPlane, setShowPlane] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !shouldAnimate) {
          setShouldAnimate(true)
        }
      },
      { threshold: 0.35 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [shouldAnimate])

  useEffect(() => {
    if (!shouldAnimate) return undefined

    setIsTyping(true)
    setShowRoute(false)
    setShowPlane(false)
    let index = 0

    const interval = window.setInterval(() => {
      setDisplayedText(quote.slice(0, index))
      index += 1

      if (index > quote.length) {
        window.clearInterval(interval)
        setIsTyping(false)
        window.setTimeout(() => {
          setShowRoute(true)
          window.setTimeout(() => setShowPlane(true), 650)
        }, 180)
      }
    }, 24)

    return () => window.clearInterval(interval)
  }, [shouldAnimate])

  return (
    <section className="content-section story-section" ref={sectionRef}>
      <div className="section-heading story-heading">
        <p className="eyebrow">A new beginning</p>
        <h2>Every Journey Begins With a Story</h2>
      </div>

      <div className="story-quote-shell">
        <p className="story-quote" aria-live="polite">
          {displayedText}
          {isTyping ? <span className="story-cursor" aria-hidden="true">|</span> : null}
        </p>
      </div>

      <div className={`story-route ${showRoute ? 'is-visible' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 640 140" role="presentation">
          <path d="M20 90C70 40, 160 30, 240 62C320 94, 380 106, 460 78C520 58, 590 34, 620 24" />
        </svg>
        <span className={`story-plane ${showPlane ? 'is-visible' : ''}`}>✈</span>
      </div>
    </section>
  )
}

export default StorySection
