function WelcomeCard({ name, date, quote }) {
  return (
    <section className="section-card welcome-card">
      <div>
        <p className="eyebrow">Travel dashboard</p>
        <h1>Welcome back, {name}!</h1>
        <p className="welcome-copy">{date}</p>
        <blockquote>“{quote}”</blockquote>
      </div>
      <div className="welcome-illustration" aria-hidden="true">
        <span className="welcome-globe">🌍</span>
      </div>
    </section>
  )
}

export default WelcomeCard
