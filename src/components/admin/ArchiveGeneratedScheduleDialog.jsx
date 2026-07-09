import softBtn from '../../styles/adminSoftButtons.module.css'

export default function ArchiveGeneratedScheduleDialog({
  open,
  scheduleName,
  hasUnsentVolunteerUpdates = false,
  archiving,
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
        aria-labelledby="archive-schedule-dialog-title"
        aria-describedby="archive-schedule-dialog-desc"
      >
        <h2 id="archive-schedule-dialog-title" className="admin-dialog__title">
          Archive {titleName}?
        </h2>
        <div id="archive-schedule-dialog-desc" className="admin-dialog__body">
          <p>
            Archiving keeps this schedule for your records but makes it read-only. Volunteers will
            no longer receive update emails for it, and email resource links stop working for new
            requests.
          </p>
          {hasUnsentVolunteerUpdates ? (
            <p className="admin-muted">
              You have unsent volunteer changes queued. Archiving discards those pending updates
              without sending email.
            </p>
          ) : null}
          <p className="admin-muted">
            You can still delete the schedule later if you need to remove it entirely.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <div className="admin-dialog__actions">
          <button
            type="button"
            className={`${softBtn.saveBtn}${archiving ? ` ${softBtn.saveBtnBusy}` : ''}`}
            disabled={archiving}
            onClick={onConfirm}
          >
            {archiving ? 'Archiving…' : 'Archive schedule'}
          </button>
          <button type="button" className={softBtn.softBtn} disabled={archiving} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
