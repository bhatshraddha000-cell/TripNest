const features = [
  { title: 'Collaborative Trip Planning', description: 'Build shared plans, notes, and ideas in one beautiful workspace.', icon: '🤝' },
  { title: 'Smart Budget Tracking', description: 'Monitor costs, splitting, and spending habits without spreadsheets.', icon: '📊' },
  { title: 'Shared Expense Management', description: 'Stay fair and transparent with simple expense sharing.', icon: '💳' },
  { title: 'AI Travel Recommendations', description: 'Receive destination and activity suggestions tailored to your group.', icon: '✨' },
  { title: 'Group Itinerary Builder', description: 'Coordinate activities, tickets, and plans in a single timeline.', icon: '🗺' },
  { title: 'Real-Time Collaboration', description: 'Invite friends, sync updates, and stay on the same page.', icon: '⚡' },
]

function FeaturesSection() {
  return (
    <section className="content-section" id="features">
      <div className="section-heading">
        <p className="eyebrow">Why choose TripNest</p>
        <h2>Everything your group needs to plan a seamless trip.</h2>
      </div>

      <div className="features-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default FeaturesSection
