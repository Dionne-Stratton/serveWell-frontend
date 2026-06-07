import { useEffect, useId, useState } from 'react'
import softBtn from '../../styles/adminSoftButtons.module.css'

function IconPencil() {
  return (
    <svg
      className="admin-profile-editable__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function EditableProfileField({
  label,
  value,
  inputType = 'text',
  autoComplete,
  disabled,
  onSave,
}) {
  const inputId = useId()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editing) {
      setDraft(value ?? '')
    }
  }, [value, editing])

  function startEditing() {
    if (disabled) {
      return
    }
    setError('')
    setDraft(value ?? '')
    setEditing(true)
  }

  function cancelEditing() {
    setDraft(value ?? '')
    setError('')
    setEditing(false)
  }

  async function handleSave(event) {
    event.preventDefault()
    const trimmed = draft.trim()

    if (!trimmed) {
      setError('This field cannot be empty.')
      return
    }

    if (trimmed === (value ?? '').trim()) {
      setEditing(false)
      return
    }

    setSaving(true)
    setError('')

    try {
      await onSave(trimmed)
      setEditing(false)
    } catch (err) {
      setError(err?.message ?? 'Unable to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-detail-row admin-profile-editable">
      <dt>{label}</dt>
      <dd>
        {editing ? (
          <form className="admin-profile-editable__form" onSubmit={handleSave}>
            <input
              id={inputId}
              className={`admin-input admin-profile-editable__input ${softBtn.matchFieldInput}`}
              type={inputType}
              autoComplete={autoComplete}
              value={draft}
              disabled={saving}
              onChange={(event) => setDraft(event.target.value)}
              required
            />
            <button
              type="submit"
              className={`${softBtn.softBtn} ${softBtn.matchFieldInput}`}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className={`${softBtn.softBtn} ${softBtn.matchFieldInput}`}
              disabled={saving}
              onClick={cancelEditing}
            >
              Cancel
            </button>
            {error ? <p className="admin-error admin-profile-editable__error">{error}</p> : null}
          </form>
        ) : (
          <div className="admin-profile-editable__display">
            <span>{value ?? '—'}</span>
            {!disabled ? (
              <button
                type="button"
                className="admin-profile-editable__pencil"
                aria-label={`Edit ${label}`}
                onClick={startEditing}
              >
                <IconPencil />
              </button>
            ) : null}
          </div>
        )}
      </dd>
    </div>
  )
}
