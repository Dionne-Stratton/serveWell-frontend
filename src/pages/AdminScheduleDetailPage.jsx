import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  deleteAdminSchedule,
  getAdminSchedule,
  getAdminScheduleServingAreaOptions,
  patchAdminSchedule,
  putAdminScheduleRhythms,
  putAdminScheduleServingAreas,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import AdminToast from '../components/admin/AdminToast'
import DeleteScheduleDialog from '../components/admin/DeleteScheduleDialog'
import {
  dayOfWeekOptions,
  formatScheduleTime,
  labelDayOfWeek,
  labelScheduleType,
} from '../constants/schedule'
import { adminSchedulesPath } from '../utils/organizationPaths'
import {
  buildRhythmsPutPayload,
  buildServingAreasPutPayload,
  emptyRhythm,
  emptyStaffingRow,
  isServingAreaUsedInRhythms,
  linkedAreasNotYetConnected,
  rhythmFromDetail,
  servingAreasFromDetail,
  validateRhythmsLocal,
  validateServingAreasLocal,
} from '../utils/scheduleEditUtils'
import { normalizeStartTime } from '../utils/scheduleEditValidation'
import '../styles/admin.css'

function applyDetailToState(detail, setters) {
  setters.setScheduleMeta({
    scheduleType: detail.scheduleType,
    updatedAt: detail.updatedAt,
  })
  setters.setName(detail.name ?? '')
  setters.setServingAreas(servingAreasFromDetail(detail.servingAreas))
  setters.setRhythms((detail.rhythms ?? []).map(rhythmFromDetail))
}

export default function AdminScheduleDetailPage() {
  const { organizationSlug, id: idParam } = useParams()
  const navigate = useNavigate()
  const scheduleId = Number(idParam)
  const listPath = adminSchedulesPath(organizationSlug)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [scheduleMeta, setScheduleMeta] = useState({ scheduleType: 'monthly', updatedAt: '' })
  const [name, setName] = useState('')
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

  const [toastMessage, setToastMessage] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [rhythmDeleteTarget, setRhythmDeleteTarget] = useState(null)

  const connectedAreaIds = useMemo(
    () => new Set(servingAreas.map((row) => row.id).filter((areaId) => areaId != null)),
    [servingAreas],
  )

  const addableLinkedAreas = useMemo(
    () => linkedAreasNotYetConnected(catalogForms, servingAreas),
    [catalogForms, servingAreas],
  )

  const loadAll = useCallback(async () => {
    if (!Number.isInteger(scheduleId) || scheduleId < 1) {
      setLoadError('Invalid schedule.')
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError('')

    try {
      const [detail, catalog] = await Promise.all([
        getAdminSchedule(scheduleId),
        getAdminScheduleServingAreaOptions(),
      ])

      setCatalogForms(Array.isArray(catalog?.forms) ? catalog.forms : [])
      applyDetailToState(detail, { setScheduleMeta, setName, setServingAreas, setRhythms })
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Unable to load schedule.')
    } finally {
      setLoading(false)
    }
  }, [scheduleId])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  function syncFromDetail(detail) {
    applyDetailToState(detail, { setScheduleMeta, setName, setServingAreas, setRhythms })
  }

  async function saveName() {
    setNameError('')
    const trimmed = name.trim()

    if (!trimmed) {
      setNameError('Schedule name is required.')
      return
    }

    setNameSaving(true)

    try {
      const updated = await patchAdminSchedule(scheduleId, { name: trimmed })
      syncFromDetail(updated)
      setToastMessage('Schedule name saved.')
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : 'Unable to save name.')
    } finally {
      setNameSaving(false)
    }
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

    setServingAreas((current) => [
      ...current,
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

    const duplicate = servingAreas.some(
      (row) => row.customName?.trim().toLowerCase() === trimmed.toLowerCase(),
    )

    if (duplicate) {
      setAreasError('That custom serving area is already connected.')
      return
    }

    setServingAreas((current) => [
      ...current,
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

    if (row.id != null && isServingAreaUsedInRhythms(row.id, rhythms)) {
      setAreasError(
        `Cannot remove “${row.displayName}” while it is used in staffing requirements. Remove those rows first or save events without them.`,
      )
      return
    }

    setServingAreas((current) => current.filter((item) => item !== row))
  }

  async function saveServingAreas() {
    setAreasError('')
    const message = validateServingAreasLocal(servingAreas)

    if (message) {
      setAreasError(message)
      return
    }

    setAreasSaving(true)

    try {
      const updated = await putAdminScheduleServingAreas(
        scheduleId,
        buildServingAreasPutPayload(servingAreas),
      )
      syncFromDetail(updated)
      setToastMessage('Connected serving areas saved.')
    } catch (err) {
      setAreasError(err instanceof ApiError ? err.message : 'Unable to save serving areas.')
    } finally {
      setAreasSaving(false)
    }
  }

  function updateRhythm(clientId, patch) {
    setRhythms((current) =>
      current.map((rhythm) => (rhythm.clientId === clientId ? { ...rhythm, ...patch } : rhythm)),
    )
  }

  function confirmRemoveRhythm(rhythm) {
    if (rhythm.requirements.length > 0) {
      setRhythmDeleteTarget(rhythm)
      return
    }

    setRhythms((current) => current.filter((row) => row.clientId !== rhythm.clientId))
  }

  function addStaffingRow(rhythmClientId) {
    setRhythmsError('')
    setRhythms((current) =>
      current.map((rhythm) => {
        if (rhythm.clientId !== rhythmClientId) {
          return rhythm
        }

        return {
          ...rhythm,
          requirements: [...rhythm.requirements, emptyStaffingRow()],
        }
      }),
    )
  }

  function updateStaffingRow(rhythmClientId, reqClientId, patch) {
    setRhythms((current) =>
      current.map((rhythm) => {
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

  function removeStaffingRow(rhythmClientId, reqClientId) {
    setRhythms((current) =>
      current.map((rhythm) => {
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

  async function saveRhythms() {
    setRhythmsError('')

    const normalizedRhythms = rhythms.map((rhythm) => {
      const startTime = normalizeStartTime(rhythm.startTime) ?? rhythm.startTime
      return { ...rhythm, startTime }
    })

    setRhythms(normalizedRhythms)

    const message = validateRhythmsLocal(normalizedRhythms, connectedAreaIds)

    if (message) {
      setRhythmsError(message)
      return
    }

    if (servingAreas.some((row) => row.id == null)) {
      setRhythmsError('Save connected serving areas before saving events and staffing.')
      return
    }

    setRhythmsSaving(true)

    try {
      const updated = await putAdminScheduleRhythms(
        scheduleId,
        buildRhythmsPutPayload(normalizedRhythms),
      )
      syncFromDetail(updated)
      setToastMessage('Events and staffing saved.')
    } catch (err) {
      setRhythmsError(err instanceof ApiError ? err.message : 'Unable to save events.')
    } finally {
      setRhythmsSaving(false)
    }
  }

  async function confirmDeleteSchedule() {
    setDeleteError('')
    setDeleting(true)

    try {
      await deleteAdminSchedule(scheduleId)
      navigate(listPath, { replace: true, state: { scheduleDeleted: true } })
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Unable to delete schedule.')
    } finally {
      setDeleting(false)
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
          <header className="admin-page-header">
            <div>
              <h1 className="admin-page-title">Schedule</h1>
              <p className="admin-page-subtitle admin-muted">
                {labelScheduleType(scheduleMeta.scheduleType)}
              </p>
            </div>
            <button
              type="button"
              className="admin-danger-button"
              onClick={() => {
                setDeleteError('')
                setDeleteOpen(true)
              }}
            >
              Delete schedule
            </button>
          </header>

          <section className="admin-schedule-detail-section">
            <h2 className="admin-schedule-detail-section__title">Schedule name</h2>
            <div className="admin-schedule-detail-section__body">
              <label className="admin-label" htmlFor="schedule-detail-name">
                Name
              </label>
              <input
                id="schedule-detail-name"
                className="admin-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {nameError ? <p className="admin-error">{nameError}</p> : null}
              <div className="admin-schedule-detail-section__actions">
                <button
                  type="button"
                  className="admin-button"
                  disabled={nameSaving}
                  onClick={() => void saveName()}
                >
                  {nameSaving ? 'Saving…' : 'Save name'}
                </button>
              </div>
            </div>
          </section>

          <section className="admin-schedule-detail-section">
            <h2 className="admin-schedule-detail-section__title">Connected serving areas</h2>
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
                  <button type="button" className="admin-secondary-button" onClick={addLinkedArea}>
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
                  <button type="button" className="admin-secondary-button" onClick={addCustomArea}>
                    Add
                  </button>
                </div>
              </div>

              {areasError ? <p className="admin-error">{areasError}</p> : null}
              <div className="admin-schedule-detail-section__actions">
                <button
                  type="button"
                  className="admin-button"
                  disabled={areasSaving}
                  onClick={() => void saveServingAreas()}
                >
                  {areasSaving ? 'Saving…' : 'Save serving areas'}
                </button>
              </div>
            </div>
          </section>

          <section className="admin-schedule-detail-section">
            <h2 className="admin-schedule-detail-section__title">Events & staffing</h2>
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
                            updateRhythm(rhythm.clientId, { name: event.target.value })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Day</label>
                        <select
                          className="admin-input"
                          value={rhythm.dayOfWeek}
                          onChange={(event) =>
                            updateRhythm(rhythm.clientId, { dayOfWeek: event.target.value })
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
                            updateRhythm(rhythm.clientId, { startTime: event.target.value })
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
                            onClick={() => confirmRemoveRhythm(rhythm)}
                          >
                            Remove event
                          </button>
                        </div>
                      </div>
                    </div>

                    <h3 className="admin-schedule-wizard__staff-title">
                      Staffing — {labelDayOfWeek(rhythm.dayOfWeek)} {formatScheduleTime(rhythm.startTime)}
                    </h3>
                    <ul className="admin-schedule-wizard__req-list">
                      {rhythm.requirements.map((row) => (
                        <li key={row.clientId} className="admin-schedule-wizard__req-row">
                          <div className="admin-field">
                            <label className="admin-label">Serving area</label>
                            <select
                              className="admin-input"
                              value={row.scheduleServingAreaId}
                              onChange={(event) =>
                                updateStaffingRow(rhythm.clientId, row.clientId, {
                                  scheduleServingAreaId: event.target.value,
                                })
                              }
                            >
                              <option value="">Select…</option>
                              {staffingAreaOptions.map((area) => (
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
                                updateStaffingRow(rhythm.clientId, row.clientId, {
                                  neededCount: event.target.value,
                                })
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
                                onClick={() => removeStaffingRow(rhythm.clientId, row.clientId)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => addStaffingRow(rhythm.clientId)}
                      disabled={staffingAreaOptions.length === 0}
                    >
                      Add staffing row
                    </button>
                    {staffingAreaOptions.length === 0 ? (
                      <p className="admin-help">
                        Save connected serving areas to assign staffing needs.
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setRhythms((current) => [...current, emptyRhythm()])}
              >
                Add event
              </button>

              {rhythmsError ? <p className="admin-error">{rhythmsError}</p> : null}
              <div className="admin-schedule-detail-section__actions">
                <button
                  type="button"
                  className="admin-button"
                  disabled={rhythmsSaving}
                  onClick={() => void saveRhythms()}
                >
                  {rhythmsSaving ? 'Saving…' : 'Save events & staffing'}
                </button>
              </div>
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
                will delete those needs when you save events.
              </p>
            </div>
            <div className="admin-dialog__actions">
              <button
                type="button"
                className="admin-danger-button"
                onClick={() => {
                  setRhythms((current) =>
                    current.filter((row) => row.clientId !== rhythmDeleteTarget.clientId),
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
        onConfirm={() => void confirmDeleteSchedule()}
        onCancel={() => setDeleteOpen(false)}
      />

      <AdminToast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </AdminLayout>
  )
}
