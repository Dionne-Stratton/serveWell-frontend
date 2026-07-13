import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  deleteAdminSchedule,
  duplicateAdminSchedule,
  getAdminSchedule,
  getAdminScheduleServingAreaOptions,
  patchAdminSchedule,
  putAdminScheduleRhythms,
  putAdminScheduleServingAreas,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import AdminToast from '../components/admin/AdminToast'
import DeleteScheduleDialog from '../components/admin/DeleteScheduleDialog'
import DuplicateScheduleTemplateDialog from '../components/admin/DuplicateScheduleTemplateDialog'
import {
  dayOfWeekOptions,
  formatScheduleTime,
  labelDayOfWeek,
  labelScheduleType,
  scheduleTypeOptions,
} from '../constants/schedule'
import { adminScheduleDetailPath, adminSchedulesPath } from '../utils/organizationPaths'
import {
  buildRhythmsPutPayload,
  buildServingAreasPutPayload,
  emptyRhythm,
  emptyStaffingRow,
  hasUnassignedOptions,
  isServingAreaUsedInRhythms,
  linkedAreasNotYetConnected,
  optionsExcludingValuesUsedElsewhere,
  rhythmFromDetail,
  servingAreasFromDetail,
  validateRhythmsLocal,
  validateServingAreasLocal,
} from '../utils/scheduleEditUtils'
import { normalizeStartTime } from '../utils/scheduleEditValidation'
import '../styles/admin.css'

function applyDetailToState(detail, setters) {
  setters.setName(detail.name ?? '')
  setters.setScheduleType(detail.scheduleType ?? 'monthly')
  setters.setServingAreas(servingAreasFromDetail(detail.servingAreas))
  setters.setRhythms((detail.rhythms ?? []).map(rhythmFromDetail))
}

function isRhythmPersistable(rhythm) {
  return Boolean(
    rhythm.name?.trim() && rhythm.dayOfWeek && normalizeStartTime(rhythm.startTime),
  )
}

function sanitizeRhythmsForPersist(rhythms) {
  return rhythms.filter(isRhythmPersistable).map((rhythm) => ({
    ...rhythm,
    startTime: normalizeStartTime(rhythm.startTime) ?? rhythm.startTime,
    requirements: rhythm.requirements.filter((row) => {
      const areaId = Number(row.scheduleServingAreaId)
      const count = Number(row.neededCount)
      return (
        Number.isInteger(areaId) &&
        areaId > 0 &&
        Number.isInteger(count) &&
        count >= 1
      )
    }),
  }))
}

export default function AdminScheduleDetailPage() {
  const { organizationSlug, id: idParam } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const scheduleId = Number(idParam)
  const listPath = adminSchedulesPath(organizationSlug)

  const [loading, setLoading] = useState(
    () => Number.isInteger(scheduleId) && scheduleId >= 1,
  )
  const [loadError, setLoadError] = useState(() =>
    Number.isInteger(scheduleId) && scheduleId >= 1 ? '' : 'Invalid template.',
  )
  const [name, setName] = useState('')
  const [scheduleType, setScheduleType] = useState('monthly')
  const [servingAreas, setServingAreas] = useState([])
  const [rhythms, setRhythms] = useState([])
  const [catalogForms, setCatalogForms] = useState([])

  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState('')
  const [areasSaving, setAreasSaving] = useState(false)
  const [areasError, setAreasError] = useState('')
  const [rhythmsSaving, setRhythmsSaving] = useState(false)
  const [rhythmsError, setRhythmsError] = useState('')

  const [addAreaId, setAddAreaId] = useState('')
  const [customAreaName, setCustomAreaName] = useState('')

  const [toastMessage, setToastMessage] = useState(() =>
    location.state?.templateDuplicated ? 'Template duplicated.' : '',
  )
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [duplicateError, setDuplicateError] = useState('')
  const [duplicating, setDuplicating] = useState(false)

  const [rhythmDeleteTarget, setRhythmDeleteTarget] = useState(null)
  const [prevScheduleId, setPrevScheduleId] = useState(scheduleId)
  const incomingState = location.state
  const [prevNavState, setPrevNavState] = useState(incomingState)

  const servingAreasRef = useRef(servingAreas)
  const rhythmsRef = useRef(rhythms)
  const scheduleTypeRef = useRef(scheduleType)
  const areasSaveChain = useRef(Promise.resolve())
  const rhythmsSaveChain = useRef(Promise.resolve())
  const basicsSaveChain = useRef(Promise.resolve())

  servingAreasRef.current = servingAreas
  rhythmsRef.current = rhythms
  scheduleTypeRef.current = scheduleType

  if (incomingState !== prevNavState) {
    setPrevNavState(incomingState)
    if (incomingState?.templateDuplicated) {
      setToastMessage('Template duplicated.')
    }
  }

  if (scheduleId !== prevScheduleId) {
    setPrevScheduleId(scheduleId)
    if (!Number.isInteger(scheduleId) || scheduleId < 1) {
      setLoading(false)
      setLoadError('Invalid template.')
      setName('')
      setScheduleType('monthly')
      setServingAreas([])
      setRhythms([])
      setCatalogForms([])
    } else {
      setLoading(true)
      setLoadError('')
      setName('')
      setScheduleType('monthly')
      setServingAreas([])
      setRhythms([])
      setCatalogForms([])
    }
  }

  const connectedAreaIds = useMemo(
    () => new Set(servingAreas.map((row) => row.id).filter((areaId) => areaId != null)),
    [servingAreas],
  )

  const addableLinkedAreas = useMemo(
    () => linkedAreasNotYetConnected(catalogForms, servingAreas),
    [catalogForms, servingAreas],
  )

  useEffect(() => {
    if (!Number.isInteger(scheduleId) || scheduleId < 1) {
      return undefined
    }

    let cancelled = false

    ;(async () => {
      try {
        const [detail, catalog] = await Promise.all([
          getAdminSchedule(scheduleId),
          getAdminScheduleServingAreaOptions(),
        ])

        if (cancelled) {
          return
        }

        setCatalogForms(Array.isArray(catalog?.forms) ? catalog.forms : [])
        applyDetailToState(detail, {
          setName,
          setScheduleType,
          setServingAreas,
          setRhythms,
        })
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : 'Unable to load template.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [scheduleId])

  async function persistBasics(nextName, nextScheduleType) {
    const trimmed = nextName.trim()

    if (!trimmed) {
      setNameError('Template name is required.')
      return
    }

    setNameError('')
    setNameSaving(true)

    try {
      const updated = await patchAdminSchedule(scheduleId, {
        name: trimmed,
        scheduleType: nextScheduleType,
      })
      setName(updated.name ?? trimmed)
      setScheduleType(updated.scheduleType ?? nextScheduleType)
      setToastMessage('Saved.')
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : 'Unable to save template details.')
    } finally {
      setNameSaving(false)
    }
  }

  function queuePersistBasics(nextName, nextScheduleType) {
    basicsSaveChain.current = basicsSaveChain.current
      .catch(() => {})
      .then(() => persistBasics(nextName, nextScheduleType))
  }

  async function persistServingAreas(nextAreas) {
    setAreasError('')
    const message = validateServingAreasLocal(nextAreas)

    if (message) {
      setAreasError(message)
      return
    }

    setAreasSaving(true)

    try {
      const updated = await putAdminScheduleServingAreas(
        scheduleId,
        buildServingAreasPutPayload(nextAreas),
      )
      setServingAreas(servingAreasFromDetail(updated.servingAreas))
      if (updated.name != null) {
        setName(updated.name)
      }
      if (updated.scheduleType != null) {
        setScheduleType(updated.scheduleType)
      }
      setToastMessage('Saved.')
    } catch (err) {
      setAreasError(err instanceof ApiError ? err.message : 'Unable to save serving areas.')
    } finally {
      setAreasSaving(false)
    }
  }

  function commitServingAreas(nextAreas) {
    servingAreasRef.current = nextAreas
    setServingAreas(nextAreas)
    areasSaveChain.current = areasSaveChain.current
      .catch(() => {})
      .then(() => persistServingAreas(nextAreas))
  }

  async function persistRhythms(nextRhythms) {
    setRhythmsError('')

    const drafts = nextRhythms.filter((rhythm) => !isRhythmPersistable(rhythm))
    const ready = sanitizeRhythmsForPersist(nextRhythms)

    if (ready.length === 0) {
      if (nextRhythms.length === 0) {
        setRhythmsError('Add at least one event.')
      }
      return
    }

    const areaIds = new Set(
      servingAreasRef.current.map((row) => row.id).filter((areaId) => areaId != null),
    )
    const message = validateRhythmsLocal(ready, areaIds)

    if (message) {
      setRhythmsError(message)
      return
    }

    if (servingAreasRef.current.some((row) => row.id == null)) {
      setRhythmsError('Finish connecting serving areas before editing events and staffing.')
      return
    }

    setRhythmsSaving(true)

    try {
      const updated = await putAdminScheduleRhythms(scheduleId, buildRhythmsPutPayload(ready))
      const fromServer = (updated.rhythms ?? []).map(rhythmFromDetail)
      const merged = [...fromServer, ...drafts]
      rhythmsRef.current = merged
      setRhythms(merged)
      if (updated.servingAreas) {
        setServingAreas(servingAreasFromDetail(updated.servingAreas))
      }
      setToastMessage('Saved.')
    } catch (err) {
      setRhythmsError(err instanceof ApiError ? err.message : 'Unable to save events.')
    } finally {
      setRhythmsSaving(false)
    }
  }

  function commitRhythms(nextRhythms) {
    rhythmsRef.current = nextRhythms
    setRhythms(nextRhythms)
    rhythmsSaveChain.current = rhythmsSaveChain.current
      .catch(() => {})
      .then(() => persistRhythms(nextRhythms))
  }

  function addLinkedArea() {
    setAreasError('')
    const areaId = Number(addAreaId)

    if (!Number.isInteger(areaId) || areaId < 1) {
      setAreasError('Choose a serving area to add.')
      return
    }

    const option = addableLinkedAreas.find((row) => row.servingAreaId === areaId)

    if (!option) {
      return
    }

    commitServingAreas([
      ...servingAreasRef.current,
      {
        id: null,
        servingAreaId: areaId,
        customName: null,
        displayName: option.displayName,
      },
    ])
    setAddAreaId('')
  }

  function addCustomArea() {
    setAreasError('')
    const trimmed = customAreaName.trim()

    if (!trimmed) {
      setAreasError('Enter a custom serving area name.')
      return
    }

    const duplicate = servingAreasRef.current.some(
      (row) => row.customName?.trim().toLowerCase() === trimmed.toLowerCase(),
    )

    if (duplicate) {
      setAreasError('That custom serving area is already connected.')
      return
    }

    commitServingAreas([
      ...servingAreasRef.current,
      {
        id: null,
        servingAreaId: null,
        customName: trimmed,
        displayName: trimmed,
      },
    ])
    setCustomAreaName('')
  }

  function removeServingArea(row) {
    setAreasError('')

    if (row.id != null && isServingAreaUsedInRhythms(row.id, rhythmsRef.current)) {
      setAreasError(
        `Cannot remove “${row.displayName}” while it is used in staffing. Remove those staffing rows first.`,
      )
      return
    }

    commitServingAreas(servingAreasRef.current.filter((item) => item !== row))
  }

  function updateRhythmLocal(clientId, patch) {
    const next = rhythmsRef.current.map((rhythm) =>
      rhythm.clientId === clientId ? { ...rhythm, ...patch } : rhythm,
    )
    rhythmsRef.current = next
    setRhythms(next)
  }

  function commitRhythmPatch(clientId, patch) {
    commitRhythms(
      rhythmsRef.current.map((rhythm) =>
        rhythm.clientId === clientId ? { ...rhythm, ...patch } : rhythm,
      ),
    )
  }

  function confirmRemoveRhythm(rhythm) {
    if (rhythm.requirements.length > 0) {
      setRhythmDeleteTarget(rhythm)
      return
    }

    commitRhythms(rhythmsRef.current.filter((row) => row.clientId !== rhythm.clientId))
  }

  function addStaffingRow(rhythmClientId) {
    setRhythmsError('')
    const next = rhythmsRef.current.map((rhythm) => {
      if (rhythm.clientId !== rhythmClientId) {
        return rhythm
      }

      return {
        ...rhythm,
        requirements: [...rhythm.requirements, emptyStaffingRow()],
      }
    })
    rhythmsRef.current = next
    setRhythms(next)
  }

  function commitStaffingRow(rhythmClientId, reqClientId, patch) {
    commitRhythms(
      rhythmsRef.current.map((rhythm) => {
        if (rhythm.clientId !== rhythmClientId) {
          return rhythm
        }

        return {
          ...rhythm,
          requirements: rhythm.requirements.map((row) =>
            row.clientId === reqClientId ? { ...row, ...patch } : row,
          ),
        }
      }),
    )
  }

  function updateStaffingRowLocal(rhythmClientId, reqClientId, patch) {
    const next = rhythmsRef.current.map((rhythm) => {
      if (rhythm.clientId !== rhythmClientId) {
        return rhythm
      }

      return {
        ...rhythm,
        requirements: rhythm.requirements.map((row) =>
          row.clientId === reqClientId ? { ...row, ...patch } : row,
        ),
      }
    })
    rhythmsRef.current = next
    setRhythms(next)
  }

  function removeStaffingRow(rhythmClientId, reqClientId) {
    commitRhythms(
      rhythmsRef.current.map((rhythm) => {
        if (rhythm.clientId !== rhythmClientId) {
          return rhythm
        }

        return {
          ...rhythm,
          requirements: rhythm.requirements.filter((row) => row.clientId !== reqClientId),
        }
      }),
    )
  }

  async function confirmDeleteSchedule() {
    setDeleteError('')
    setDeleting(true)

    try {
      await deleteAdminSchedule(scheduleId)
      navigate(listPath, { replace: true, state: { templateDeleted: true } })
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Unable to delete template.')
    } finally {
      setDeleting(false)
    }
  }

  async function confirmDuplicateSchedule(newName) {
    setDuplicateError('')
    setDuplicating(true)

    try {
      const created = await duplicateAdminSchedule(scheduleId, { name: newName })
      setDuplicateOpen(false)
      navigate(adminScheduleDetailPath(organizationSlug, created.id), {
        state: { templateDuplicated: true },
      })
    } catch (err) {
      setDuplicateError(err instanceof ApiError ? err.message : 'Unable to duplicate template.')
    } finally {
      setDuplicating(false)
    }
  }

  const staffingAreaOptions = servingAreas.filter((row) => row.id != null)

  return (
    <AdminLayout>
      <p className="admin-back-link">
        <Link to={listPath}>← Schedules</Link>
      </p>

      {loading ? <p className="admin-loading">Loading…</p> : null}
      {loadError ? <p className="admin-error">{loadError}</p> : null}

      {!loading && !loadError ? (
        <>
          <header className="admin-page-header admin-page-header--stacked-actions">
            <div>
              <p className="admin-schedule-template-eyebrow admin-muted">Schedule template</p>
              <h1 className="admin-page-title">{name.trim() || 'Untitled template'}</h1>
              <p className="admin-page-subtitle admin-muted">
                {labelScheduleType(scheduleType)} · Reusable pattern for generating volunteer
                schedules
              </p>
            </div>
            <div className="admin-page-header__actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() =>
                  navigate(adminSchedulesPath(organizationSlug), {
                    state: { createGeneratedFromTemplateId: scheduleId },
                  })
                }
              >
                Create schedule from template
              </button>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => {
                  setDuplicateError('')
                  setDuplicateOpen(true)
                }}
              >
                Duplicate
              </button>
              <button
                type="button"
                className="admin-danger-button"
                onClick={() => {
                  setDeleteError('')
                  setDeleteOpen(true)
                }}
              >
                Delete template
              </button>
            </div>
          </header>

          <section className="admin-schedule-detail-section">
            <div className="admin-schedule-detail-section__title-row">
              <h2 className="admin-schedule-detail-section__title">Template details</h2>
              {nameSaving ? (
                <span className="admin-schedule-detail-autosave admin-muted">Saving…</span>
              ) : null}
            </div>
            <div className="admin-schedule-detail-section__body">
              <label className="admin-label" htmlFor="schedule-detail-name">
                Template name
              </label>
              <input
                id="schedule-detail-name"
                className="admin-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => queuePersistBasics(name, scheduleTypeRef.current)}
              />
              <label className="admin-label" htmlFor="schedule-detail-type">
                Template type
              </label>
              <select
                id="schedule-detail-type"
                className="admin-input admin-input--select"
                value={scheduleType}
                onChange={(event) => {
                  const nextType = event.target.value
                  setScheduleType(nextType)
                  scheduleTypeRef.current = nextType
                  queuePersistBasics(name, nextType)
                }}
              >
                {scheduleTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="admin-help">
                Monthly templates generate schedules by calendar month. Special event templates use
                a custom start and end date when you create a schedule. Changes save automatically.
              </p>
              {nameError ? <p className="admin-error">{nameError}</p> : null}
            </div>
          </section>

          <section className="admin-schedule-detail-section">
            <div className="admin-schedule-detail-section__title-row">
              <h2 className="admin-schedule-detail-section__title">Connected serving areas</h2>
              {areasSaving ? (
                <span className="admin-schedule-detail-autosave admin-muted">Saving…</span>
              ) : null}
            </div>
            <div className="admin-schedule-detail-section__body">
              {servingAreas.length === 0 ? (
                <p className="admin-muted">No serving areas connected yet.</p>
              ) : (
                <ul className="admin-schedule-detail-area-list">
                  {servingAreas.map((row) => (
                    <li key={`${row.id ?? 'new'}-${row.servingAreaId ?? row.customName}`}>
                      <span className="admin-schedule-detail-area-list__entry">
                        <span className="admin-schedule-detail-area-list__label">
                          {row.displayName}
                          {row.customName ? (
                            <span className="admin-muted"> (custom)</span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          className="admin-dismiss-x"
                          aria-label={`Remove ${row.displayName}`}
                          disabled={areasSaving}
                          onClick={() => removeServingArea(row)}
                        >
                          <svg
                            className="admin-dismiss-x__icon"
                            viewBox="0 0 12 12"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path
                              d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="admin-schedule-detail-add-row">
                <label className="admin-label" htmlFor="schedule-add-linked-area">
                  Add from forms
                </label>
                <div className="admin-schedule-detail-add-controls">
                  <select
                    id="schedule-add-linked-area"
                    className="admin-input"
                    value={addAreaId}
                    onChange={(event) => setAddAreaId(event.target.value)}
                  >
                    <option value="">Select serving area…</option>
                    {addableLinkedAreas.map((row) => (
                      <option key={row.servingAreaId} value={row.servingAreaId}>
                        {row.displayName} ({row.formName})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    disabled={areasSaving}
                    onClick={addLinkedArea}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="admin-schedule-detail-add-row">
                <label className="admin-label" htmlFor="schedule-add-custom-area">
                  Add custom serving area
                </label>
                <div className="admin-schedule-detail-add-controls">
                  <input
                    id="schedule-add-custom-area"
                    className="admin-input"
                    value={customAreaName}
                    onChange={(event) => setCustomAreaName(event.target.value)}
                    placeholder="Custom name"
                  />
                  <button
                    type="button"
                    className="admin-secondary-button"
                    disabled={areasSaving}
                    onClick={addCustomArea}
                  >
                    Add
                  </button>
                </div>
              </div>

              {areasError ? <p className="admin-error">{areasError}</p> : null}
            </div>
          </section>

          <section className="admin-schedule-detail-section">
            <div className="admin-schedule-detail-section__title-row">
              <h2 className="admin-schedule-detail-section__title">Events & staffing</h2>
              {rhythmsSaving ? (
                <span className="admin-schedule-detail-autosave admin-muted">Saving…</span>
              ) : null}
            </div>
            <div className="admin-schedule-detail-section__body">
              <ul className="admin-schedule-detail-rhythm-list">
                {rhythms.map((rhythm) => (
                  <li key={rhythm.clientId} className="admin-schedule-detail-rhythm">
                    <div className="admin-schedule-wizard__rhythm-row">
                      <div className="admin-field">
                        <label className="admin-label">Event name</label>
                        <input
                          className="admin-input"
                          value={rhythm.name}
                          onChange={(event) =>
                            updateRhythmLocal(rhythm.clientId, { name: event.target.value })
                          }
                          onBlur={() => commitRhythms(rhythmsRef.current)}
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Day</label>
                        <select
                          className="admin-input"
                          value={rhythm.dayOfWeek}
                          onChange={(event) =>
                            commitRhythmPatch(rhythm.clientId, { dayOfWeek: event.target.value })
                          }
                        >
                          {dayOfWeekOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Start time</label>
                        <input
                          type="time"
                          className="admin-input"
                          value={rhythm.startTime}
                          onChange={(event) =>
                            updateRhythmLocal(rhythm.clientId, { startTime: event.target.value })
                          }
                          onBlur={() => commitRhythms(rhythmsRef.current)}
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
                            disabled={rhythmsSaving}
                            onClick={() => confirmRemoveRhythm(rhythm)}
                          >
                            Remove event
                          </button>
                        </div>
                      </div>
                    </div>

                    <h3 className="admin-schedule-wizard__staff-title">
                      Staffing — {labelDayOfWeek(rhythm.dayOfWeek)}{' '}
                      {formatScheduleTime(rhythm.startTime)}
                    </h3>
                    <ul className="admin-schedule-wizard__req-list">
                      {rhythm.requirements.map((row) => {
                        const assignedAreaIds = rhythm.requirements.map(
                          (requirement) => requirement.scheduleServingAreaId,
                        )
                        const rowAreaOptions = optionsExcludingValuesUsedElsewhere(
                          staffingAreaOptions,
                          assignedAreaIds,
                          row.scheduleServingAreaId,
                          (area) => area.id,
                        )

                        return (
                          <li key={row.clientId} className="admin-schedule-wizard__req-row">
                            <div className="admin-field">
                              <label className="admin-label">Serving area</label>
                              <select
                                className="admin-input"
                                value={row.scheduleServingAreaId}
                                onChange={(event) =>
                                  commitStaffingRow(rhythm.clientId, row.clientId, {
                                    scheduleServingAreaId: event.target.value,
                                  })
                                }
                              >
                                <option value="">Select…</option>
                                {rowAreaOptions.map((area) => (
                                  <option key={area.id} value={area.id}>
                                    {area.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="admin-field admin-schedule-wizard__count-field">
                              <label className="admin-label">Needed</label>
                              <input
                                className="admin-input"
                                inputMode="numeric"
                                value={row.neededCount}
                                onChange={(event) =>
                                  updateStaffingRowLocal(rhythm.clientId, row.clientId, {
                                    neededCount: event.target.value,
                                  })
                                }
                                onBlur={(event) =>
                                  commitStaffingRow(rhythm.clientId, row.clientId, {
                                    neededCount: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="admin-field admin-schedule-detail-row-action">
                              <span
                                className="admin-label admin-label--invisible"
                                aria-hidden="true"
                              >
                                Remove
                              </span>
                              <div className="admin-schedule-detail-row-action__button-wrap">
                                <button
                                  type="button"
                                  className="admin-danger-button admin-danger-button--compact"
                                  disabled={rhythmsSaving}
                                  onClick={() => removeStaffingRow(rhythm.clientId, row.clientId)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                    {(() => {
                      const canAddStaffingRow =
                        staffingAreaOptions.length > 0 &&
                        hasUnassignedOptions(
                          staffingAreaOptions,
                          rhythm.requirements.map(
                            (requirement) => requirement.scheduleServingAreaId,
                          ),
                          (area) => area.id,
                        )

                      return (
                        <>
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => addStaffingRow(rhythm.clientId)}
                            disabled={!canAddStaffingRow}
                          >
                            Add staffing row
                          </button>
                          {staffingAreaOptions.length === 0 ? (
                            <p className="admin-help">
                              Connect a serving area above to assign staffing needs.
                            </p>
                          ) : null}
                          {staffingAreaOptions.length > 0 && !canAddStaffingRow ? (
                            <p className="admin-help">
                              Every connected serving area is already on this event.
                            </p>
                          ) : null}
                        </>
                      )
                    })()}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => {
                  const next = [...rhythmsRef.current, emptyRhythm()]
                  rhythmsRef.current = next
                  setRhythms(next)
                }}
              >
                Add event
              </button>

              {rhythmsError ? <p className="admin-error">{rhythmsError}</p> : null}
            </div>
          </section>
        </>
      ) : null}

      {rhythmDeleteTarget ? (
        <div className="admin-dialog-backdrop" role="presentation">
          <div className="admin-dialog" role="alertdialog" aria-modal="true">
            <h2 className="admin-dialog__title">Remove this event?</h2>
            <div className="admin-dialog__body">
              <p>
                “{rhythmDeleteTarget.name || 'Untitled'}” has staffing requirements. Removing it
                will also delete those staffing needs.
              </p>
            </div>
            <div className="admin-dialog__actions">
              <button
                type="button"
                className="admin-danger-button"
                onClick={() => {
                  commitRhythms(
                    rhythmsRef.current.filter(
                      (row) => row.clientId !== rhythmDeleteTarget.clientId,
                    ),
                  )
                  setRhythmDeleteTarget(null)
                }}
              >
                Delete event
              </button>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setRhythmDeleteTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <DeleteScheduleDialog
        open={deleteOpen}
        scheduleName={name}
        deleting={deleting}
        error={deleteError}
        variant="template"
        onConfirm={() => void confirmDeleteSchedule()}
        onCancel={() => setDeleteOpen(false)}
      />

      <DuplicateScheduleTemplateDialog
        open={duplicateOpen}
        sourceName={name}
        duplicating={duplicating}
        error={duplicateError}
        onConfirm={(newName) => void confirmDuplicateSchedule(newName)}
        onCancel={() => setDuplicateOpen(false)}
      />

      <AdminToast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </AdminLayout>
  )
}
