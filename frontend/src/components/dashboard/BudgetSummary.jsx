function BudgetSummary({ totalBudget, spent, remaining, progress }) {
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
          <strong>${totalBudget}</strong>
        </div>
        <div>
          <p>Spent</p>
          <strong>${spent}</strong>
        </div>
        <div>
          <p>Remaining</p>
          <strong>${remaining}</strong>
        </div>
      </div>

      <div className="progress-track" aria-label="Budget progress">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="progress-text">{progress}% of your budget is already planned</p>
    </section>
  )
}

export default BudgetSummary
