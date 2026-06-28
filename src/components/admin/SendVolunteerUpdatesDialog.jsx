import softBtn from '../../styles/adminSoftButtons.module.css'

export default function SendVolunteerUpdatesDialog({
  open,
  scheduleName,
  sending,
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
        aria-labelledby="send-volunteer-updates-dialog-title"
        aria-describedby="send-volunteer-updates-dialog-desc"
      >
        <h2 id="send-volunteer-updates-dialog-title" className="admin-dialog__title">
          Send updates for {titleName}?
        </h2>
        <div id="send-volunteer-updates-dialog-desc" className="admin-dialog__body">
          <p>
            Each affected volunteer will receive one email with every unsent change since the last
            publish or update send.
          </p>
          <p className="admin-muted">
            Volunteers without an email on file are skipped.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <div className="admin-dialog__actions">
          <button
            type="button"
            className={`${softBtn.saveBtn}${sending ? ` ${softBtn.saveBtnBusy}` : ''}`}
            disabled={sending}
            onClick={onConfirm}
          >
            {sending ? 'Sending…' : 'Send updates'}
          </button>
          <button type="button" className={softBtn.softBtn} disabled={sending} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
