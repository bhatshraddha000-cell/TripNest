function RecentActivities({ activities }) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Updates</p>
          <h2>Recent Activities</h2>
        </div>
      </div>

      <div className="timeline-list">
        {activities.map((activity) => (
          <div className="timeline-item" key={activity.id}>
            <div className="timeline-dot" />
            <div>
              <strong>{activity.title}</strong>
              <p>{activity.description}</p>
              <span>{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default RecentActivities
