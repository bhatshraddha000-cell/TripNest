function Notifications({ items }) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Inbox</p>
          <h2>Notifications</h2>
        </div>
      </div>

      <div className="notification-list">
        {items.map((item) => (
          <div className="notification-item" key={item.id}>
            <div className="notification-icon">{item.icon}</div>
            <div>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Notifications
