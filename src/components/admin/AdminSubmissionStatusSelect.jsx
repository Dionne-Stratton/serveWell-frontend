import { useEffect, useState } from 'react'
import { ApiError, updateAdminSubmission } from '../../api/client'
import { submissionStatusOptions } from '../../constants/enums'
import { normalizeSubmissionStatus } from '../../constants/submissionStatus'

export default function AdminSubmissionStatusSelect({
  submissionId,
  status,
  label = 'Status',
  inline = false,
  autosavedHint,
  onUpdated,
}) {
  const [value, setValue] = useState(() => normalizeSubmissionStatus(status))

  useEffect(() => {
    setValue(normalizeSubmissionStatus(status))
  }, [status])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const normalizedStatus = normalizeSubmissionStatus(status)

  async function handleChange(event) {
    const nextStatus = event.target.value

    if (nextStatus === normalizedStatus) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await updateAdminSubmission(submissionId, { status: nextStatus })
      setValue(nextStatus)
      onUpdated?.(nextStatus)
    } catch (err) {
      setValue(normalizedStatus)
      setError(err instanceof ApiError ? err.message : 'Could not update status.')
    } finally {
      setSaving(false)
    }
  }

  const selectId = `submission-status-${submissionId}`

  const autosaved =
    autosavedHint === 'below' ? (
      <span className="admin-status-control__autosaved admin-status-control__autosaved--below">
        (autosaved)
      </span>
    ) : null

  const control = (
    <div
      className={`admin-status-control${inline ? ' admin-status-control--inline' : ''}`}
    >
      <label
        className={`admin-label admin-status-control__label${inline ? ' admin-status-control__label--inline' : ''}`}
        htmlFor={selectId}
      >
        {label}
      </label>
      <select
        id={selectId}
        className="admin-input admin-input--select admin-status-control__select"
        value={value}
        onChange={handleChange}
        disabled={saving}
        aria-busy={saving}
      >
        {submissionStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="admin-error-inline admin-status-control__error">{error}</p> : null}
    </div>
  )

  if (autosavedHint === 'below') {
    return (
      <div className="admin-status-control-stack">
        {control}
        {autosaved}
      </div>
    )
  }

  return control
}
