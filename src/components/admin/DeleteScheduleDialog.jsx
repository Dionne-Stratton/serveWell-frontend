import softBtn from '../../styles/adminSoftButtons.module.css'

export default function DeleteScheduleDialog({
  open,
  scheduleName,
  deleting,
  error,
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null
  }

  const titleName = scheduleName?.trim() || 'this schedule'

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-schedule-dialog-title"
        aria-describedby="delete-schedule-dialog-desc"
      >
        <h2 id="delete-schedule-dialog-title" className="admin-dialog__title">
          Delete {titleName}?
        </h2>
        <div id="delete-schedule-dialog-desc" className="admin-dialog__body">
          <p>
            This permanently removes the schedule, its events, and staffing needs.
            This cannot be undone.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <div className="admin-dialog__actions">
          <button
            type="button"
            className={softBtn.softBtnDanger}
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? 'Deleting…' : 'Delete schedule'}
          </button>
          <button type="button" className={softBtn.softBtn} disabled={deleting} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
