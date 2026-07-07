const testimonials = [
  {
    name: 'Maya',
    role: 'Weekend Explorer',
    quote: 'TripNest made planning our group getaway feel effortless and exciting.',
  },
  {
    name: 'Daniel',
    role: 'Adventure Planner',
    quote: 'Shared budgets and itineraries kept everyone aligned from day one.',
  },
  {
    name: 'Sofia',
    role: 'Family Traveler',
    quote: 'It helped us organize every detail without losing the fun of traveling.',
  },
]

function Testimonials() {
  return (
    <section className="content-section">
      <div className="section-heading">
        <p className="eyebrow">Loved by travelers</p>
        <h2>What travelers say about TripNest.</h2>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((testimonial) => (
          <article className="testimonial-card" key={testimonial.name}>
            <p>“{testimonial.quote}”</p>
            <div>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.role}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Testimonials
