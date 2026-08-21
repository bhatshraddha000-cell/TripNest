import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { expenseApi } from '../lib/expenseApi.js'
import { collaborationApi } from '../lib/collaborationApi.js'

function ExpensesTab({ tripId, tripRole, currentUserId }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [summary, setSummary] = useState(null)
  const [myBalance, setMyBalance] = useState(null)
  const [settlementSummary, setSettlementSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expandedExpenseId, setExpandedExpenseId] = useState(null)
  const [markingPaidId, setMarkingPaidId] = useState(null)

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [deleteExpenseId, setDeleteExpenseId] = useState(null)
  const [deletingExpense, setDeletingExpense] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    paidBy: currentUserId || '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    activityId: '',
    splitType: 'EQUAL'
  })
  
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([])
  const [customSplits, setCustomSplits] = useState({})
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
      const [summData, expList, mems, balanceData, setlData] = await Promise.all([
        expenseApi.getBudgetSummary(tripId),
        expenseApi.getTripExpenses(tripId),
        collaborationApi.getTripMembers(tripId),
        expenseApi.getMyTripBalance(tripId).catch(() => null),
        expenseApi.getSettlementSummary(tripId).catch(() => null)
      ])
      
      setSummary(summData)
      setExpenses(expList)
      setMembers(mems)
      setMyBalance(balanceData)
      setSettlementSummary(setlData)

      // Initialize selected participants if empty
      if (mems.length > 0 && selectedParticipantIds.length === 0) {
        const memberIds = mems.map(m => m.userId)
        setSelectedParticipantIds(memberIds)
        
        // Initialize custom splits map
        const initialCustom = {}
        mems.forEach(m => {
          initialCustom[m.userId] = ''
        })
        setCustomSplits(initialCustom)
      }
    } catch (err) {
      setError('Failed to fetch expenses details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [tripId])

  // Sync paidBy when currentUserId or members load
  useEffect(() => {
    if (!formData.paidBy) {
      if (currentUserId) {
        setFormData(prev => ({ ...prev, paidBy: currentUserId }))
      } else if (members.length > 0) {
        setFormData(prev => ({ ...prev, paidBy: members[0].userId }))
      }
    }
  }, [currentUserId, members])

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
        paidBy: currentUserId || (members.length > 0 ? members[0].userId : ''),
        date: new Date().toISOString().split('T')[0],
        notes: 'Actual expense for scheduled activity.',
        activityId: actId || '',
        splitType: 'EQUAL'
      })
      setShowForm(true)
      
      // Clear query params
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, currentUserId, members])

  // Participant selection toggle
  const toggleParticipant = (userId) => {
    setSelectedParticipantIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAllParticipants = () => {
    const allIds = members.map(m => m.userId)
    setSelectedParticipantIds(allIds)
  }

  const handleDeselectAllParticipants = () => {
    setSelectedParticipantIds([])
  }

  // Custom split input change
  const handleCustomSplitChange = (userId, val) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: val
    }))
  }

  // Financial calculations for Form validation
  const numAmount = parseFloat(formData.amount) || 0
  const customAllocatedSum = Object.entries(customSplits).reduce((sum, [uid, val]) => {
    if (selectedParticipantIds.includes(parseInt(uid))) {
      return sum + (parseFloat(val) || 0)
    }
    return sum
  }, 0)

  const isCustomValid = formData.splitType === 'CUSTOM'
    ? Math.abs(customAllocatedSum - numAmount) < 0.01 && numAmount > 0 && selectedParticipantIds.length > 0
    : true

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.amount || !formData.date) {
      setError('Please fill in all required fields.')
      return
    }

    if (selectedParticipantIds.length === 0) {
      setError('At least one participant must be selected for expense split.')
      return
    }

    if (formData.splitType === 'CUSTOM' && !isCustomValid) {
      setError(`Custom split amounts (₹${customAllocatedSum.toFixed(2)}) must equal the total expense amount (₹${numAmount.toFixed(2)}).`)
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
        activityId: formData.activityId ? parseInt(formData.activityId) : null,
        splitType: formData.splitType,
        participantIds: formData.splitType === 'EQUAL' ? selectedParticipantIds : null,
        customSplits: formData.splitType === 'CUSTOM' 
          ? selectedParticipantIds.map(uid => ({
              userId: uid,
              amount: parseFloat(customSplits[uid]) || 0
            }))
          : null
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
        paidBy: currentUserId || (members.length > 0 ? members[0].userId : ''),
        date: new Date().toISOString().split('T')[0],
        notes: '',
        activityId: '',
        splitType: 'EQUAL'
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
      activityId: exp.activityId ? String(exp.activityId) : '',
      splitType: exp.splitType || 'EQUAL'
    })
    
    if (exp.participants && exp.participants.length > 0) {
      const pIds = exp.participants.map(p => p.userId)
      setSelectedParticipantIds(pIds)

      const cMap = {}
      exp.participants.forEach(p => {
        cMap[p.userId] = String(p.shareAmount)
      })
      setCustomSplits(cMap)
    } else {
      setSelectedParticipantIds(members.map(m => m.userId))
    }

    setEditingExpenseId(exp.id)
    setShowForm(true)
  }

  const handleDelete = (expenseId) => {
    setDeleteExpenseId(expenseId)
  }

  const executeDelete = async () => {
    if (!deleteExpenseId) return
    try {
      setDeletingExpense(true)
      setError('')
      setSuccess('')
      await expenseApi.deleteExpense(deleteExpenseId)
      setSuccess('Expense deleted successfully!')
      setDeleteExpenseId(null)
      fetchData()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to delete expense.')
      setDeleteExpenseId(null)
    } finally {
      setDeletingExpense(false)
    }
  }

  const handleMarkPaid = async (splitId) => {
    try {
      setMarkingPaidId(splitId)
      setError('')
      setSuccess('')
      await expenseApi.markExpenseSplitPaid(splitId)
      setSuccess('Payment marked as settled!')
      fetchData()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to mark payment as paid.')
    } finally {
      setMarkingPaidId(null)
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
      {error && <div className="status-message error" style={{ padding: '12px 16px', borderRadius: '12px', margin: 0 }}>{error}</div>}
      {success && <div className="status-message success" style={{ padding: '12px 16px', borderRadius: '12px', margin: 0, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{success}</div>}

      {/* Overview Summary Cards (6-Box Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* ROW 1: Trip Budget, Actual Expenses, Expected Expense */}
        <div style={cardStyle}>
          <span style={labelStyle}>TRIP BUDGET</span>
          <strong style={{ fontSize: '1.3rem', color: '#cd7b2f' }}>
            ₹{(summary?.budget ?? 0).toLocaleString('en-IN')}
          </strong>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>ACTUAL EXPENSES</span>
          <strong style={{ fontSize: '1.3rem', color: '#3b82f6' }}>
            ₹{(summary?.actualExpenses ?? 0).toLocaleString('en-IN')}
          </strong>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>EXPECTED EXPENSE</span>
          <strong style={{ fontSize: '1.3rem', color: '#8b5cf6' }}>
            ₹{(summary?.expectedExpense ?? summary?.estimatedActivities ?? 0).toLocaleString('en-IN')}
          </strong>
        </div>

        {/* ROW 2: You Owe, You Should Receive, Remaining Budget */}
        <div style={cardStyle}>
          <span style={labelStyle}>YOU OWE</span>
          <strong style={{ fontSize: '1.3rem', color: (myBalance?.youOwe ?? 0) > 0 ? '#ef4444' : 'var(--muted)' }}>
            ₹{(myBalance?.youOwe ?? 0).toLocaleString('en-IN')}
          </strong>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>YOU SHOULD RECEIVE</span>
          <strong style={{ fontSize: '1.3rem', color: (myBalance?.youShouldReceive ?? 0) > 0 ? '#10b981' : 'var(--muted)' }}>
            ₹{(myBalance?.youShouldReceive ?? 0).toLocaleString('en-IN')}
          </strong>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>REMAINING BUDGET</span>
          <strong
            style={{
              fontSize: '1.3rem',
              color: (summary?.remainingBudget ?? 0) < 0 ? '#ef4444' : '#10b981'
            }}
          >
            {(summary?.remainingBudget ?? 0) < 0 ? '-' : ''}₹{Math.abs(summary?.remainingBudget ?? 0).toLocaleString('en-IN')}
          </strong>
        </div>
      </div>

      {/* Add Expense Trigger */}
      {!showForm && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button className="primary-button" onClick={() => setShowForm(true)}>+ Add Expense</button>
        </div>
      )}

      {/* Add / Edit Expense Form */}
      {showForm && (
        <div style={{ padding: '24px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'var(--heading, var(--text))' }}>
            {editingExpenseId ? 'Edit Expense Details' : 'Record New Expense'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Expense Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lunch at Restaurant"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Total Amount (₹) *</label>
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
                <label style={labelStyle}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={inputStyle}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Paid By *</label>
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
                <label style={labelStyle}>Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Notes</label>
                <input
                  type="text"
                  placeholder="Additional remarks..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Split Expense Section */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--heading, var(--text))' }}>Split Expense</h4>
                
                {/* Split Type Selector */}
                <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-strong, var(--surface))', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, splitType: 'EQUAL' })}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: formData.splitType === 'EQUAL' ? '#cd7b2f' : 'transparent',
                      color: formData.splitType === 'EQUAL' ? '#ffffff' : 'var(--muted)'
                    }}
                  >
                    Equal Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, splitType: 'CUSTOM' })}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: formData.splitType === 'CUSTOM' ? '#cd7b2f' : 'transparent',
                      color: formData.splitType === 'CUSTOM' ? '#ffffff' : 'var(--muted)'
                    }}
                  >
                    Custom Split
                  </button>
                </div>
              </div>

              {/* Participant Selection Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Select Participants ({selectedParticipantIds.length} selected):
                </span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAllParticipants}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllParticipants}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* EQUAL SPLIT VIEW */}
              {formData.splitType === 'EQUAL' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {members.map(m => {
                      const isChecked = selectedParticipantIds.includes(m.userId)
                      const equalShare = isChecked && selectedParticipantIds.length > 0 && numAmount > 0
                        ? (numAmount / selectedParticipantIds.length).toFixed(2)
                        : null

                      return (
                        <div
                          key={m.userId}
                          onClick={() => toggleParticipant(m.userId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: `1px solid ${isChecked ? '#cd7b2f' : 'var(--border)'}`,
                            background: isChecked ? 'rgba(205, 123, 47, 0.08)' : 'var(--surface)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent div onClick
                              style={{ accentColor: '#cd7b2f', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{m.fullName}</span>
                          </div>
                          {equalShare && (
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cd7b2f' }}>
                              ₹{equalShare}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {numAmount > 0 && selectedParticipantIds.length > 0 && (
                    <div style={{ padding: '10px 14px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', fontSize: '0.85rem', color: '#3b82f6' }}>
                      ⚡ Equal Split: <strong>₹{(numAmount / selectedParticipantIds.length).toFixed(2)}</strong> per person ({selectedParticipantIds.length} members)
                    </div>
                  )}
                </div>
              )}

              {/* CUSTOM SPLIT VIEW */}
              {formData.splitType === 'CUSTOM' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {members.map(m => {
                      const isSelected = selectedParticipantIds.includes(m.userId)
                      return (
                        <div
                          key={m.userId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: `1px solid ${isSelected ? 'var(--border)' : 'var(--border)'}`,
                            background: isSelected ? 'var(--surface)' : 'transparent',
                            opacity: isSelected ? 1 : 0.6
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleParticipant(m.userId)}
                              style={{ accentColor: '#cd7b2f', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                              {m.fullName}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>₹</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={!isSelected}
                              placeholder="0.00"
                              value={customSplits[m.userId] || ''}
                              onChange={(e) => handleCustomSplitChange(m.userId, e.target.value)}
                              style={{
                                width: '110px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--input-bg, var(--surface))',
                                color: 'var(--text)',
                                fontSize: '0.88rem',
                                outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Allocation Status Indicator */}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isCustomValid
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${isCustomValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      color: isCustomValid ? '#10b981' : '#ef4444'
                    }}
                  >
                    <span>
                      Allocated: ₹{customAllocatedSum.toFixed(2)} / ₹{numAmount.toFixed(2)}
                    </span>
                    <span>
                      {isCustomValid
                        ? '✓ Amounts match total!'
                        : customAllocatedSum < numAmount
                        ? `Remaining: ₹${(numAmount - customAllocatedSum).toFixed(2)}`
                        : `Over-allocated: ₹${(customAllocatedSum - numAmount).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
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
              <button
                type="submit"
                className="primary-button"
                disabled={submitting || (formData.splitType === 'CUSTOM' && !isCustomValid)}
              >
                {submitting ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses & Split Details Table */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--heading, var(--text))' }}>Expenses & Splits</h3>
        {loading ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading transactions...</p>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0 }}>No expenses recorded yet.</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '6px' }}>Add your first trip expense to start tracking shared costs.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {expenses.map(exp => {
              const canModify = exp.paidBy?.userId === currentUserId || tripRole === 'GROUP_ADMIN'
              const isExpanded = expandedExpenseId === exp.id
              const splits = exp.participants || []
              const pendingCount = splits.filter(s => s.paymentStatus === 'PENDING' && s.userId !== exp.paidBy?.userId).length

              return (
                <div
                  key={exp.id}
                  style={{
                    borderRadius: '16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '1.8rem' }}>{getCategoryEmoji(exp.category)}</div>
                      <div>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--text)', display: 'block' }}>{exp.title}</strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
                          {exp.category} &bull; Paid by <strong style={{ color: 'var(--text)' }}>{exp.paidBy?.name || exp.paidBy?.fullName}</strong> &bull; {exp.date}
                        </span>
                        {exp.notes && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic' }}>
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
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--text)', display: 'block' }}>₹{exp.amount.toLocaleString('en-IN')}</strong>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: pendingCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: pendingCount > 0 ? '#ef4444' : '#10b981',
                            fontWeight: 600,
                            display: 'inline-block',
                            marginTop: '2px'
                          }}
                        >
                          {splits.length} participants &bull; {pendingCount > 0 ? `${pendingCount} pending` : 'All Settled ✓'}
                        </span>
                      </div>

                      <button
                        className="secondary-button compact-button"
                        onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        {isExpanded ? 'Hide Details ▲' : 'Split Details ▼'}
                      </button>

                      {canModify && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="secondary-button compact-button"
                            onClick={() => handleEdit(exp)}
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          >
                            Edit
                          </button>
                          <button
                            className="secondary-button compact-button danger-button"
                            onClick={() => handleDelete(exp.id)}
                            style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EXPANDED SPLIT DETAILS */}
                  {isExpanded && (
                    <div style={{ padding: '16px 20px 20px', backgroundColor: 'var(--surface-strong, var(--surface))', borderTop: '1px solid var(--border)' }}>
                      <h5 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Individual Share Breakdown ({exp.splitType || 'EQUAL'})
                      </h5>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                        {splits.map(s => {
                          const isPayer = s.userId === exp.paidBy?.userId
                          const isCurrentMemberDebtor = s.userId === currentUserId
                          const isSettled = s.paymentStatus === 'PAID'

                          return (
                            <div
                              key={s.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)'
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text)', display: 'block' }}>
                                  {s.name} {isPayer ? '(Paid)' : ''}
                                </strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                  Share: ₹{s.shareAmount.toLocaleString('en-IN')}
                                </span>
                              </div>

                              <div>
                                {isPayer ? (
                                  <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>✓ Settled</span>
                                ) : isSettled ? (
                                  <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                                    ✓ Paid {s.paidAt ? `on ${new Date(s.paidAt).toLocaleDateString()}` : ''}
                                  </span>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>Pending</span>
                                    {(isCurrentMemberDebtor || canModify) && (
                                      <button
                                        onClick={() => handleMarkPaid(s.id)}
                                        disabled={markingPaidId === s.id}
                                        style={{
                                          padding: '4px 10px',
                                          borderRadius: '8px',
                                          border: '1px solid #10b981',
                                          background: 'rgba(16, 185, 129, 0.15)',
                                          color: '#10b981',
                                          fontSize: '0.75rem',
                                          fontWeight: 600,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {markingPaidId === s.id ? 'Updating...' : 'Mark as Paid'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* SECTION: SETTLEMENT SUMMARY */}
      {settlementSummary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--heading, var(--text))' }}>Settlement Summary</h3>

          {/* Member Balances Table */}
          <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--muted)' }}>Member Balances</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {settlementSummary.members.map(m => (
                <div
                  key={m.userId}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: m.userId === currentUserId ? 'rgba(205, 123, 47, 0.08)' : 'var(--surface-strong, var(--surface))',
                    border: `1px solid ${m.userId === currentUserId ? '#cd7b2f' : 'var(--border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
                    {m.name} {m.userId === currentUserId ? '(You)' : ''}
                  </strong>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '4px' }}>
                    <span style={{ color: 'var(--muted)' }}>Owes:</span>
                    <span style={{ color: m.youOwe > 0 ? '#ef4444' : 'var(--muted)' }}>₹{m.youOwe.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Should receive:</span>
                    <span style={{ color: m.youShouldReceive > 0 ? '#10b981' : 'var(--muted)' }}>₹{m.youShouldReceive.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text)' }}>Net Balance:</span>
                    <span style={{ color: m.netBalance > 0 ? '#10b981' : m.netBalance < 0 ? '#ef4444' : 'var(--muted)' }}>
                      {m.netBalance >= 0 ? '+' : ''}₹{m.netBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Settlements */}
          <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#ef4444' }}>Pending Settlements</h4>

            {settlementSummary.pendingSettlements.length === 0 ? (
              <p style={{ color: '#10b981', fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>You're all settled! 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {settlementSummary.pendingSettlements.map(ps => {
                  const canSettle = ps.payerId === currentUserId || ps.receiverId === currentUserId || tripRole === 'GROUP_ADMIN'

                  return (
                    <div
                      key={ps.splitId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'var(--surface-strong, var(--surface))',
                        border: '1px solid var(--border)',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1rem' }}>💸</span>
                        <div>
                          <span style={{ fontSize: '0.92rem', color: 'var(--text)' }}>
                            <strong>{ps.payerName}</strong> owes <strong>{ps.receiverName}</strong>
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block' }}>
                            Expense: {ps.expenseTitle} ({ps.date})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#ef4444' }}>₹{ps.amount.toLocaleString('en-IN')}</strong>
                        {canSettle && (
                          <button
                            onClick={() => handleMarkPaid(ps.splitId)}
                            disabled={markingPaidId === ps.splitId}
                            className="primary-button"
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            {markingPaidId === ps.splitId ? 'Processing...' : 'Mark as Paid'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Completed Settlements */}
          {settlementSummary.completedSettlements.length > 0 && (
            <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#10b981' }}>Completed Payments</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {settlementSummary.completedSettlements.map(cs => (
                  <div
                    key={cs.splitId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.06)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ color: 'var(--text)' }}>
                      ✓ <strong>{cs.payerName}</strong> paid <strong>{cs.receiverName}</strong> for {cs.expenseTitle}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#10b981' }}>₹{cs.amount.toLocaleString('en-IN')}</strong>
                      {cs.paidAt && (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)' }}>
                          {new Date(cs.paidAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {deleteExpenseId && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
          <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '20px', maxWidth: '450px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: 'var(--heading, var(--text))' }}>Delete Expense?</h3>
            <p style={{ color: 'var(--paragraph, var(--muted))', fontSize: '0.9rem', lineHeight: '1.5', margin: '12px 0 24px' }}>Are you sure you want to delete this expense record and its associated split calculations? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="secondary-button" onClick={() => setDeleteExpenseId(null)} disabled={deletingExpense}>Cancel</button>
              <button className="primary-button" onClick={executeDelete} disabled={deletingExpense} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                {deletingExpense ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const cardStyle = {
  padding: '20px',
  backgroundColor: 'var(--surface)',
  borderRadius: '16px',
  border: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
}

const labelStyle = {
  fontSize: '0.78rem',
  color: 'var(--muted)',
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
  background: 'var(--input-bg, var(--surface))',
  color: 'var(--text)',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '0.9rem'
}

export default ExpensesTab
