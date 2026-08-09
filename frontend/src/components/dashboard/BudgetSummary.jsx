function formatMoney(value) {
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return '₹0'
  return `₹${Math.round(num).toLocaleString('en-IN')}`
}

function BudgetSummary({ totalBudget = 0, spent = 0, remaining = 0, progress = 0 }) {
  const numericProgress = typeof progress === 'number' && !isNaN(progress) && isFinite(progress) ? progress : 0
  const clampedWidth = Math.min(100, Math.max(0, numericProgress))
  const displayProgress = Math.round(numericProgress)

  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Finance</p>
          <h2>Budget Summary</h2>
        </div>
      </div>

      <div className="budget-summary">
        <div>
          <p>Total Budget</p>
          <strong>{formatMoney(totalBudget)}</strong>
        </div>
        <div>
          <p>Spent</p>
          <strong>{formatMoney(spent)}</strong>
        </div>
        <div>
          <p>Remaining</p>
          <strong>{formatMoney(remaining)}</strong>
        </div>
      </div>

      <div className="progress-track" aria-label="Budget progress">
        <div className="progress-fill" style={{ width: `${clampedWidth}%` }} />
      </div>
      <p className="progress-text">{displayProgress}% of your budget is already planned</p>
    </section>
  )
}

export default BudgetSummary
