import { useEffect, useState } from 'react'
import softBtn from '../../styles/adminSoftButtons.module.css'

export default function DeleteOrganizationDialog({
  open,
  organizationName,
  organizationSlug,
  deleting,
  error,
  onConfirm,
  onCancel,
}) {
  const [confirmSlug, setConfirmSlug] = useState('')
  const slugMatches =
    organizationSlug &&
    confirmSlug.trim().toLowerCase() === organizationSlug.trim().toLowerCase()

  useEffect(() => {
    if (!open) {
      setConfirmSlug('')
    }
  }, [open])

  if (!open) {
    return null
  }

  const displayName = organizationName?.trim() || 'this organization'

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-org-dialog-title"
        aria-describedby="delete-org-dialog-desc"
      >
        <h2 id="delete-org-dialog-title" className="admin-dialog__title">
          Delete {displayName}?
        </h2>
        <div id="delete-org-dialog-desc" className="admin-dialog__body">
          <p>
            This permanently removes your ServeWell workspace: all volunteer forms,
            submissions, staff notes, team members, and admin accounts for this
            organization. This cannot be undone.
          </p>
          <p>
            Planning Center is not affected. People and records in Planning Center stay
            as they are; only ServeWell&apos;s connection and data are removed.
          </p>
          <p>
            Type <strong>{organizationSlug}</strong> to confirm.
          </p>
          <label className="admin-label" htmlFor="delete-org-confirm-slug">
            Organization URL slug
          </label>
          <input
            id="delete-org-confirm-slug"
            className="admin-input"
            type="text"
            autoComplete="off"
            value={confirmSlug}
            onChange={(event) => setConfirmSlug(event.target.value)}
            disabled={deleting}
          />
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <div className="admin-dialog__actions">
          <button
            type="button"
            className={softBtn.softBtnDanger}
            disabled={deleting || !slugMatches}
            onClick={onConfirm}
          >
            {deleting ? 'Deleting…' : 'Delete organization'}
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
