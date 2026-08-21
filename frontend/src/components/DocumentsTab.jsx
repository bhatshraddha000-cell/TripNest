import { useEffect, useState } from 'react'
import { documentApi } from '../lib/documentApi.js'
import { api } from '../lib/api.js'
import ConfirmationModal from './common/ConfirmationModal.jsx'

function DocumentsTab({ tripId, tripRole, currentUserId }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Upload state
  const [file, setFile] = useState(null)
  const [documentType, setDocumentType] = useState('Flight Ticket')
  const [uploading, setUploading] = useState(false)

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, docId: null, fileName: '', submitting: false })

  const docTypes = [
    'Flight Ticket',
    'Train Ticket',
    'Hotel Booking',
    'Visa',
    'Passport',
    'Insurance',
    'Other'
  ]

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const data = await documentApi.listDocuments(tripId)
      setDocuments(data)
    } catch (err) {
      setError('Failed to fetch documents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [tripId])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (!selected) return

    const lowerName = selected.name.toLowerCase()
    if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.jpg') && !lowerName.endsWith('.jpeg') && !lowerName.endsWith('.png')) {
      setError('Only PDF, JPG, JPEG, and PNG files are allowed.')
      setFile(null)
      return
    }

    setError('')
    setFile(selected)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload.')
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')
      await documentApi.uploadDocument(tripId, file, documentType)
      setSuccess('Document uploaded successfully!')
      setFile(null)
      // Reset file input element
      const fileInput = document.getElementById('document-file-input')
      if (fileInput) fileInput.value = ''
      fetchDocuments()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to upload document.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (fileUrl, fileName) => {
    try {
      setError('')
      await documentApi.downloadDocument(fileUrl, fileName)
    } catch (err) {
      setError('Failed to download document.')
    }
  }

  const handlePreview = async (fileUrl) => {
    try {
      setError('')
      const response = await api.get(fileUrl, { responseType: 'blob' })
      const blobType = response.headers['content-type'] || 'application/pdf'
      const blobFile = new Blob([response.data], { type: blobType })
      const blobUrl = URL.createObjectURL(blobFile)
      window.open(blobUrl, '_blank')
    } catch (err) {
      setError('Failed to preview document.')
    }
  }

  const openDeleteModal = (docId, fileName) => {
    setDeleteModal({ isOpen: true, docId, fileName, submitting: false })
  }

  const confirmDeleteDocument = async () => {
    if (!deleteModal.docId) return
    try {
      setDeleteModal((prev) => ({ ...prev, submitting: true }))
      setError('')
      setSuccess('')
      await documentApi.deleteDocument(deleteModal.docId)
      setSuccess('Document deleted successfully!')
      setDeleteModal({ isOpen: false, docId: null, fileName: '', submitting: false })
      fetchDocuments()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to delete document.')
      setDeleteModal({ isOpen: false, docId: null, fileName: '', submitting: false })
    }
  }

  const getDocTypeIcon = (type) => {
    switch (type) {
      case 'Flight Ticket': return '✈️'
      case 'Train Ticket': return '🚂'
      case 'Hotel Booking': return '🏨'
      case 'Visa': return '🛂'
      case 'Passport': return '📘'
      case 'Insurance': return '🛡️'
      default: return '📄'
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && <div className="status-message error" style={{ padding: '12px', borderRadius: '8px', margin: 0 }}>{error}</div>}
      {success && <div className="status-message success" style={{ padding: '12px', borderRadius: '8px', margin: 0, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>{success}</div>}

      {/* Upload Document Card */}
      <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Upload Document</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
          Store flight tickets, hotel reservations, or visas. (PDF, JPG, PNG or JPEG up to 10MB)
        </p>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px', flex: 1 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              style={inputStyle}
            >
              {docTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px', flex: 1.5 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>File *</label>
            <input
              id="document-file-input"
              type="file"
              required
              accept=".pdf, .jpg, .jpeg, .png"
              onChange={handleFileChange}
              style={{
                ...inputStyle,
                padding: '8px 10px',
              }}
            />
          </div>

          <button className="primary-button" type="submit" disabled={uploading || !file} style={{ padding: '11px 24px' }}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {/* Documents Table / Grid */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Stored Documents</h3>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No documents stored yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {documents.map(doc => {
              const canDelete = doc.uploadedBy.userId === currentUserId || tripRole === 'GROUP_ADMIN'
              return (
                <div
                  key={doc.id}
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
                    <div style={{ fontSize: '1.6rem' }}>{getDocTypeIcon(doc.documentType)}</div>
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'block' }}>{doc.fileName}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {doc.documentType} &bull; Uploaded by {doc.uploadedBy.fullName} &bull; {formatDate(doc.uploadedAt)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="secondary-button compact-button"
                      onClick={() => handlePreview(doc.fileUrl)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Preview
                    </button>
                    <button
                      className="secondary-button compact-button"
                      onClick={() => handleDownload(doc.fileUrl, doc.fileName)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Download
                    </button>
                    {canDelete && (
                      <button
                        className="secondary-button compact-button danger-button"
                        onClick={() => openDeleteModal(doc.id, doc.fileName)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Document?"
        message={`Are you sure you want to delete “${deleteModal.fileName}”? This action cannot be undone.`}
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onConfirm={confirmDeleteDocument}
        onCancel={() => setDeleteModal({ isOpen: false, docId: null, fileName: '', submitting: false })}
        submitting={deleteModal.submitting}
        isDanger
      />
    </div>
  )
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

export default DocumentsTab
