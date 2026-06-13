import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import {
  ApiError,
  getAdminGeneratedScheduleOccurrence,
  patchAdminGeneratedScheduleOccurrenceStaffing,
} from '../../api/client'
import { formatDateOnly } from '../../constants/labels'
import { formatScheduleTime } from '../../constants/schedule'

function newClientRow() {
  return {
    clientId: `new-${crypto.randomUUID()}`,
    id: null,
    scheduleServingAreaId: '',
    neededCount: '1',
  }
}

function rowsFromOccurrence(occurrence) {
  if (!occurrence?.requirements?.length) {
    return []
  }

  return occurrence.requirements.map((req) => ({
    clientId: `existing-${req.id}`,
    id: req.id,
    scheduleServingAreaId: req.scheduleServingAreaId ? String(req.scheduleServingAreaId) : '',
    neededCount: String(req.neededCount),
    displayName: req.displayName,
    assignedCount: req.assignedCount,
  }))
}

function validateRows(rows, templateServingAreas) {
  const allowedIds = new Set(templateServingAreas.map((area) => String(area.id)))
  const seen = new Set()

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]

    if (!row.scheduleServingAreaId) {
      return `Staffing row ${index + 1}: serving area is required.`
    }

    if (!allowedIds.has(row.scheduleServingAreaId)) {
      return `Staffing row ${index + 1}: choose a serving area from this schedule template.`
    }

    if (seen.has(row.scheduleServingAreaId)) {
      return 'Each serving area can only appear once for this event.'
    }

    seen.add(row.scheduleServingAreaId)

    const needed = Number(row.neededCount)

    if (!Number.isInteger(needed) || needed < 1) {
      return `Staffing row ${index + 1}: needed count must be a whole number of at least 1.`
    }

    if (row.assignedCount != null && needed < row.assignedCount) {
      return `Staffing row ${index + 1}: needed count cannot be less than assigned (${row.assignedCount}).`
    }
  }

  return ''
}

export default function GeneratedOccurrenceDetailDialog({
  open,
  generatedScheduleId,
  occurrenceId,
  onClose,
  onSaved,
}) {
  const titleId = useId()
  const formId = useId()
  const [occurrence, setOccurrence] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!generatedScheduleId || !occurrenceId) {
      return
    }

    setLoading(true)
    setLoadError('')

    try {
      const data = await getAdminGeneratedScheduleOccurrence(generatedScheduleId, occurrenceId)
      const next = data.occurrence ?? null
      setOccurrence(next)
      setRows(rowsFromOccurrence(next))
    } catch (err) {
      setOccurrence(null)
      setRows([])
      setLoadError(err instanceof ApiError ? err.message : 'Unable to load this event.')
    } finally {
      setLoading(false)
    }
  }, [generatedScheduleId, occurrenceId])

  useEffect(() => {
    if (!open) {
      return
    }

    void load()
  }, [open, load])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  const templateServingAreas = occurrence?.templateServingAreas ?? []

  const usedServingAreaIds = useMemo(
    () => new Set(rows.map((row) => row.scheduleServingAreaId).filter(Boolean)),
    [rows],
  )

  function updateRow(clientId, patch) {
    setRows((current) =>
      current.map((row) => (row.clientId === clientId ? { ...row, ...patch } : row)),
    )
    setSaveError('')
  }

  function removeRow(clientId) {
    setRows((current) => current.filter((row) => row.clientId !== clientId))
    setSaveError('')
  }

  function addRow() {
    setRows((current) => [...current, newClientRow()])
    setSaveError('')
  }

  async function handleSave(event) {
    event.preventDefault()

    const validationError = validateRows(rows, templateServingAreas)

    if (validationError) {
      setSaveError(validationError)
      return
    }

    setSaving(true)
    setSaveError('')

    try {
      const payload = {
        requirements: rows.map((row) => ({
          ...(row.id ? { id: row.id } : {}),
          scheduleServingAreaId: Number(row.scheduleServingAreaId),
          neededCount: Number(row.neededCount),
        })),
      }

      const data = await patchAdminGeneratedScheduleOccurrenceStaffing(
        generatedScheduleId,
        occurrenceId,
        payload,
      )

      const updated = data.occurrence ?? null
      setOccurrence(updated)
      setRows(rowsFromOccurrence(updated))
      onSaved?.(updated)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Unable to save staffing changes.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return null
  }

  const showForm = !loading && !loadError && occurrence

  return (
    <div className="admin-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-dialog admin-dialog--wide admin-dialog--scrollable admin-generated-occurrence-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-dialog__header">
          <h2 id={titleId} className="admin-dialog__title">
            Event details
          </h2>
          <button type="button" className="admin-dialog__close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="admin-dialog__scroll-body admin-dialog__body">
          {loading ? <p className="admin-loading">Loading…</p> : null}
          {loadError ? <p className="admin-error">{loadError}</p> : null}

          {showForm ? (
            <form id={formId} onSubmit={(event) => void handleSave(event)}>
              <dl className="admin-dl admin-dl--compact admin-generated-occurrence-dialog__summary">
                <div>
                  <dt>Event</dt>
                  <dd>{occurrence.name}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{formatDateOnly(occurrence.occurrenceDate)}</dd>
                </div>
                <div>
                  <dt>Start time</dt>
                  <dd>{formatScheduleTime(occurrence.startTime)}</dd>
                </div>
              </dl>

              <section className="admin-generated-occurrence-dialog__section">
                <h3 className="admin-generated-occurrence-dialog__section-title">Staffing needs</h3>
                <p className="admin-help">
                  Changes apply to this event only and do not update the schedule template.
                </p>

                {rows.length === 0 ? (
                  <p className="admin-muted">No staffing needs yet.</p>
                ) : (
                  <ul className="admin-schedule-wizard__req-list admin-generated-occurrence-dialog__req-list">
                    {rows.map((row) => {
                      const isExisting = row.id != null && row.scheduleServingAreaId
                      const areaOptions = templateServingAreas.filter(
                        (area) =>
                          String(area.id) === row.scheduleServingAreaId ||
                          !usedServingAreaIds.has(String(area.id)),
                      )

                      return (
                        <li key={row.clientId} className="admin-schedule-wizard__req-row">
                          <div className="admin-field">
                            <label className="admin-label" htmlFor={`occ-area-${row.clientId}`}>
                              Serving area
                            </label>
                            {isExisting ? (
                              <p
                                id={`occ-area-${row.clientId}`}
                                className="admin-generated-occurrence-dialog__area-readonly"
                              >
                                {row.displayName ||
                                  templateServingAreas.find(
                                    (a) => String(a.id) === row.scheduleServingAreaId,
                                  )?.displayName ||
                                  '—'}
                              </p>
                            ) : (
                              <select
                                id={`occ-area-${row.clientId}`}
                                className="admin-input"
                                value={row.scheduleServingAreaId}
                                onChange={(event) =>
                                  updateRow(row.clientId, {
                                    scheduleServingAreaId: event.target.value,
                                  })
                                }
                              >
                                <option value="">Select…</option>
                                {areaOptions.map((area) => (
                                  <option key={area.id} value={area.id}>
                                    {area.displayName}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div className="admin-field admin-schedule-wizard__count-field">
                            <label className="admin-label" htmlFor={`occ-count-${row.clientId}`}>
                              Needed
                            </label>
                            <input
                              id={`occ-count-${row.clientId}`}
                              className="admin-input admin-input--compact"
                              inputMode="numeric"
                              value={row.neededCount}
                              onChange={(event) =>
                                updateRow(row.clientId, { neededCount: event.target.value })
                              }
                            />
                          </div>
                          <div className="admin-field admin-schedule-detail-row-action">
                            <span className="admin-label admin-label--invisible" aria-hidden="true">
                              Remove
                            </span>
                            <div className="admin-schedule-detail-row-action__button-wrap">
                              <button
                                type="button"
                                className="admin-danger-button admin-danger-button--compact"
                                onClick={() => removeRow(row.clientId)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {row.assignedCount != null && row.assignedCount > 0 ? (
                            <p className="admin-help admin-generated-occurrence-dialog__assigned-hint">
                              {row.assignedCount} assigned for this event
                            </p>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                )}

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={addRow}
                  disabled={templateServingAreas.length === 0}
                >
                  Add serving area
                </button>
                {templateServingAreas.length === 0 ? (
                  <p className="admin-help">
                    Connect serving areas on the schedule template before adding staffing here.
                  </p>
                ) : null}
              </section>

              <section
                className="admin-generated-occurrence-dialog__section admin-generated-occurrence-dialog__section--placeholder"
                aria-labelledby="occ-assignments-heading"
              >
                <h3
                  id="occ-assignments-heading"
                  className="admin-generated-occurrence-dialog__section-title"
                >
                  Assignments
                </h3>
                <p className="admin-muted admin-generated-occurrence-dialog__placeholder">
                  Volunteer assignments for this event will appear here.
                </p>
              </section>

              <section
                className="admin-generated-occurrence-dialog__section admin-generated-occurrence-dialog__section--placeholder"
                aria-labelledby="occ-notes-heading"
              >
                <h3 id="occ-notes-heading" className="admin-generated-occurrence-dialog__section-title">
                  Notes
                </h3>
                <p className="admin-muted admin-generated-occurrence-dialog__placeholder">
                  Event notes will be available in a future update.
                </p>
              </section>

              <section
                className="admin-generated-occurrence-dialog__section admin-generated-occurrence-dialog__section--placeholder"
                aria-labelledby="occ-resources-heading"
              >
                <h3
                  id="occ-resources-heading"
                  className="admin-generated-occurrence-dialog__section-title"
                >
                  Resources
                </h3>
                <p className="admin-muted admin-generated-occurrence-dialog__placeholder">
                  Links and files for this event will be available in a future update.
                </p>
              </section>

              {saveError ? <p className="admin-error">{saveError}</p> : null}
            </form>
          ) : null}
        </div>

        {showForm ? (
          <div className="admin-dialog__footer admin-dialog__actions">
            <button type="submit" form={formId} className="admin-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
