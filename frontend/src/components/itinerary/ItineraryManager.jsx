import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { itineraryApi } from '../../lib/itineraryApi.js'

const overlayStyle = { position: 'fixed', inset: 0, zIndex: 9999, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--bg) 74%, transparent)' }
const modalStyle = { width: '100%', maxWidth: '520px', padding: '30px', borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }
const inputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--input-border)', background: 'var(--input-bg)', borderRadius: '12px', padding: '10px 14px', font: 'inherit', color: 'var(--input-text)' }

function ItineraryManager({ trip }) {
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [expandedDays, setExpandedDays] = useState({})
  const [modal, setModal] = useState({ isOpen: false, mode: 'create', id: null, formData: { dayNumber: 1, date: '', title: '', notes: '' }, fieldErrors: {}, error: '', submitting: false })
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '', submitting: false })

  const loadItineraries = useCallback(async () => {
    const data = await itineraryApi.getAllItineraries(trip.id)
    setItineraries(data)
  }, [trip.id])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')
        await loadItineraries()
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load this trip itinerary.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [loadItineraries])

  const updateField = (key, value) => setModal((current) => ({ ...current, formData: { ...current.formData, [key]: value }, fieldErrors: { ...current.fieldErrors, [key]: '' }, error: '' }))

  const openModal = (mode, day) => {
    if (mode === 'edit') {
      setModal({ isOpen: true, mode, id: day.id, formData: { dayNumber: day.dayNumber, date: day.date, title: day.title, notes: day.notes ?? '' }, fieldErrors: {}, error: '', submitting: false })
      return
    }
    const maxDay = itineraries.length ? Math.max(...itineraries.map((item) => item.dayNumber)) : 0
    const lastDay = [...itineraries].sort((a, b) => new Date(a.date) - new Date(b.date)).at(-1)
    const nextDate = lastDay ? new Date(lastDay.date) : new Date(trip.startDate)
    if (lastDay) nextDate.setDate(nextDate.getDate() + 1)
    const suggestedDate = nextDate > new Date(trip.endDate) ? trip.endDate : nextDate.toISOString().slice(0, 10)
    setModal({ isOpen: true, mode: 'create', id: null, formData: { dayNumber: maxDay + 1, date: suggestedDate, title: '', notes: '' }, fieldErrors: {}, error: '', submitting: false })
  }

  const saveDay = async (event) => {
    event.preventDefault()
    const { dayNumber, date, title, notes } = modal.formData
    const fieldErrors = {}
    if (!dayNumber || Number(dayNumber) < 1) fieldErrors.dayNumber = 'Day number must be at least 1'
    if (!date) fieldErrors.date = 'Date is required'
    if (!title.trim()) fieldErrors.title = 'Title is required'
    if (date && (new Date(date) < new Date(trip.startDate) || new Date(date) > new Date(trip.endDate))) fieldErrors.date = `Date must be between ${trip.startDate} and ${trip.endDate}`
    if (Object.keys(fieldErrors).length) {
      setModal((current) => ({ ...current, fieldErrors }))
      return
    }
    try {
      setModal((current) => ({ ...current, submitting: true, error: '', fieldErrors: {} }))
      const payload = { dayNumber: Number(dayNumber), date, title: title.trim(), notes: notes.trim() || null }
      if (modal.mode === 'create') await itineraryApi.createItinerary(trip.id, payload)
      else await itineraryApi.updateItinerary(trip.id, modal.id, payload)
      await loadItineraries()
      setModal((current) => ({ ...current, isOpen: false, submitting: false }))
      setNotice(modal.mode === 'create' ? 'Itinerary day created successfully.' : 'Itinerary day updated successfully.')
    } catch (err) {
      const response = err?.response?.data
      setModal((current) => ({ ...current, submitting: false, fieldErrors: response?.errors ?? {}, error: response?.errors ? '' : response?.message ?? 'Failed to save itinerary day.' }))
    }
  }

  const deleteDay = async () => {
    try {
      setDeleteModal((current) => ({ ...current, submitting: true }))
      await itineraryApi.deleteItinerary(trip.id, deleteModal.id)
      await loadItineraries()
      setDeleteModal((current) => ({ ...current, isOpen: false, submitting: false }))
      setNotice('Itinerary day deleted successfully.')
    } catch (err) {
      setDeleteModal((current) => ({ ...current, isOpen: false, submitting: false }))
      setError(err?.response?.data?.message ?? 'Failed to delete itinerary day.')
    }
  }

  return <section>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}><div><p className="eyebrow" style={{ marginBottom: '4px' }}>Itinerary</p><h3 style={{ fontSize: '1.4rem', margin: 0 }}>Day-by-Day Itinerary</h3></div><button className="primary-button" onClick={() => openModal('create')} disabled={loading}>Add Day</button></div>
    {notice && <div className="status-message success" style={{ marginBottom: '16px' }} role="status">{notice}</div>}
    {error && <div className="status-message error" style={{ marginBottom: '16px' }} role="alert">{error}</div>}
    {loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--paragraph)' }}>Loading itinerary...</div> : itineraries.length === 0 ? <div className="itinerary-empty-state"><h4>No itinerary has been created for this trip yet.</h4><p>Start planning the day-by-day details of your escape.</p><button className="primary-button" onClick={() => openModal('create')}>Create First Day</button></div> : <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {itineraries.map((day) => <article key={day.id} className="itinerary-day-card">
        <div className="itinerary-day-header" onClick={() => setExpandedDays((current) => ({ ...current, [day.id]: !current[day.id] }))}><div><strong className="itinerary-day-number">Day {day.dayNumber}</strong><strong>{day.title}</strong><span className="itinerary-day-date">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span></div><div className="itinerary-day-actions" onClick={(event) => event.stopPropagation()}><Link to={`/activity-scheduler/${day.id}`} className="secondary-button compact-button" style={{ textDecoration: 'none' }}>Manage Activities</Link><button className="secondary-button compact-button" onClick={() => openModal('edit', day)}>Edit</button><button className="secondary-button compact-button danger-button" onClick={() => setDeleteModal({ isOpen: true, id: day.id, title: `Day ${day.dayNumber}: ${day.title}`, submitting: false })}>Delete</button></div></div>
        {expandedDays[day.id] && <div className="itinerary-day-content">{day.notes && <p className="itinerary-day-notes">{day.notes}</p>}<div className="activities-heading"><div><h4>Activities</h4><span>{day.activities?.length ?? 0} scheduled for this day.</span></div></div></div>}
      </article>)}
    </div>}

    {modal.isOpen && <Modal title={modal.mode === 'create' ? 'Add Itinerary Day' : 'Edit Itinerary Day'}>{modal.error && <div className="status-message error">{modal.error}</div>}<form onSubmit={saveDay} className="itinerary-form"><div className="itinerary-form-grid"><Field label="Day Number" error={modal.fieldErrors.dayNumber}><input type="number" min="1" value={modal.formData.dayNumber} onChange={(event) => updateField('dayNumber', event.target.value)} disabled={modal.submitting} /></Field><Field label="Date" error={modal.fieldErrors.date}><input type="date" value={modal.formData.date} onChange={(event) => updateField('date', event.target.value)} disabled={modal.submitting} /></Field></div><Field label="Day Title" error={modal.fieldErrors.title}><input value={modal.formData.title} onChange={(event) => updateField('title', event.target.value)} disabled={modal.submitting} /></Field><Field label="Notes (Optional)"><textarea rows="3" value={modal.formData.notes} onChange={(event) => updateField('notes', event.target.value)} disabled={modal.submitting} style={inputStyle} /></Field><ModalActions onCancel={() => setModal((current) => ({ ...current, isOpen: false }))} submitting={modal.submitting} saveLabel="Save Day" /></form></Modal>}
    {deleteModal.isOpen && <Modal title="Delete Day Plan?" narrow><p className="modal-description">Are you sure you want to delete “{deleteModal.title}”? This action cannot be undone.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setDeleteModal((current) => ({ ...current, isOpen: false }))} disabled={deleteModal.submitting}>Keep</button><button className="primary-button danger-primary-button" onClick={deleteDay} disabled={deleteModal.submitting}>{deleteModal.submitting ? 'Deleting...' : 'Yes, Delete'}</button></div></Modal>}
  </section>
}

function Modal({ title, children, narrow = false }) { return <div className="modal-overlay" style={overlayStyle}><div style={{ ...modalStyle, maxWidth: narrow ? '450px' : modalStyle.maxWidth }}><h3 style={{ marginTop: 0 }}>{title}</h3>{children}</div></div> }
function Field({ label, error, children }) { return <div className="field-group"><label>{label}</label>{children}{error && <p className="field-error">{error}</p>}</div> }
function ModalActions({ onCancel, submitting, saveLabel }) { return <div className="modal-actions"><button type="button" className="secondary-button" onClick={onCancel} disabled={submitting}>Cancel</button><button className="primary-button" disabled={submitting}>{submitting ? 'Saving...' : saveLabel}</button></div> }

export default ItineraryManager
