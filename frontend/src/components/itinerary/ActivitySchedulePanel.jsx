import { useCallback, useEffect, useState } from 'react'
import { activityApi } from '../../lib/activityApi.js'

const activityTypes = [
  ['SIGHTSEEING', 'Sightseeing'],
  ['TRANSPORTATION', 'Transportation'],
  ['ACCOMMODATION', 'Accommodation'],
  ['DINING', 'Dining'],
  ['ADVENTURE', 'Adventure Activities'],
  ['SHOPPING', 'Shopping'],
]

const blankActivity = { title: '', description: '', location: '', startTime: '', endTime: '', activityType: 'SIGHTSEEING', estimatedCost: '0', notes: '' }
const overlayStyle = { position: 'fixed', inset: 0, zIndex: 9999, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--bg) 74%, transparent)' }
const modalStyle = { width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }
const inputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--input-border)', background: 'var(--input-bg)', borderRadius: '12px', padding: '10px 14px', font: 'inherit', color: 'var(--input-text)' }

function ActivitySchedulePanel({ tripId, itineraryId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState({ isOpen: false, mode: 'create', id: null, formData: blankActivity, fieldErrors: {}, error: '', submitting: false })
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '', submitting: false })

  const loadActivities = useCallback(async () => {
    const data = await activityApi.getAllActivities(tripId, itineraryId)
    setActivities(data)
  }, [tripId, itineraryId])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')
        await loadActivities()
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load activities.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [loadActivities])

  const updateField = (key, value) => setModal((current) => ({ ...current, formData: { ...current.formData, [key]: value }, fieldErrors: { ...current.fieldErrors, [key]: '' }, error: '' }))
  const typeLabel = (value) => activityTypes.find(([type]) => type === value)?.[1] ?? value
  const formatTime = (value) => value ? new Date(`2000-01-01T${value}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Flexible time'

  const openModal = (mode, activity) => {
    const formData = mode === 'edit'
      ? { title: activity.title, description: activity.description ?? '', location: activity.location ?? '', startTime: activity.startTime?.slice(0, 5) ?? '', endTime: activity.endTime?.slice(0, 5) ?? '', activityType: activity.activityType, estimatedCost: String(activity.estimatedCost ?? 0), notes: activity.notes ?? '' }
      : { ...blankActivity }
    setModal({ isOpen: true, mode, id: activity?.id ?? null, formData, fieldErrors: {}, error: '', submitting: false })
  }

  const saveActivity = async (event) => {
    event.preventDefault()
    const data = modal.formData
    const fieldErrors = {}
    if (!data.title.trim()) fieldErrors.title = 'Activity title is required'
    if (!data.activityType) fieldErrors.activityType = 'Activity type is required'
    if (!data.location.trim()) fieldErrors.location = 'Location is required'
    if (data.estimatedCost === '' || !Number.isFinite(Number(data.estimatedCost)) || Number(data.estimatedCost) < 0) fieldErrors.estimatedCost = 'Estimated cost must be a non-negative number'
    if (data.startTime && data.endTime && data.endTime < data.startTime) fieldErrors.endTime = 'End time cannot be before start time'
    if (Object.keys(fieldErrors).length) {
      setModal((current) => ({ ...current, fieldErrors }))
      return
    }

    const payload = { title: data.title.trim(), activityType: data.activityType, location: data.location.trim(), description: data.description.trim() || null, startTime: data.startTime ? `${data.startTime}:00` : null, endTime: data.endTime ? `${data.endTime}:00` : null, estimatedCost: Number(data.estimatedCost), notes: data.notes.trim() || null }
    try {
      setModal((current) => ({ ...current, submitting: true, fieldErrors: {}, error: '' }))
      if (modal.mode === 'create') await activityApi.createActivity(tripId, itineraryId, payload)
      else await activityApi.updateActivity(tripId, itineraryId, modal.id, payload)
      await loadActivities()
      setModal((current) => ({ ...current, isOpen: false, submitting: false }))
      setNotice(modal.mode === 'create' ? 'Activity created successfully.' : 'Activity updated successfully.')
    } catch (err) {
      const response = err?.response?.data
      setModal((current) => ({ ...current, submitting: false, fieldErrors: response?.errors ?? {}, error: response?.errors ? '' : response?.message ?? 'Failed to save activity.' }))
    }
  }

  const deleteActivity = async () => {
    try {
      setDeleteModal((current) => ({ ...current, submitting: true }))
      await activityApi.deleteActivity(tripId, itineraryId, deleteModal.id)
      await loadActivities()
      setDeleteModal((current) => ({ ...current, isOpen: false, submitting: false }))
      setNotice('Activity deleted successfully.')
    } catch (err) {
      setDeleteModal((current) => ({ ...current, isOpen: false, submitting: false }))
      setError(err?.response?.data?.message ?? 'Failed to delete activity.')
    }
  }

  const sortedActivities = [...activities].sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'))

  return <section>
    <div className="activities-heading">
      <div><p className="eyebrow" style={{ marginBottom: '4px' }}>Activity Scheduling</p><h3 style={{ margin: 0 }}>Travel timeline</h3><span>Activities are ordered by start time.</span></div>
      <button className="primary-button" onClick={() => openModal('create')} disabled={loading}>+ Add Activity</button>
    </div>
    {notice && <div className="status-message success" style={{ marginBottom: '16px' }} role="status">{notice}</div>}
    {error && <div className="status-message error" style={{ marginBottom: '16px' }} role="alert">{error}</div>}
    {loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--paragraph)' }}>Loading activities...</div> : sortedActivities.length === 0 ? <div className="itinerary-empty-state"><h4>No activities scheduled yet.</h4><p>Add the first activity for this itinerary day.</p><button className="primary-button" onClick={() => openModal('create')}>Add Activity</button></div> : <div className="activity-timeline">
      {sortedActivities.map((activity) => <article className="timeline-item" key={activity.id}>
        <div className="timeline-time">{formatTime(activity.startTime)}</div><div className="timeline-marker" aria-hidden="true" />
        <div className="activity-card-content">
          <div className="activity-card-heading"><div><span className="activity-type">{typeLabel(activity.activityType)}</span><h5>{activity.title}</h5></div><strong className="activity-cost">{activity.estimatedCost > 0 ? `₹${activity.estimatedCost.toLocaleString('en-IN')}` : 'Free'}</strong></div>
          <p className="activity-location">Location: {activity.location}</p>
          {(activity.startTime || activity.endTime) && <p className="activity-meta">{formatTime(activity.startTime)}{activity.endTime ? ` – ${formatTime(activity.endTime)}` : ''}</p>}
          {activity.description && <p className="activity-description">{activity.description}</p>}
          {activity.notes && <p className="activity-notes">Notes: {activity.notes}</p>}
          <div className="activity-actions"><button className="secondary-button compact-button" onClick={() => openModal('edit', activity)}>Edit</button><button className="secondary-button compact-button danger-button" onClick={() => setDeleteModal({ isOpen: true, id: activity.id, title: activity.title, submitting: false })}>Delete</button></div>
        </div>
      </article>)}
    </div>}

    {modal.isOpen && <Modal title={modal.mode === 'create' ? 'Schedule Activity' : 'Edit Activity'}>
      <p className="modal-description">Add the time, place, and cost details to keep this travel day on track.</p>
      {modal.error && <div className="status-message error">{modal.error}</div>}
      <form onSubmit={saveActivity} className="itinerary-form">
        <Field label="Activity Title *" error={modal.fieldErrors.title}><input value={modal.formData.title} onChange={(event) => updateField('title', event.target.value)} disabled={modal.submitting} /></Field>
        <div className="itinerary-form-grid"><Field label="Activity Type *" error={modal.fieldErrors.activityType}><select value={modal.formData.activityType} onChange={(event) => updateField('activityType', event.target.value)} disabled={modal.submitting} style={inputStyle}>{activityTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Estimated Cost" error={modal.fieldErrors.estimatedCost}><input type="number" min="0" step="0.01" value={modal.formData.estimatedCost} onChange={(event) => updateField('estimatedCost', event.target.value)} disabled={modal.submitting} /></Field></div>
        <Field label="Location *" error={modal.fieldErrors.location}><input value={modal.formData.location} onChange={(event) => updateField('location', event.target.value)} disabled={modal.submitting} placeholder="Place, venue, or address" /></Field>
        <div className="itinerary-form-grid"><Field label="Start Time"><input type="time" value={modal.formData.startTime} onChange={(event) => updateField('startTime', event.target.value)} disabled={modal.submitting} /></Field><Field label="End Time" error={modal.fieldErrors.endTime}><input type="time" value={modal.formData.endTime} onChange={(event) => updateField('endTime', event.target.value)} disabled={modal.submitting} /></Field></div>
        <Field label="Description"><textarea rows="2" value={modal.formData.description} onChange={(event) => updateField('description', event.target.value)} disabled={modal.submitting} style={inputStyle} /></Field>
        <Field label="Notes"><textarea rows="2" value={modal.formData.notes} onChange={(event) => updateField('notes', event.target.value)} disabled={modal.submitting} style={inputStyle} /></Field>
        <ModalActions onCancel={() => setModal((current) => ({ ...current, isOpen: false }))} submitting={modal.submitting} saveLabel="Save Activity" />
      </form>
    </Modal>}
    {deleteModal.isOpen && <Modal title="Delete Activity?" narrow><p className="modal-description">Are you sure you want to delete “{deleteModal.title}”? This action cannot be undone.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setDeleteModal((current) => ({ ...current, isOpen: false }))} disabled={deleteModal.submitting}>Keep</button><button className="primary-button danger-primary-button" onClick={deleteActivity} disabled={deleteModal.submitting}>{deleteModal.submitting ? 'Deleting...' : 'Yes, Delete'}</button></div></Modal>}
  </section>
}

function Modal({ title, children, narrow = false }) { return <div className="modal-overlay" style={overlayStyle}><div style={{ ...modalStyle, maxWidth: narrow ? '450px' : modalStyle.maxWidth }}><h3 style={{ marginTop: 0 }}>{title}</h3>{children}</div></div> }
function Field({ label, error, children }) { return <div className="field-group"><label>{label}</label>{children}{error && <p className="field-error">{error}</p>}</div> }
function ModalActions({ onCancel, submitting, saveLabel }) { return <div className="modal-actions"><button type="button" className="secondary-button" onClick={onCancel} disabled={submitting}>Cancel</button><button className="primary-button" disabled={submitting}>{submitting ? 'Saving...' : saveLabel}</button></div> }

export default ActivitySchedulePanel
