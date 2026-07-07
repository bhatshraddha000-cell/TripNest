import { useEffect, useState } from 'react'

const stats = [
  { value: 1000, suffix: '+', label: 'Trips Planned' },
  { value: 5000, suffix: '+', label: 'Travelers' },
  { value: 150, suffix: '+', label: 'Destinations' },
  { value: 98, suffix: '%', label: 'Happy Users' },
]

function AnimatedCounter({ value, suffix }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const duration = 900
    const startTime = performance.now()

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(value * eased)
      setDisplayValue(current)

      if (progress < 1) {
        window.requestAnimationFrame(tick)
      }
    }

    window.requestAnimationFrame(tick)
  }, [value])

  return <strong>{displayValue}{suffix}</strong>
}

function StatsSection() {
  return (
    <section className="stats-section">
      <div className="landing-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-box">
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default StatsSection
