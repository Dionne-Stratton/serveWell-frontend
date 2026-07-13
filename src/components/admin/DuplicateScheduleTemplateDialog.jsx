import { useState } from 'react'
import softBtn from '../../styles/adminSoftButtons.module.css'

export function defaultDuplicateTemplateName(sourceName) {
  const base = sourceName?.trim() || 'Untitled template'
  return `${base} (copy)`
}

export default function DuplicateScheduleTemplateDialog({
  open,
  sourceName,
  duplicating,
  error,
  onConfirm,
  onCancel,
}) {
  const [name, setName] = useState(() => defaultDuplicateTemplateName(sourceName))
  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setName(defaultDuplicateTemplateName(sourceName))
    }
  }

  if (!open) {
    return null
  }

  const titleName = sourceName?.trim() || 'this template'

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <div
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-schedule-dialog-title"
        aria-describedby="duplicate-schedule-dialog-desc"
      >
        <h2 id="duplicate-schedule-dialog-title" className="admin-dialog__title">
          Duplicate {titleName}?
        </h2>
        <div id="duplicate-schedule-dialog-desc" className="admin-dialog__body">
          <p>
            Creates a new schedule template with the same serving areas, events, and staffing
            needs. Generated schedules already made from the original are not changed.
          </p>
          <div className="admin-field">
            <label className="admin-label" htmlFor="duplicate-template-name">
              New template name
            </label>
            <input
              id="duplicate-template-name"
              className="admin-input"
              value={name}
              disabled={duplicating}
              autoFocus
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  if (name.trim()) {
                    onConfirm(name.trim())
                  }
                }
              }}
            />
          </div>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <div className="admin-dialog__actions">
          <button
            type="button"
            className={`${softBtn.saveBtn}${duplicating ? ` ${softBtn.saveBtnBusy}` : ''}`}
            disabled={duplicating || !name.trim()}
            onClick={() => onConfirm(name.trim())}
          >
            {duplicating ? 'Duplicating…' : 'Duplicate template'}
          </button>
          <button type="button" className={softBtn.softBtn} disabled={duplicating} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
