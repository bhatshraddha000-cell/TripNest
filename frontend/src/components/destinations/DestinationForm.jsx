import { useEffect, useState } from 'react'

const categories = ['BEACH', 'MOUNTAIN', 'HISTORICAL', 'ADVENTURE', 'HILL_STATION', 'CITY']

const emptyDestination = {
  name: '', description: '', state: '', country: '', category: 'BEACH',
  bestTimeToVisit: '', weatherInfo: '', imageUrl: '',
}

function DestinationForm({ destination, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(emptyDestination)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    setValues(destination ? { ...emptyDestination, ...destination } : emptyDestination)
    setError('')
    setFieldErrors({})
  }, [destination])

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    try {
      await onSubmit(values)
    } catch (submissionError) {
      const responseData = submissionError?.response?.data
      setError(responseData?.message ?? 'Unable to save this destination. Please check the details and try again.')
      setFieldErrors(responseData?.errors && typeof responseData.errors === 'object' ? responseData.errors : {})
    }
  }

  return (
    <form className="destination-form" onSubmit={handleSubmit}>
      <div className="destination-form-grid">
        <label>Destination name<input name="name" value={values.name} onChange={updateField} required />{fieldErrors.name ? <small className="destination-field-error" style={{ color: '#e35d5d' }}>{fieldErrors.name}</small> : null}</label>
        <label>Country<input name="country" value={values.country} onChange={updateField} required />{fieldErrors.country ? <small className="destination-field-error" style={{ color: '#e35d5d' }}>{fieldErrors.country}</small> : null}</label>
        <label>State / region<input name="state" value={values.state ?? ''} onChange={updateField} /></label>
        <label>Category<select name="category" value={values.category} onChange={updateField} required>{categories.map((category) => <option key={category} value={category}>{category.replace('_', ' ')}</option>)}</select>{fieldErrors.category ? <small className="destination-field-error" style={{ color: '#e35d5d' }}>{fieldErrors.category}</small> : null}</label>
        <label>Best time to visit<input name="bestTimeToVisit" value={values.bestTimeToVisit ?? ''} onChange={updateField} /></label>
        <label>Weather<input name="weatherInfo" value={values.weatherInfo ?? ''} onChange={updateField} /></label>
      </div>
      <label>Image URL<input name="imageUrl" type="url" value={values.imageUrl ?? ''} onChange={updateField} placeholder="https://example.com/destination.jpg" /></label>
      <label>Description<textarea name="description" value={values.description ?? ''} onChange={updateField} rows="5" maxLength="2000" />{fieldErrors.description ? <small className="destination-field-error" style={{ color: '#e35d5d' }}>{fieldErrors.description}</small> : null}</label>
      {error ? <p className="destination-form-error">{error}</p> : null}
      <div className="destination-form-actions">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="primary-button" disabled={submitting}>{submitting ? 'Saving...' : destination ? 'Save changes' : 'Add destination'}</button>
      </div>
    </form>
  )
}

export default DestinationForm
