function RecentActivities({ activities = [] }) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Updates</p>
          <h2>Recent Activities</h2>
        </div>
      </div>

      <div className="timeline-list">
        {(!activities || activities.length === 0) ? (
          <p style={{ color: '#64748b', fontSize: '0.95rem', padding: '16px 0', margin: 0 }}>
            No recent activities
          </p>
        ) : (
          activities.map((activity) => (
            <div className="timeline-item" key={activity.id || `${activity.title}-${activity.time}`}>
              <div className="timeline-dot" />
              <div>
                <strong>{activity.title}</strong>
                {activity.description && <p>{activity.description}</p>}
                {activity.time && <span>{activity.time}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default RecentActivities
