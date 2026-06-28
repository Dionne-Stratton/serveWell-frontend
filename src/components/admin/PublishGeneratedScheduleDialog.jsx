import softBtn from '../../styles/adminSoftButtons.module.css'

export default function PublishGeneratedScheduleDialog({
  open,
  scheduleName,
  publishing,
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
        aria-labelledby="publish-schedule-dialog-title"
        aria-describedby="publish-schedule-dialog-desc"
      >
        <h2 id="publish-schedule-dialog-title" className="admin-dialog__title">
          Publish {titleName}?
        </h2>
        <div id="publish-schedule-dialog-desc" className="admin-dialog__body">
          <p>
            Publishing marks this schedule as finalized for your team. Assigned volunteers will
            receive one email with their assignments for this schedule.
          </p>
          <p className="admin-muted">
            You can still edit assignments, notes, and resources afterward. Changes are saved
            immediately; use Send updates on the schedule when you are ready to email volunteers.
            Volunteers without an email on file are skipped.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <div className="admin-dialog__actions">
          <button
            type="button"
            className={`${softBtn.saveBtn}${publishing ? ` ${softBtn.saveBtnBusy}` : ''}`}
            disabled={publishing}
            onClick={onConfirm}
          >
            {publishing ? 'Publishing…' : 'Publish schedule'}
          </button>
          <button type="button" className={softBtn.softBtn} disabled={publishing} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
