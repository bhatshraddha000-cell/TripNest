const actions = [
  { label: 'Create Trip', icon: '✦' },
  { label: 'Join Trip', icon: '➕' },
  { label: 'Add Expense', icon: '💳' },
  { label: 'Plan Itinerary', icon: '🗺' },
]

function QuickActions() {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Actions</p>
          <h2>Quick Actions</h2>
        </div>
      </div>

      <div className="actions-grid">
        {actions.map((action) => (
          <button className="action-button" key={action.label} type="button">
            <span>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </section>
  )
}

export default QuickActions
