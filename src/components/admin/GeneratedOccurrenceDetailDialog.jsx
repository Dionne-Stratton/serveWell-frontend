import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ApiError,
  createAdminGeneratedOccurrenceAssignment,
  deleteAdminGeneratedOccurrenceAssignment,
  getAdminGeneratedOccurrenceEligibleVolunteers,
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

function RequirementAssignmentBlock({
  requirement,
  generatedScheduleId,
  occurrenceId,
  onOccurrenceUpdated,
  onError,
}) {
  const [eligible, setEligible] = useState([])
  const [eligibleStatus, setEligibleStatus] = useState('loading')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const onErrorRef = useRef(onError)

  onErrorRef.current = onError

  const isFull = requirement.assignedCount >= requirement.neededCount
  const canAssign = Boolean(requirement.scheduleServingAreaId) && !isFull
  const eligibleReady = eligibleStatus === 'ready'
  const eligiblePending = !eligibleReady
  const noEligibleVolunteers = eligibleReady && eligible.length === 0
  const showVolunteerPicker = eligibleReady && eligible.length > 0

  const loadEligible = useCallback(async () => {
    if (!canAssign) {
      setEligible([])
      setEligibleStatus('ready')
      return
    }

    setEligibleStatus('loading')

    try {
      const data = await getAdminGeneratedOccurrenceEligibleVolunteers(
        generatedScheduleId,
        occurrenceId,
        requirement.id,
      )
      setEligible(Array.isArray(data?.volunteers) ? data.volunteers : [])
      setEligibleStatus('ready')
    } catch (err) {
      setEligible([])
      setEligibleStatus('ready')
      onErrorRef.current(
        err instanceof ApiError ? err.message : 'Unable to load volunteers.',
      )
    }
  }, [canAssign, generatedScheduleId, occurrenceId, requirement.id])

  useEffect(() => {
    setSelectedSubmissionId('')
    void loadEligible()
  }, [loadEligible, requirement.assignedCount, requirement.assignments?.length])

  async function handleAssign() {
    if (!selectedSubmissionId) {
      onError('Choose a volunteer to assign.')
      return
    }

    setAssigning(true)
    onError('')

    try {
      const data = await createAdminGeneratedOccurrenceAssignment(
        generatedScheduleId,
        occurrenceId,
        {
          requirementId: requirement.id,
          submissionId: Number(selectedSubmissionId),
        },
      )
      onOccurrenceUpdated(data.occurrence)
      setSelectedSubmissionId('')
      void loadEligible()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to assign volunteer.')
    } finally {
      setAssigning(false)
    }
  }

  async function handleRemove(assignmentId) {
    setRemovingId(assignmentId)
    onError('')

    try {
      const data = await deleteAdminGeneratedOccurrenceAssignment(
        generatedScheduleId,
        occurrenceId,
        assignmentId,
      )
      onOccurrenceUpdated(data.occurrence)
      void loadEligible()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to remove assignment.')
    } finally {
      setRemovingId(null)
    }
  }

  const assignments = requirement.assignments ?? []

  return (
    <article className="admin-generated-occurrence-assignment-block">
      <header className="admin-generated-occurrence-assignment-block__header">
        <h4 className="admin-generated-occurrence-assignment-block__title">{requirement.displayName}</h4>
        <p className="admin-muted admin-generated-occurrence-assignment-block__counts">
          {requirement.assignedCount}/{requirement.neededCount} assigned
          {isFull ? (
            <span className="admin-generated-occurrence-assignment-block__full-badge"> · Fully covered</span>
          ) : null}
        </p>
      </header>

      {assignments.length ? (
        <ul className="admin-generated-occurrence-assignment-block__volunteers">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <span>{assignment.displayName}</span>
              <button
                type="button"
                className="admin-danger-button admin-danger-button--compact"
                disabled={removingId === assignment.id}
                onClick={() => void handleRemove(assignment.id)}
              >
                {removingId === assignment.id ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-muted admin-generated-occurrence-assignment-block__empty">
          No volunteers assigned yet.
        </p>
      )}

      {canAssign ? (
        <div
          className={`admin-generated-occurrence-assignment-block__assign-row${eligiblePending ? ' admin-generated-occurrence-assignment-block__assign-row--pending' : ''}`}
        >
          <div className="admin-field admin-generated-occurrence-assignment-block__select-field">
            <label className="admin-label" htmlFor={`assign-volunteer-${requirement.id}`}>
              Volunteer
            </label>
            {eligiblePending ? (
              <p
                id={`assign-volunteer-${requirement.id}`}
                className="admin-generated-occurrence-dialog__area-readonly admin-generated-occurrence-assignment-block__loading"
                aria-live="polite"
              >
                Loading volunteers…
              </p>
            ) : noEligibleVolunteers ? (
              <p
                id={`assign-volunteer-${requirement.id}`}
                className="admin-generated-occurrence-dialog__area-readonly admin-generated-occurrence-assignment-block__no-eligible"
              >
                No eligible active volunteers for this serving area
              </p>
            ) : (
              <select
                id={`assign-volunteer-${requirement.id}`}
                className="admin-input"
                value={selectedSubmissionId}
                disabled={assigning}
                onChange={(event) => setSelectedSubmissionId(event.target.value)}
              >
                <option value="">Select volunteer…</option>
                {eligible.map((volunteer) => (
                  <option key={volunteer.submissionId} value={volunteer.submissionId}>
                    {volunteer.displayName}
                  </option>
                ))}
              </select>
            )}
          </div>
          {showVolunteerPicker ? (
            <div className="admin-field admin-generated-occurrence-assignment-block__assign-action">
              <span className="admin-label admin-label--invisible" aria-hidden="true">
                Assign
              </span>
              <div className="admin-schedule-detail-row-action__button-wrap">
                <button
                  type="button"
                  className="admin-secondary-button"
                  disabled={assigning || !selectedSubmissionId}
                  onClick={() => void handleAssign()}
                >
                  {assigning ? 'Assigning…' : 'Assign volunteer'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!requirement.scheduleServingAreaId ? (
        <p className="admin-help">
          This staffing row is not linked to a form serving area, so volunteer assignment is not
          available.
        </p>
      ) : null}
    </article>
  )
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
  const [staffingMode, setStaffingMode] = useState('view')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [assignmentError, setAssignmentError] = useState('')
  const [saving, setSaving] = useState(false)

  const applyOccurrence = useCallback(
    (next) => {
      setOccurrence(next)
      if (staffingMode === 'view') {
        setRows(rowsFromOccurrence(next))
      }
      onSaved?.(next)
    },
    [onSaved, staffingMode],
  )

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
      setStaffingMode('view')
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
        if (staffingMode === 'edit') {
          setStaffingMode('view')
          setRows(rowsFromOccurrence(occurrence))
          setSaveError('')
        } else {
          onClose()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, occurrence, staffingMode])

  const templateServingAreas = occurrence?.templateServingAreas ?? []

  const usedServingAreaIds = useMemo(
    () => new Set(rows.map((row) => row.scheduleServingAreaId).filter(Boolean)),
    [rows],
  )

  function startStaffingEdit() {
    setRows(rowsFromOccurrence(occurrence))
    setSaveError('')
    setStaffingMode('edit')
  }

  function cancelStaffingEdit() {
    setRows(rowsFromOccurrence(occurrence))
    setSaveError('')
    setStaffingMode('view')
  }

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

  async function handleSaveStaffing(event) {
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
      setStaffingMode('view')
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
  const requirements = occurrence?.requirements ?? []

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
            <>
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
                <div className="admin-generated-occurrence-dialog__section-head">
                  <h3 className="admin-generated-occurrence-dialog__section-title">Staffing needs</h3>
                  {staffingMode === 'view' ? (
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={startStaffingEdit}
                    >
                      Edit staffing needs
                    </button>
                  ) : null}
                </div>

                {staffingMode === 'view' ? (
                  <>
                    {requirements.length === 0 ? (
                      <p className="admin-muted">No staffing needs yet.</p>
                    ) : (
                      <ul className="admin-generated-occurrence-staffing-summary">
                        {requirements.map((req) => (
                          <li key={req.id}>
                            {req.displayName}: {req.assignedCount}/{req.neededCount} assigned
                          </li>
                        ))}
                      </ul>
                    )}
                    {requirements.length === 0 ? (
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={startStaffingEdit}
                      >
                        Edit staffing needs
                      </button>
                    ) : null}
                  </>
                ) : (
                  <form id={formId} onSubmit={(event) => void handleSaveStaffing(event)}>
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
                    {saveError ? <p className="admin-error">{saveError}</p> : null}
                  </form>
                )}
              </section>

              <section
                className="admin-generated-occurrence-dialog__section"
                aria-labelledby="occ-assignments-heading"
              >
                <h3
                  id="occ-assignments-heading"
                  className="admin-generated-occurrence-dialog__section-title"
                >
                  Assignments
                </h3>
                {assignmentError ? <p className="admin-error">{assignmentError}</p> : null}
                {requirements.length === 0 ? (
                  <p className="admin-muted">Add staffing needs before assigning volunteers.</p>
                ) : (
                  <div className="admin-generated-occurrence-assignment-list">
                    {requirements.map((req) => (
                      <RequirementAssignmentBlock
                        key={req.id}
                        requirement={req}
                        generatedScheduleId={generatedScheduleId}
                        occurrenceId={occurrenceId}
                        onOccurrenceUpdated={(next) => {
                          setAssignmentError('')
                          applyOccurrence(next)
                        }}
                        onError={setAssignmentError}
                      />
                    ))}
                  </div>
                )}
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
            </>
          ) : null}
        </div>

        {showForm && staffingMode === 'edit' ? (
          <div className="admin-dialog__footer admin-dialog__actions">
            <button type="button" className="admin-secondary-button" onClick={cancelStaffingEdit}>
              Cancel
            </button>
            <button type="submit" form={formId} className="admin-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
