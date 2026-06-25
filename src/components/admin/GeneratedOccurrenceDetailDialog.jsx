import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import {
  ApiError,
  getAdminGeneratedScheduleOccurrence,
  patchAdminGeneratedScheduleOccurrenceStaffing,
} from '../../api/client'
import GeneratedOccurrenceNotesSection, {
  servingAreaOptionsFromRequirements,
} from './GeneratedOccurrenceNotesSection'
import GeneratedOccurrenceResourcesSection from './GeneratedOccurrenceResourcesSection'
import GeneratedOccurrenceServingAreaCard, {
  defaultServingAreaCardExpanded,
} from './GeneratedOccurrenceServingAreaCard'
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

function pinExpandedServingAreaCards(requirements, expandedByRequirementId) {
  const pinned = { ...expandedByRequirementId }

  for (const req of requirements ?? []) {
    const override = expandedByRequirementId[req.id]
    const isExpanded =
      override !== undefined ? override : defaultServingAreaCardExpanded(req)

    if (isExpanded) {
      pinned[req.id] = true
    }
  }

  return pinned
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
  const [generalError, setGeneralError] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedByRequirementId, setExpandedByRequirementId] = useState({})

  const applyOccurrence = useCallback(
    (next) => {
      setExpandedByRequirementId((current) =>
        pinExpandedServingAreaCards(occurrence?.requirements, current),
      )
      setOccurrence(next)
      if (staffingMode === 'view') {
        setRows(rowsFromOccurrence(next))
      }
      onSaved?.(next)
    },
    [onSaved, staffingMode, occurrence?.requirements],
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
      setExpandedByRequirementId({})
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
  const noteServingAreaOptions = useMemo(
    () => servingAreaOptionsFromRequirements(occurrence?.requirements),
    [occurrence?.requirements],
  )

  const usedServingAreaIds = useMemo(
    () => new Set(rows.map((row) => row.scheduleServingAreaId).filter(Boolean)),
    [rows],
  )

  const requirements = occurrence?.requirements ?? []

  function isRequirementExpanded(requirement) {
    const override = expandedByRequirementId[requirement.id]
    if (override !== undefined) {
      return override
    }

    return defaultServingAreaCardExpanded(requirement)
  }

  function toggleRequirementExpanded(requirementId) {
    setExpandedByRequirementId((current) => {
      const requirement = requirements.find((req) => req.id === requirementId)
      const isExpanded =
        current[requirementId] !== undefined
          ? current[requirementId]
          : requirement
            ? defaultServingAreaCardExpanded(requirement)
            : true

      return { ...current, [requirementId]: !isExpanded }
    })
  }

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
      setExpandedByRequirementId({})
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

  const generalPanelProps = {
    servingAreaOptions: noteServingAreaOptions,
    generatedScheduleId,
    occurrenceId,
    embedded: true,
    onOccurrenceUpdated: (next) => {
      if (next) {
        setGeneralError('')
        applyOccurrence(next)
      }
    },
    onError: setGeneralError,
  }

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
                      <>
                        <p className="admin-muted">
                          No serving areas on this event yet. Add staffing needs to manage volunteers,
                          notes, and resources by team.
                        </p>
                        <button
                          type="button"
                          className="admin-secondary-button"
                          onClick={startStaffingEdit}
                        >
                          Edit staffing needs
                        </button>
                      </>
                    ) : (
                      <p className="admin-muted admin-generated-occurrence-dialog__staffing-hint">
                        {requirements.length} serving {requirements.length === 1 ? 'area' : 'areas'} on
                        this event. Expand a team below to assign volunteers and attach notes or files.
                      </p>
                    )}
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
                                    className="admin-input admin-input--select"
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

              {staffingMode === 'view' ? (
                <>
                  <section
                    className="admin-generated-occurrence-dialog__section"
                    aria-labelledby="occ-general-heading"
                  >
                    <h3
                      id="occ-general-heading"
                      className="admin-generated-occurrence-dialog__section-title"
                    >
                      General event items
                    </h3>
                    <p className="admin-help admin-generated-occurrence-dialog__general-lead">
                      Notes and files that apply to the whole event, not one serving team.
                    </p>
                    {generalError ? <p className="admin-error">{generalError}</p> : null}
                    <GeneratedOccurrenceNotesSection
                      {...generalPanelProps}
                      notes={occurrence.notes ?? []}
                      scope="general"
                      idPrefix="occ-general-notes"
                    />
                    <GeneratedOccurrenceResourcesSection
                      {...generalPanelProps}
                      resources={occurrence.resources ?? []}
                      scope="general"
                      idPrefix="occ-general-resources"
                    />
                  </section>

                  <section
                    className="admin-generated-occurrence-dialog__section"
                    aria-labelledby="occ-areas-heading"
                  >
                    <h3
                      id="occ-areas-heading"
                      className="admin-generated-occurrence-dialog__section-title"
                    >
                      Serving areas
                    </h3>
                    {requirements.length === 0 ? (
                      <p className="admin-muted">Add staffing needs to manage teams for this event.</p>
                    ) : (
                      <div className="admin-generated-occurrence-dialog__area-list">
                        {requirements.map((req) => (
                          <GeneratedOccurrenceServingAreaCard
                            key={req.id}
                            requirement={req}
                            notes={occurrence.notes ?? []}
                            resources={occurrence.resources ?? []}
                            servingAreaOptions={noteServingAreaOptions}
                            generatedScheduleId={generatedScheduleId}
                            occurrenceId={occurrenceId}
                            expanded={isRequirementExpanded(req)}
                            onToggleExpanded={() => toggleRequirementExpanded(req.id)}
                            onOccurrenceUpdated={applyOccurrence}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </>
              ) : null}
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
