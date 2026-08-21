function Notifications({ items = [] }) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Inbox</p>
          <h2>Notifications</h2>
        </div>
      </div>

      <div className="notification-list">
        {(!items || items.length === 0) ? (
          <p style={{ color: '#64748b', fontSize: '0.95rem', padding: '16px 0', margin: 0 }}>
            No notifications
          </p>
        ) : (
          items.map((item) => (
            <div className="notification-item" key={item.id || `${item.title}-${item.message}`}>
              <div className="notification-icon">{item.icon || '🔔'}</div>
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                {item.time && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.time}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default Notifications
