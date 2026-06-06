import softBtn from '../../styles/adminSoftButtons.module.css'

export default function DeleteVolunteerSubmissionDialog({
  open,
  volunteerName,
  deleting,
  error,
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null
  }

  const titleName = volunteerName?.trim() || 'this volunteer'

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-volunteer-dialog-title"
        aria-describedby="delete-volunteer-dialog-desc"
      >
        <h2 id="delete-volunteer-dialog-title" className="admin-dialog__title">
          Delete {titleName}?
        </h2>
        <div id="delete-volunteer-dialog-desc" className="admin-dialog__body">
          <p>
            This permanently removes them from ServeWell only. Intake data and staff notes
            on your dashboard will be gone and cannot be undone.
          </p>
          <p>
            Planning Center is not affected. If they were added in People there, remove or
            update them in Planning Center yourself—ServeWell never deletes anyone in
            Planning Center.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <div className="admin-dialog__actions">
          <button
            type="button"
            className={softBtn.softBtnDanger}
            disabled={deleting}
            onClick={onConfirm}
            aria-describedby="delete-volunteer-dialog-desc"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button
            type="button"
            className={softBtn.softBtn}
            disabled={deleting}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
