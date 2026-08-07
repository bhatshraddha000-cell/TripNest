import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { expenseApi } from '../lib/expenseApi.js'
import { collaborationApi } from '../lib/collaborationApi.js'

function ExpensesTab({ tripId, tripRole, currentUserId }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [summary, setSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    paidBy: currentUserId,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    activityId: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const categories = [
    'Food',
    'Hotel',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Miscellaneous'
  ]

  const fetchData = async () => {
    try {
      setLoading(true)
      const summData = await expenseApi.getBudgetSummary(tripId)
      const expList = await expenseApi.getTripExpenses(tripId)
      const mems = await collaborationApi.getTripMembers(tripId)
      setSummary(summData)
      setExpenses(expList)
      setMembers(mems)
    } catch (err) {
      setError('Failed to fetch expenses details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [tripId])

  // Auto-fill logic from activity scheduler
  useEffect(() => {
    const actId = searchParams.get('activityId')
    const amt = searchParams.get('amount')
    const tit = searchParams.get('title')

    if (actId || amt || tit) {
      setFormData({
        title: tit ? decodeURIComponent(tit) : '',
        amount: amt || '',
        category: 'Miscellaneous',
        paidBy: currentUserId,
        date: new Date().toISOString().split('T')[0],
        notes: 'Actual expense for scheduled activity.',
        activityId: actId || ''
      })
      setShowForm(true)
      
      // Clear query params so it doesn't prefill again on page navigation
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.amount || !formData.date) {
      setError('Please fill in all required fields.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const payload = {
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        paidById: parseInt(formData.paidBy),
        date: formData.date,
        notes: formData.notes.trim() || null,
        activityId: formData.activityId ? parseInt(formData.activityId) : null
      }

      if (editingExpenseId) {
        await expenseApi.updateExpense(editingExpenseId, payload)
        setSuccess('Expense updated successfully!')
      } else {
        await expenseApi.addExpense(tripId, payload)
        setSuccess('Expense recorded successfully!')
      }

      // Reset form
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        paidBy: currentUserId,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        activityId: ''
      })
      setEditingExpenseId(null)
      setShowForm(false)
      fetchData()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to save expense.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (exp) => {
    setFormData({
      title: exp.title,
      amount: String(exp.amount),
      category: exp.category,
      paidBy: exp.paidBy.userId,
      date: exp.date,
      notes: exp.notes ?? '',
      activityId: exp.activityId ? String(exp.activityId) : ''
    })
    setEditingExpenseId(exp.id)
    setShowForm(true)
  }

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      setError('')
      setSuccess('')
      await expenseApi.deleteExpense(expenseId)
      setSuccess('Expense deleted successfully!')
      fetchData()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to delete expense.')
    }
  }

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'Food': return '🍔'
      case 'Hotel': return '🏨'
      case 'Transportation': return '🚗'
      case 'Shopping': return '🛍️'
      case 'Entertainment': return '🎬'
      default: return '💵'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && <div className="status-message error" style={{ padding: '12px', borderRadius: '8px', margin: 0 }}>{error}</div>}
      {success && <div className="status-message success" style={{ padding: '12px', borderRadius: '8px', margin: 0, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>{success}</div>}

      {/* Budget Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={cardStyle}>
            <span style={labelStyle}>TRIP BUDGET</span>
            <strong style={{ fontSize: '1.3rem', color: '#cd7b2f' }}>₹{summary.budget.toLocaleString('en-IN')}</strong>
          </div>
          <div style={cardStyle}>
            <span style={labelStyle}>ESTIMATED ACTIVITIES</span>
            <strong style={{ fontSize: '1.3rem' }}>₹{summary.estimatedActivities.toLocaleString('en-IN')}</strong>
          </div>
          <div style={cardStyle}>
            <span style={labelStyle}>ACTUAL EXPENSES</span>
            <strong style={{ fontSize: '1.3rem', color: '#ff4d4f' }}>₹{summary.actualExpenses.toLocaleString('en-IN')}</strong>
          </div>
          <div style={cardStyle}>
            <span style={labelStyle}>REMAINING BUDGET</span>
            <strong style={{ fontSize: '1.3rem', color: summary.remainingBudget < 0 ? '#ef4444' : '#10b981' }}>
              ₹{summary.remainingBudget.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      )}

      {/* Add Expense Trigger */}
      {!showForm && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button className="primary-button" onClick={() => setShowForm(true)}>+ Add Expense</button>
        </div>
      )}

      {/* Expense Form */}
      {showForm && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>
            {editingExpenseId ? 'Edit Expense Details' : 'Record New Expense'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={fieldStyle}>
                <label>Expense Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lunch at Shibuya"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label>Amount (INR) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={fieldStyle}>
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={inputStyle}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label>Paid By *</label>
                <select
                  value={formData.paidBy}
                  onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                  style={inputStyle}
                >
                  {members.map(m => (
                    <option key={m.userId} value={m.userId}>
                      {m.fullName} ({m.email})
                    </option>
                  ))}
                  {members.length === 0 && (
                    <option value={currentUserId}>Logged User</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={fieldStyle}>
                <label>Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label>Notes</label>
                <input
                  type="text"
                  placeholder="Additional remarks..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowForm(false)
                  setEditingExpenseId(null)
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Table */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Transaction History</h3>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading transactions...</p>
        ) : expenses.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No expenses recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expenses.map(exp => {
              const canModify = exp.paidBy.userId === currentUserId || tripRole === 'GROUP_ADMIN'
              return (
                <div
                  key={exp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'var(--card-bg, rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '1.6rem' }}>{getCategoryEmoji(exp.category)}</div>
                    <div>
                      <strong style={{ fontSize: '1rem', display: 'block' }}>{exp.title}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                        {exp.category} &bull; Paid by {exp.paidBy.fullName} &bull; {exp.date}
                      </span>
                      {exp.notes && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          {exp.notes}
                        </p>
                      )}
                      {exp.activityTitle && (
                        <span style={{ display: 'inline-block', fontSize: '0.75rem', color: '#cd7b2f', marginTop: '4px' }}>
                          Linked to: {exp.activityTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <strong style={{ fontSize: '1.15rem' }}>₹{exp.amount.toLocaleString('en-IN')}</strong>
                    {canModify && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="secondary-button compact-button"
                          onClick={() => handleEdit(exp)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Edit
                        </button>
                        <button
                          className="secondary-button compact-button danger-button"
                          onClick={() => handleDelete(exp.id)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const cardStyle = {
  padding: '20px',
  backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.02))',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
}

const labelStyle = {
  fontSize: '0.78rem',
  color: 'var(--text-secondary)',
  letterSpacing: '0.05em'
}

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
}

const inputStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--text)',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '0.9rem'
}

export default ExpensesTab
