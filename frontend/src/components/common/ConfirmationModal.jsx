import React from 'react'

/**
 * Reusable theme-aware confirmation modal for TripNest.
 * Uses TripNest design tokens (var(--surface), var(--text), var(--paragraph), var(--border), var(--shadow))
 * to look premium and consistent in both Light and Dark modes.
 */
function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  submitting = false,
  isDanger = true,
}) {
  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="confirmation-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '30px',
          borderRadius: '20px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          color: 'var(--text)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--heading)', fontWeight: 600 }}>{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            &times;
          </button>
        </div>
        <p className="modal-description" style={{ color: 'var(--paragraph)', fontSize: '0.925rem', lineHeight: '1.5', margin: '12px 0 24px 0' }}>
          {message}
        </p>
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={submitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`primary-button ${isDanger ? 'danger-primary-button' : ''}`}
            onClick={onConfirm}
            disabled={submitting}
            style={
              isDanger
                ? { background: '#ef4444', borderColor: '#ef4444', color: '#ffffff' }
                : {}
            }
          >
            {submitting ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal
