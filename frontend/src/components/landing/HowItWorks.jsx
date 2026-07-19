const steps = [
  { title: 'Create Trip', description: 'Start a trip, set dates, and choose your dream destinations.' },
  { title: 'Invite Friends', description: 'Add your travel companions and keep everyone in sync.' },
  { title: 'Travel Together', description: 'Share plans, budgets, and memories all in one place.' },
]

function HowItWorks() {
  return (
    <section className="content-section">
      <div className="section-heading">
        <p className="eyebrow">How it works</p>
        <h2>From idea to itinerary in three simple steps.</h2>
      </div>

      <div className="steps-grid">
        {steps.map((step, index) => (
          <article className="step-card" key={step.title}>
            <div className="step-number">0{index + 1}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HowItWorks
