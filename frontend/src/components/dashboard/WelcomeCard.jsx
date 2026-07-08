function WelcomeCard({ name, date, quote }) {
  return (
    <section className="section-card welcome-card">
      <div>
        <p className="eyebrow">Travel dashboard</p>
        <h1>Welcome back, {name}!</h1>
        <p className="welcome-copy">{date}</p>
        <blockquote>“{quote}”</blockquote>
      </div>
      <div className="welcome-illustration">🌍</div>
    </section>
  )
}

export default WelcomeCard
