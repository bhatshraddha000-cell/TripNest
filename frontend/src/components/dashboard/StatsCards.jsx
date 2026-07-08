function StatsCards({ stats }) {
  return (
    <section className="stats-grid" aria-label="Trip statistics">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <div className="stat-icon">{stat.icon}</div>
          <div>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
          </div>
        </article>
      ))}
    </section>
  )
}

export default StatsCards
