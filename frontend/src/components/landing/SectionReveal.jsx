import { useEffect, useRef, useState } from 'react'

function SectionReveal({ children, className = '', direction = 'up' }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`reveal ${direction} ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  )
}

export default SectionReveal
