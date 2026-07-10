import softBtn from '../../styles/adminSoftButtons.module.css'

export default function AutoFillGeneratedScheduleDialog({
  open,
  scheduleName,
  autoFilling,
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
        aria-labelledby="autofill-schedule-dialog-title"
        aria-describedby="autofill-schedule-dialog-desc"
      >
        <h2 id="autofill-schedule-dialog-title" className="admin-dialog__title">
          Auto-fill volunteers for {titleName}?
        </h2>
        <div id="autofill-schedule-dialog-desc" className="admin-dialog__body">
          <p>
            This runs the same auto-scheduler used when the schedule was created. It clears every
            volunteer assignment on this draft and fills slots again from current volunteer data
            (new approvals, interests, blackouts, and frequency limits).
          </p>
          <p className="admin-muted">
            Manual assignments will be replaced. Review the scheduling summary afterward before you
            publish.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <div className="admin-dialog__actions">
          <button
            type="button"
            className={`${softBtn.saveBtn}${autoFilling ? ` ${softBtn.saveBtnBusy}` : ''}`}
            disabled={autoFilling}
            onClick={onConfirm}
          >
            {autoFilling ? 'Auto-filling…' : 'Auto-fill volunteers'}
          </button>
          <button type="button" className={softBtn.softBtn} disabled={autoFilling} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
