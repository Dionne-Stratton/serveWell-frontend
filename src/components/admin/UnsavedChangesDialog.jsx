export default function UnsavedChangesDialog({
  open,
  saving,
  onSave,
  onDiscard,
  onStay,
}) {
  if (!open) {
    return null
  }

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-dialog-title"
        aria-describedby="unsaved-dialog-desc"
      >
        <h2 id="unsaved-dialog-title" className="admin-dialog__title">
          Unsaved changes
        </h2>
        <p id="unsaved-dialog-desc" className="admin-dialog__body">
          You have changes that are not saved yet. Save before leaving, or discard
          them.
        </p>
        <div className="admin-dialog__actions">
          <button
            type="button"
            className="admin-button admin-button--inline"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            className="admin-button admin-button--secondary admin-button--inline"
            disabled={saving}
            onClick={onDiscard}
          >
            Discard
          </button>
          <button
            type="button"
            className="admin-btn-text"
            disabled={saving}
            onClick={onStay}
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  )
}
