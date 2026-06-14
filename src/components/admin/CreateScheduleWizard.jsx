import { useEffect, useMemo, useState } from 'react'
import { ApiError, createAdminSchedule } from '../../api/client'
import { dayOfWeekOptions, formatScheduleTime, labelDayOfWeek, labelScheduleType, scheduleTypeOptions } from '../../constants/schedule'
import softBtn from '../../styles/adminSoftButtons.module.css'
import {
  applyRequirementAreaValue,
  areaOptionLabel,
  buildCreateSchedulePayload,
  connectedAreaOptions,
  emptyRequirement,
  emptyRhythm,
  requirementAreaValue,
  validateWizardStep,
} from '../../utils/scheduleWizardUtils'

const STEPS = [
  'Template basics',
  'Serving areas',
  'Events',
  'Staffing needs',
  'Review',
]

function initialState() {
  return {
    name: '',
    scheduleType: 'monthly',
    selectedServingAreaIds: new Set(),
    customAreaNames: [''],
    rhythms: [emptyRhythm()],
    collapsedFormIds: new Set(),
  }
}

function buildAreaSelectOptions(catalogForms, selectedIds, customNames) {
  const options = []

  for (const form of catalogForms ?? []) {
    for (const area of form.servingAreas ?? []) {
      if (selectedIds.has(area.id)) {
        options.push({
          value: `id:${area.id}`,
          label: area.name,
        })
      }
    }
  }

  for (const name of customNames) {
    const trimmed = name.trim()
    if (trimmed) {
      options.push({
        value: `custom:${encodeURIComponent(trimmed)}`,
        label: `${trimmed} (custom)`,
      })
    }
  }

  return options
}

export default function CreateScheduleWizard({
  open,
  catalogForms,
  catalogLoading = false,
  catalogError = '',
  onClose,
  onSaved,
  onRetryCatalog,
}) {
  const [step, setStep] = useState(1)
  const [state, setState] = useState(initialState)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setStep(1)
    setState(initialState())
    setFieldErrors({})
    setSubmitError('')
  }, [open])

  const nameByServingAreaId = useMemo(() => {
    const map = new Map()
    for (const form of catalogForms ?? []) {
      for (const area of form.servingAreas ?? []) {
        map.set(area.id, area.name)
      }
    }
    return map
  }, [catalogForms])

  const areaSelectOptions = useMemo(
    () =>
      buildAreaSelectOptions(
        catalogForms,
        state.selectedServingAreaIds,
        state.customAreaNames,
      ),
    [catalogForms, state.selectedServingAreaIds, state.customAreaNames],
  )

  if (!open) {
    return null
  }

  function updateState(patch) {
    setState((current) => ({ ...current, ...patch }))
    setFieldErrors({})
    setSubmitError('')
  }

  function toggleFormCollapse(formId) {
    setState((current) => {
      const next = new Set(current.collapsedFormIds)
      if (next.has(formId)) {
        next.delete(formId)
      } else {
        next.add(formId)
      }
      return { ...current, collapsedFormIds: next }
    })
  }

  function toggleServingArea(areaId, checked) {
    setState((current) => {
      const next = new Set(current.selectedServingAreaIds)
      if (checked) {
        next.add(areaId)
      } else {
        next.delete(areaId)
      }
      return { ...current, selectedServingAreaIds: next }
    })
    setFieldErrors({})
  }

  function toggleFormAreas(form, checked) {
    setState((current) => {
      const next = new Set(current.selectedServingAreaIds)
      for (const area of form.servingAreas ?? []) {
        if (checked) {
          next.add(area.id)
        } else {
          next.delete(area.id)
        }
      }
      return { ...current, selectedServingAreaIds: next }
    })
    setFieldErrors({})
  }

  function formSelectionState(form) {
    const areas = form.servingAreas ?? []
    if (areas.length === 0) {
      return { checked: false, indeterminate: false }
    }

    let selectedCount = 0
    for (const area of areas) {
      if (state.selectedServingAreaIds.has(area.id)) {
        selectedCount += 1
      }
    }

    return {
      checked: selectedCount === areas.length,
      indeterminate: selectedCount > 0 && selectedCount < areas.length,
    }
  }

  function goNext() {
    const errors = validateWizardStep(step, state)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setStep((current) => Math.min(current + 1, STEPS.length))
  }

  function goBack() {
    setFieldErrors({})
    setStep((current) => Math.max(current - 1, 1))
  }

  async function handleSave() {
    const errors = validateWizardStep(4, state)
    if (!state.name.trim()) {
      errors.name = 'Template name is required.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setStep(4)
      return
    }

    const payload = buildCreateSchedulePayload(state, catalogForms)
    setSaving(true)
    setSubmitError('')

    try {
      const created = await createAdminSchedule({
        name: payload.name,
        scheduleType: payload.scheduleType,
        servingAreas: payload.servingAreas,
        rhythms: payload.rhythms,
      })
      onSaved(created)
      onClose()
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Unable to save this template.',
      )
      setStep(5)
    } finally {
      setSaving(false)
    }
  }

  function renderStep() {
    if (step === 1) {
      return (
        <div className="admin-schedule-wizard__step">
          <div className="admin-field">
            <label className="admin-label" htmlFor="schedule-wizard-name">
              Template name
            </label>
            <input
              id="schedule-wizard-name"
              className="admin-input"
              value={state.name}
              onChange={(event) => updateState({ name: event.target.value })}
            />
            {fieldErrors.name ? <p className="admin-error-inline">{fieldErrors.name}</p> : null}
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="schedule-wizard-type">
              Template type
            </label>
            <select
              id="schedule-wizard-type"
              className="admin-input admin-input--select"
              value={state.scheduleType}
              onChange={(event) => updateState({ scheduleType: event.target.value })}
            >
              {scheduleTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="admin-schedule-wizard__step">
          <p className="admin-help">
            Choose serving areas from your forms, or add custom names for areas not on a form yet.
          </p>
          {catalogLoading ? <p className="admin-muted">Loading serving areas from your forms…</p> : null}
          {catalogError ? (
            <p className="admin-error-inline">
              {catalogError}{' '}
              {onRetryCatalog ? (
                <button type="button" className="admin-link-button" onClick={onRetryCatalog}>
                  Try again
                </button>
              ) : null}
            </p>
          ) : null}
          {fieldErrors.servingAreas ? (
            <p className="admin-error-inline">{fieldErrors.servingAreas}</p>
          ) : null}
          <div className="admin-schedule-wizard__form-groups">
            {(catalogForms ?? []).map((form) => {
              const collapsed = state.collapsedFormIds.has(form.id)
              const { checked, indeterminate } = formSelectionState(form)

              return (
                <div key={form.id} className="admin-schedule-wizard__form-group">
                  <div className="admin-schedule-wizard__form-head">
                    <label className="admin-choice admin-choice--inline">
                      <input
                        type="checkbox"
                        checked={checked}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = indeterminate
                          }
                        }}
                        onChange={(event) => toggleFormAreas(form, event.target.checked)}
                      />
                      <span>{form.name}</span>
                    </label>
                    <button
                      type="button"
                      className="admin-link-button admin-schedule-wizard__toggle"
                      onClick={() => toggleFormCollapse(form.id)}
                    >
                      {collapsed ? 'Show areas' : 'Hide areas'}
                    </button>
                  </div>
                  {!collapsed ? (
                    <ul className="admin-schedule-wizard__area-list">
                      {(form.servingAreas ?? []).map((area) => (
                        <li key={area.id}>
                          <label className="admin-choice admin-choice--inline">
                            <input
                              type="checkbox"
                              checked={state.selectedServingAreaIds.has(area.id)}
                              onChange={(event) =>
                                toggleServingArea(area.id, event.target.checked)
                              }
                            />
                            <span>{area.name}</span>
                          </label>
                        </li>
                      ))}
                      {(form.servingAreas ?? []).length === 0 ? (
                        <li className="admin-muted">No active serving areas on this form.</li>
                      ) : null}
                    </ul>
                  ) : null}
                </div>
              )
            })}
          </div>
          <div className="admin-field">
            <span className="admin-label">Custom serving areas</span>
            {state.customAreaNames.map((name, index) => (
              <div key={`custom-${index}`} className="admin-schedule-wizard__custom-row">
                <input
                  className="admin-input"
                  value={name}
                  placeholder="Custom area name"
                  onChange={(event) => {
                    const next = [...state.customAreaNames]
                    next[index] = event.target.value
                    updateState({ customAreaNames: next })
                  }}
                />
                {state.customAreaNames.length > 1 ? (
                  <button
                    type="button"
                    className="admin-danger-button admin-danger-button--compact"
                    onClick={() => {
                      const next = state.customAreaNames.filter((_, i) => i !== index)
                      updateState({ customAreaNames: next.length ? next : [''] })
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              className="admin-link-button"
              onClick={() => updateState({ customAreaNames: [...state.customAreaNames, ''] })}
            >
              Add custom area
            </button>
            <p className="admin-help">
              Custom serving areas can be scheduled manually, but suggestions work best after the
              area is added to a form and volunteers have signed up for it.
            </p>
          </div>
        </div>
      )
    }

    if (step === 3) {
      return (
        <div className="admin-schedule-wizard__step">
          <p className="admin-help">Add each event for this template (one-off or recurring).</p>
          {fieldErrors.rhythms ? <p className="admin-error-inline">{fieldErrors.rhythms}</p> : null}
          <ul className="admin-schedule-wizard__rhythm-list">
            {state.rhythms.map((rhythm, index) => (
              <li key={rhythm.clientId} className="admin-schedule-wizard__rhythm-card">
                <div className="admin-field">
                  <label className="admin-label" htmlFor={`rhythm-name-${index}`}>
                    Event name
                  </label>
                  <input
                    id={`rhythm-name-${index}`}
                    className="admin-input"
                    placeholder="Sunday Morning"
                    value={rhythm.name}
                    onChange={(event) => {
                      const rhythms = state.rhythms.map((row, i) =>
                        i === index ? { ...row, name: event.target.value } : row,
                      )
                      updateState({ rhythms })
                    }}
                  />
                  {fieldErrors[`rhythm-${index}-name`] ? (
                    <p className="admin-error-inline">{fieldErrors[`rhythm-${index}-name`]}</p>
                  ) : null}
                </div>
                <div className="admin-schedule-wizard__rhythm-row">
                  <div className="admin-field">
                    <label className="admin-label" htmlFor={`rhythm-day-${index}`}>
                      Day
                    </label>
                    <select
                      id={`rhythm-day-${index}`}
                      className="admin-input admin-input--select"
                      value={rhythm.dayOfWeek}
                      onChange={(event) => {
                        const rhythms = state.rhythms.map((row, i) =>
                          i === index ? { ...row, dayOfWeek: event.target.value } : row,
                        )
                        updateState({ rhythms })
                      }}
                    >
                      {dayOfWeekOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label className="admin-label" htmlFor={`rhythm-time-${index}`}>
                      Start time
                    </label>
                    <input
                      id={`rhythm-time-${index}`}
                      type="time"
                      className="admin-input"
                      value={rhythm.startTime}
                      onChange={(event) => {
                        const rhythms = state.rhythms.map((row, i) =>
                          i === index ? { ...row, startTime: event.target.value } : row,
                        )
                        updateState({ rhythms })
                      }}
                    />
                  </div>
                </div>
                {state.rhythms.length > 1 ? (
                  <button
                    type="button"
                    className="admin-danger-button admin-danger-button--compact"
                    onClick={() =>
                      updateState({
                        rhythms: state.rhythms.filter((_, i) => i !== index),
                      })
                    }
                  >
                    Remove event
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={`admin-button--inline ${softBtn.softBtn}`}
            onClick={() => updateState({ rhythms: [...state.rhythms, emptyRhythm()] })}
          >
            Add event
          </button>
        </div>
      )
    }

    if (step === 4) {
      return (
        <div className="admin-schedule-wizard__step">
          <p className="admin-help">
            For each event, add how many volunteers you need in each connected area.
          </p>
          {state.rhythms.map((rhythm, rhythmIndex) => (
            <section key={rhythm.clientId} className="admin-schedule-wizard__staff-section">
              <h3 className="admin-schedule-wizard__staff-title">
                {rhythm.name.trim() || 'Unnamed event'} — {labelDayOfWeek(rhythm.dayOfWeek)},{' '}
                {formatScheduleTime(rhythm.startTime)}
              </h3>
              <ul className="admin-schedule-wizard__req-list">
                {rhythm.requirements.map((row, rowIndex) => (
                  <li key={row.clientId} className="admin-schedule-wizard__req-row">
                    <div className="admin-field">
                      <label className="admin-label" htmlFor={`req-area-${rhythmIndex}-${rowIndex}`}>
                        Serving area
                      </label>
                      <select
                        id={`req-area-${rhythmIndex}-${rowIndex}`}
                        className="admin-input admin-input--select"
                        value={requirementAreaValue(row)}
                        onChange={(event) => {
                          const rhythms = state.rhythms.map((r, i) => {
                            if (i !== rhythmIndex) {
                              return r
                            }

                            return {
                              ...r,
                              requirements: r.requirements.map((req, j) =>
                                j === rowIndex
                                  ? applyRequirementAreaValue(req, event.target.value)
                                  : req,
                              ),
                            }
                          })
                          updateState({ rhythms })
                        }}
                      >
                        <option value="">Select…</option>
                        {areaSelectOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors[`req-${rhythmIndex}-${rowIndex}-area`] ? (
                        <p className="admin-error-inline">
                          {fieldErrors[`req-${rhythmIndex}-${rowIndex}-area`]}
                        </p>
                      ) : null}
                    </div>
                    <div className="admin-field admin-schedule-wizard__count-field">
                      <label className="admin-label" htmlFor={`req-count-${rhythmIndex}-${rowIndex}`}>
                        Needed
                      </label>
                      <input
                        id={`req-count-${rhythmIndex}-${rowIndex}`}
                        type="number"
                        min={1}
                        step={1}
                        className="admin-input"
                        value={row.neededCount}
                        onChange={(event) => {
                          const rhythms = state.rhythms.map((r, i) => {
                            if (i !== rhythmIndex) {
                              return r
                            }

                            return {
                              ...r,
                              requirements: r.requirements.map((req, j) =>
                                j === rowIndex ? { ...req, neededCount: event.target.value } : req,
                              ),
                            }
                          })
                          updateState({ rhythms })
                        }}
                      />
                      {fieldErrors[`req-${rhythmIndex}-${rowIndex}-count`] ? (
                        <p className="admin-error-inline">
                          {fieldErrors[`req-${rhythmIndex}-${rowIndex}-count`]}
                        </p>
                      ) : null}
                    </div>
                    <div className="admin-field admin-schedule-detail-row-action">
                      <span className="admin-label admin-label--invisible" aria-hidden="true">
                        Remove
                      </span>
                      <div className="admin-schedule-detail-row-action__button-wrap">
                        <button
                          type="button"
                          className="admin-danger-button admin-danger-button--compact"
                          onClick={() => {
                            const rhythms = state.rhythms.map((r, i) => {
                              if (i !== rhythmIndex) {
                                return r
                              }

                              return {
                                ...r,
                                requirements: r.requirements.filter((_, j) => j !== rowIndex),
                              }
                            })
                            updateState({ rhythms })
                          }}
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
                className="admin-link-button"
                onClick={() => {
                  const rhythms = state.rhythms.map((r, i) =>
                    i === rhythmIndex
                      ? { ...r, requirements: [...r.requirements, emptyRequirement()] }
                      : r,
                  )
                  updateState({ rhythms })
                }}
              >
                Add staffing row
              </button>
            </section>
          ))}
        </div>
      )
    }

    const payload = buildCreateSchedulePayload(state, catalogForms)
    const connected = connectedAreaOptions(
      state.selectedServingAreaIds,
      state.customAreaNames.filter((name) => name.trim()),
    )

    return (
      <div className="admin-schedule-wizard__step">
        <dl className="admin-dl admin-dl--compact">
          <div>
            <dt>Name</dt>
            <dd>{payload.name || '—'}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{labelScheduleType(state.scheduleType)}</dd>
          </div>
          <div>
            <dt>Serving areas</dt>
            <dd>
              {connected.length
                ? connected
                    .map((option) => areaOptionLabel(option, nameByServingAreaId))
                    .join(', ')
                : '—'}
            </dd>
          </div>
        </dl>
        {payload.rhythms.map((rhythm, index) => (
          <section key={state.rhythms[index]?.clientId ?? index} className="admin-schedule-wizard__review-rhythm">
            <h3 className="admin-schedule-wizard__staff-title">
              {rhythm.name} — {labelDayOfWeek(rhythm.dayOfWeek)}, {formatScheduleTime(rhythm.startTime)}
            </h3>
            {rhythm.requirements.length ? (
              <ul className="admin-schedule-wizard__review-reqs">
                {rhythm.requirements.map((req, reqIndex) => {
                  const label = req.servingAreaId
                    ? nameByServingAreaId.get(req.servingAreaId) ?? `Area #${req.servingAreaId}`
                    : req.customName
                  return (
                    <li key={reqIndex}>
                      {label}: {req.neededCount} needed
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="admin-muted">No staffing rows added.</p>
            )}
          </section>
        ))}
        {submitError ? <p className="admin-error">{submitError}</p> : null}
      </div>
    )
  }

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <div
        className="admin-dialog admin-dialog--schedule-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-schedule-wizard-title"
      >
        <h2 id="create-schedule-wizard-title" className="admin-dialog__title">
          Create schedule template
        </h2>
        <ol className="admin-schedule-wizard__steps" aria-label="Wizard progress">
          {STEPS.map((label, index) => {
            const stepNumber = index + 1
            const active = step === stepNumber
            const complete = step > stepNumber
            return (
              <li
                key={label}
                className={[
                  'admin-schedule-wizard__step-marker',
                  active ? 'admin-schedule-wizard__step-marker--active' : '',
                  complete ? 'admin-schedule-wizard__step-marker--complete' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="admin-schedule-wizard__step-number">{stepNumber}</span>
                <span className="admin-schedule-wizard__step-label">{label}</span>
              </li>
            )
          })}
        </ol>
        <div className="admin-dialog__body admin-schedule-wizard__body">{renderStep()}</div>
        <div className="admin-dialog__actions admin-schedule-wizard__actions">
          <button type="button" className={softBtn.softBtn} disabled={saving} onClick={onClose}>
            Cancel
          </button>
          {step > 1 ? (
            <button type="button" className={softBtn.softBtn} disabled={saving} onClick={goBack}>
              Back
            </button>
          ) : null}
          {step < STEPS.length ? (
            <button type="button" className="admin-button" onClick={goNext}>
              Next
            </button>
          ) : (
            <button
              type="button"
              className={`admin-button${saving ? ' admin-button--busy' : ''}`}
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : 'Save template'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
