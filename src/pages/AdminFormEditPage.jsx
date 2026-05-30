import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  createAdminFormSection,
  createAdminRequirement,
  createAdminServingArea,
  deleteAdminFormSection,
  deleteAdminRequirement,
  deleteAdminServingArea,
  getAdminFormDetail,
  getAdminForms,
  patchAdminForm,
  patchAdminFormSection,
  patchAdminRequirement,
  patchAdminServingArea,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import AdminAreaHideToggle from '../components/admin/AdminAreaHideToggle'
import UnsavedChangesDialog from '../components/admin/UnsavedChangesDialog'
import { organizationAdminFormsPath } from '../utils/organizationPaths'
import '../styles/admin.css'

const REQUIREMENT_TYPES = [
  { value: 'background_check', label: 'Background check' },
  { value: 'training', label: 'Training' },
  { value: 'availability', label: 'Availability' },
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'audition_or_interview', label: 'Audition / interview' },
  { value: 'custom', label: 'Custom' },
]

function cloneSections(sections) {
  return JSON.parse(JSON.stringify(sections ?? []))
}

const EMPTY_DELETES = {
  deletedSectionIds: [],
  deletedAreaIds: [],
  deletedRequirementIds: [],
}

function buildSnapshot(
  name,
  introText,
  successMessage,
  isActive,
  sections,
  deletes = EMPTY_DELETES,
) {
  return JSON.stringify({
    name,
    introText,
    successMessage,
    isActive,
    sections,
    deletedSectionIds: deletes.deletedSectionIds,
    deletedAreaIds: deletes.deletedAreaIds,
    deletedRequirementIds: deletes.deletedRequirementIds,
  })
}

function applySnapshot(snapshot, setters) {
  const data = JSON.parse(snapshot)
  setters.setName(data.name ?? '')
  setters.setIntroText(data.introText ?? '')
  setters.setSuccessMessage(data.successMessage ?? '')
  setters.setIsActive(data.isActive !== false)
  setters.setSections(cloneSections(data.sections))
  setters.setDeletedSectionIds(data.deletedSectionIds ?? [])
  setters.setDeletedAreaIds(data.deletedAreaIds ?? [])
  setters.setDeletedRequirementIds(data.deletedRequirementIds ?? [])
}

function deriveAreaFlagsFromRequirements(requirements) {
  const types = new Set((requirements ?? []).map((req) => req.type))
  return {
    requiresBackgroundCheck: types.has('background_check'),
    requiresTraining: types.has('training'),
    requiresAuditionOrInterview: types.has('audition_or_interview'),
  }
}

function isPersistedId(id) {
  return typeof id === 'number' && id > 0
}

function addRequirementToSections(sections, areaId, requirement) {
  return sections.map((section) => ({
    ...section,
    servingAreas: section.servingAreas.map((area) =>
      area.id === areaId
        ? {
            ...area,
            requirements: [...(area.requirements ?? []), requirement],
          }
        : area,
    ),
  }))
}

function removeRequirementFromSections(sections, requirementId) {
  return sections.map((section) => ({
    ...section,
    servingAreas: section.servingAreas.map((area) => ({
      ...area,
      requirements: (area.requirements ?? []).filter(
        (req) => req.id !== requirementId,
      ),
    })),
  }))
}

export default function AdminFormEditPage() {
  const { organizationSlug, formSlug } = useParams()
  const navigate = useNavigate()
  const formsListPath = organizationAdminFormsPath(organizationSlug)

  const [formId, setFormId] = useState(null)

  const [formMeta, setFormMeta] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [baseline, setBaseline] = useState(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  const [name, setName] = useState('')
  const [introText, setIntroText] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newAreaNames, setNewAreaNames] = useState({})
  const [newRequirementLabels, setNewRequirementLabels] = useState({})
  const [newRequirementTypes, setNewRequirementTypes] = useState({})

  const [deletedSectionIds, setDeletedSectionIds] = useState([])
  const [deletedAreaIds, setDeletedAreaIds] = useState([])
  const [deletedRequirementIds, setDeletedRequirementIds] = useState([])

  const nextTempIdRef = useRef(-1)

  function allocateTempId() {
    const id = nextTempIdRef.current
    nextTempIdRef.current -= 1
    return id
  }

  const pendingDeletes = useMemo(
    () => ({
      deletedSectionIds,
      deletedAreaIds,
      deletedRequirementIds,
    }),
    [deletedSectionIds, deletedAreaIds, deletedRequirementIds],
  )

  const snapshot = useMemo(
    () =>
      buildSnapshot(
        name,
        introText,
        successMessage,
        isActive,
        sections,
        pendingDeletes,
      ),
    [name, introText, successMessage, isActive, sections, pendingDeletes],
  )

  const isDirty = baseline !== null && snapshot !== baseline

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  const blockerRef = useRef(blocker)
  blockerRef.current = blocker

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setLeaveDialogOpen(true)
    }
  }, [blocker.state])

  useEffect(() => {
    if (!isDirty) {
      return undefined
    }

    function handleBeforeUnload(event) {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const loadForm = useCallback(async (options = {}) => {
    const { silent = false } = options

    if (!formSlug) {
      return
    }

    if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const listData = await getAdminForms()
      const summary = (listData.forms ?? []).find((form) => form.slug === formSlug)

      if (!summary) {
        setError('Form not found.')
        setFormMeta(null)
        setFormId(null)
        return
      }

      setFormId(summary.id)
      const data = await getAdminFormDetail(summary.id)
      const nextName = data.form.name ?? ''
      const nextIntro = data.form.introText ?? ''
      const nextSuccess = data.form.successMessage ?? ''
      const nextActive = data.form.isActive !== false
      const nextSections = cloneSections(data.sections)

      setFormMeta(data.form)
      setSections(nextSections)
      setName(nextName)
      setIntroText(nextIntro)
      setSuccessMessage(nextSuccess)
      setIsActive(nextActive)
      setDeletedSectionIds([])
      setDeletedAreaIds([])
      setDeletedRequirementIds([])
      setBaseline(
        buildSnapshot(
          nextName,
          nextIntro,
          nextSuccess,
          nextActive,
          nextSections,
          EMPTY_DELETES,
        ),
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load form.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [formSlug])

  useEffect(() => {
    loadForm()
  }, [loadForm])

  function updateSectionTitle(sectionId, title) {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, title } : section,
      ),
    )
  }

  function updateArea(sectionId, areaId, patch) {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) {
          return section
        }
        return {
          ...section,
          servingAreas: section.servingAreas.map((area) =>
            area.id === areaId ? { ...area, ...patch } : area,
          ),
        }
      }),
    )
  }

  function updateRequirement(sectionId, areaId, requirementId, patch) {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) {
          return section
        }
        return {
          ...section,
          servingAreas: section.servingAreas.map((area) => {
            if (area.id !== areaId) {
              return area
            }
            return {
              ...area,
              requirements: area.requirements.map((req) =>
                req.id === requirementId ? { ...req, ...patch } : req,
              ),
            }
          }),
        }
      }),
    )
  }

  async function persistChanges() {
    if (formId == null) {
      return
    }

    await patchAdminForm(formId, {
      name: name.trim(),
      introText: introText.trim() || null,
      successMessage: successMessage.trim() || null,
      isActive,
    })

    for (const requirementId of deletedRequirementIds) {
      await deleteAdminRequirement(requirementId)
    }

    for (const areaId of deletedAreaIds) {
      await deleteAdminServingArea(areaId)
    }

    for (const sectionId of deletedSectionIds) {
      await deleteAdminFormSection(sectionId)
    }

    const sectionIdMap = new Map()
    const areaIdMap = new Map()

    for (const section of sections) {
      if (!isPersistedId(section.id)) {
        const { section: created } = await createAdminFormSection(formId, {
          title: section.title.trim(),
        })
        sectionIdMap.set(section.id, created.id)
      }
    }

    for (const section of sections) {
      const resolvedSectionId = isPersistedId(section.id)
        ? section.id
        : sectionIdMap.get(section.id)

      for (const area of section.servingAreas) {
        if (!isPersistedId(area.id)) {
          const flags = deriveAreaFlagsFromRequirements(area.requirements)
          const { servingArea } = await createAdminServingArea(formId, {
            sectionId: resolvedSectionId,
            name: area.name.trim(),
            description: area.description?.trim() || null,
            publicNote: area.publicNote?.trim() || null,
            requiresBackgroundCheck: flags.requiresBackgroundCheck,
            requiresTraining: flags.requiresTraining,
            requiresAuditionOrInterview: flags.requiresAuditionOrInterview,
            isActive: area.isActive,
          })
          areaIdMap.set(area.id, servingArea.id)
        }
      }
    }

    for (const section of sections) {
      const sectionId = isPersistedId(section.id)
        ? section.id
        : sectionIdMap.get(section.id)

      if (isPersistedId(section.id)) {
        await patchAdminFormSection(sectionId, { title: section.title.trim() })
      }

      for (const area of section.servingAreas) {
        const areaId = isPersistedId(area.id) ? area.id : areaIdMap.get(area.id)
        const flags = deriveAreaFlagsFromRequirements(area.requirements)

        if (isPersistedId(area.id)) {
          await patchAdminServingArea(areaId, {
            name: area.name.trim(),
            description: area.description?.trim() || null,
            publicNote: area.publicNote?.trim() || null,
            requiresBackgroundCheck: flags.requiresBackgroundCheck,
            requiresTraining: flags.requiresTraining,
            requiresAuditionOrInterview: flags.requiresAuditionOrInterview,
            isActive: area.isActive,
          })
        }

        for (const req of area.requirements ?? []) {
          if (!isPersistedId(req.id)) {
            await createAdminRequirement(areaId, {
              requirementType: req.type,
              label: req.label.trim(),
              requiresConfirmation: req.requiresConfirmation !== false,
              isMandatory: req.isMandatory === true,
            })
          } else {
            await patchAdminRequirement(req.id, {
              label: req.label.trim(),
              requirementType: req.type,
              requiresConfirmation: req.requiresConfirmation,
              isMandatory: req.isMandatory,
            })
          }
        }
      }
    }
  }

  async function handleSaveChanges(event) {
    event?.preventDefault?.()
    setSaving(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      await persistChanges()
      await loadForm({ silent: true })
      setSaveSuccess('Changes saved.')
      return true
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : 'Unable to save changes.',
      )
      return false
    } finally {
      setSaving(false)
    }
  }

  function revertToBaseline() {
    if (!baseline) {
      return
    }
    applySnapshot(baseline, {
      setName,
      setIntroText,
      setSuccessMessage,
      setIsActive,
      setSections,
      setDeletedSectionIds,
      setDeletedAreaIds,
      setDeletedRequirementIds,
    })
    setSaveError('')
    setSaveSuccess('')
  }

  function closeLeaveDialog() {
    setLeaveDialogOpen(false)
    if (blockerRef.current.state === 'blocked') {
      blockerRef.current.reset()
    }
  }

  async function handleLeaveSave() {
    const ok = await handleSaveChanges()
    if (!ok) {
      return
    }
    setLeaveDialogOpen(false)
    if (blockerRef.current.state === 'blocked') {
      blockerRef.current.proceed()
    } else {
      navigate(formsListPath)
    }
  }

  function handleLeaveDiscard() {
    revertToBaseline()
    setLeaveDialogOpen(false)
    if (blockerRef.current.state === 'blocked') {
      blockerRef.current.proceed()
    } else {
      navigate(formsListPath)
    }
  }

  function requestLeave() {
    if (!isDirty) {
      navigate(formsListPath)
      return
    }
    setLeaveDialogOpen(true)
  }

  function handleCancel() {
    if (!isDirty) {
      navigate(formsListPath)
      return
    }
    setLeaveDialogOpen(true)
  }

  function handleAddSection(event) {
    event.preventDefault()
    const title = newSectionTitle.trim()

    if (!title) {
      return
    }

    setSections((current) => [
      ...current,
      {
        id: allocateTempId(),
        title,
        sortOrder: current.length,
        servingAreas: [],
      },
    ])
    setNewSectionTitle('')
  }

  function handleDeleteSection(section) {
    if (section.servingAreas.length > 0) {
      window.alert(
        `Remove serving areas in “${section.title}” first, then you can remove this section.`,
      )
      return
    }

    const confirmed = window.confirm(`Remove section “${section.title}”?`)

    if (!confirmed) {
      return
    }

    if (isPersistedId(section.id)) {
      setDeletedSectionIds((current) => [...current, section.id])
    }

    setSections((current) => current.filter((entry) => entry.id !== section.id))
  }

  function handleAddArea(sectionId) {
    const areaName = (newAreaNames[sectionId] ?? '').trim()

    if (!areaName) {
      return
    }

    const newArea = {
      id: allocateTempId(),
      sectionId,
      name: areaName,
      description: null,
      publicNote: null,
      requiresBackgroundCheck: false,
      requiresTraining: false,
      requiresAuditionOrInterview: false,
      isActive: true,
      requirements: [],
    }

    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              servingAreas: [...section.servingAreas, newArea],
            }
          : section,
      ),
    )
    setNewAreaNames((current) => ({ ...current, [sectionId]: '' }))
  }

  function handleDeleteArea(area) {
    const confirmed = window.confirm(
      `Delete “${area.name}”? Past volunteer submissions keep their history.`,
    )

    if (!confirmed) {
      return
    }

    if (isPersistedId(area.id)) {
      setDeletedAreaIds((current) => [...current, area.id])
    }

    setSections((current) =>
      current.map((section) => ({
        ...section,
        servingAreas: section.servingAreas.filter((entry) => entry.id !== area.id),
      })),
    )
  }

  function handleAddRequirement(areaId) {
    const label = (newRequirementLabels[areaId] ?? '').trim()

    if (!label) {
      return
    }

    const requirement = {
      id: allocateTempId(),
      type: newRequirementTypes[areaId] ?? 'custom',
      label,
      requiresConfirmation: true,
      isMandatory: false,
    }

    setSections((current) => addRequirementToSections(current, areaId, requirement))
    setNewRequirementLabels((current) => ({ ...current, [areaId]: '' }))
    setNewRequirementTypes((current) => ({ ...current, [areaId]: 'custom' }))
  }

  function handleDeleteRequirement(requirement) {
    const confirmed = window.confirm(`Remove requirement “${requirement.label}”?`)

    if (!confirmed) {
      return
    }

    if (isPersistedId(requirement.id)) {
      setDeletedRequirementIds((current) => [...current, requirement.id])
    }

    setSections((current) =>
      removeRequirementFromSections(current, requirement.id),
    )
  }

  const actionBar = (
    <div className="admin-save-bar">
      <button
        type="submit"
        className={`admin-button admin-button--inline${saving ? ' admin-button--busy' : ''}`}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      <button
        type="button"
        className="admin-button admin-button--secondary admin-button--inline"
        disabled={saving}
        onClick={handleCancel}
      >
        Cancel
      </button>
      {saveSuccess ? <span className="admin-success">{saveSuccess}</span> : null}
      {saveError ? <span className="admin-error-inline">{saveError}</span> : null}
    </div>
  )

  if (!formSlug) {
    return (
      <AdminLayout title="Edit form">
        <p className="admin-back">
          <button type="button" className="admin-back-link" onClick={() => navigate(formsListPath)}>
            ← All forms
          </button>
        </p>
        <p className="admin-error">This form link is invalid.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={formMeta?.name ? `Edit: ${formMeta.name}` : 'Edit form'}>
      <p className="admin-back">
        <button type="button" className="admin-back-link" onClick={requestLeave}>
          ← All forms
        </button>
      </p>

      <UnsavedChangesDialog
        open={leaveDialogOpen}
        saving={saving}
        onSave={handleLeaveSave}
        onDiscard={handleLeaveDiscard}
        onStay={closeLeaveDialog}
      />

      {loading ? <p className="admin-loading">Loading form…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && formMeta ? (
        <form className="admin-form-editor" onSubmit={handleSaveChanges}>
          {actionBar}

          <fieldset className="admin-fieldset">
            <legend className="admin-fieldset__legend">Volunteer form page</legend>
            <div className="admin-field">
              <label className="admin-label" htmlFor="form-name">
                Title
              </label>
              <input
                id="form-name"
                className="admin-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="form-intro">
                Intro text
              </label>
              <textarea
                id="form-intro"
                className="admin-textarea"
                rows={3}
                value={introText}
                onChange={(event) => setIntroText(event.target.value)}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="form-success">
                Success message
              </label>
              <textarea
                id="form-success"
                className="admin-textarea"
                rows={2}
                value={successMessage}
                onChange={(event) => setSuccessMessage(event.target.value)}
              />
            </div>
            <label className="admin-choice">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              <span>Accept new submissions</span>
            </label>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend className="admin-fieldset__legend">Sections and serving areas</legend>

            {sections.length === 0 ? (
              <p className="admin-muted">No sections yet. Add one below.</p>
            ) : (
              sections.map((section) => (
                <div key={section.id} className="admin-edit-section">
                  <div className="admin-field">
                    <label className="admin-label" htmlFor={`section-${section.id}`}>
                      Section heading
                    </label>
                    <input
                      id={`section-${section.id}`}
                      className="admin-input"
                      value={section.title}
                      onChange={(event) =>
                        updateSectionTitle(section.id, event.target.value)
                      }
                    />
                  </div>
                  <div className="admin-section-footer">
                    <button
                      type="button"
                      className="admin-btn-text admin-btn-text--danger"
                      onClick={() => handleDeleteSection(section)}
                    >
                      Remove this section
                    </button>
                  </div>

                  {section.servingAreas.map((area) => (
                    <article
                      key={area.id}
                      className={`admin-edit-area${area.isActive ? '' : ' admin-edit-area--hidden'}`}
                    >
                      <div className="admin-field">
                        <label className="admin-label" htmlFor={`area-name-${area.id}`}>
                          Serving area name
                        </label>
                        <input
                          id={`area-name-${area.id}`}
                          className="admin-input"
                          value={area.name}
                          onChange={(event) =>
                            updateArea(section.id, area.id, { name: event.target.value })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor={`area-desc-${area.id}`}>
                          Description
                        </label>
                        <textarea
                          id={`area-desc-${area.id}`}
                          className="admin-textarea"
                          rows={2}
                          value={area.description ?? ''}
                          onChange={(event) =>
                            updateArea(section.id, area.id, {
                              description: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor={`area-note-${area.id}`}>
                          Note for volunteers
                        </label>
                        <textarea
                          id={`area-note-${area.id}`}
                          className="admin-textarea"
                          rows={2}
                          value={area.publicNote ?? ''}
                          onChange={(event) =>
                            updateArea(section.id, area.id, {
                              publicNote: event.target.value,
                            })
                          }
                        />
                      </div>
                      <AdminAreaHideToggle
                        inputId={`area-hide-${area.id}`}
                        hidden={!area.isActive}
                        onChange={(hidden) =>
                          updateArea(section.id, area.id, { isActive: !hidden })
                        }
                      />

                      <fieldset className="admin-requirements-block">
                        <legend className="admin-requirements__heading">
                          Volunteer acknowledgements for this area
                        </legend>
                        <p className="admin-help admin-help--nested">
                          Each line appears on the public form when someone selects this area.
                          Volunteers check a box to confirm before they submit.
                        </p>
                        {(area.requirements ?? []).length === 0 ? (
                          <p className="admin-muted">None yet — add one below.</p>
                        ) : null}
                        {(area.requirements ?? []).map((req) => (
                          <div key={req.id} className="admin-requirement-card">
                            <div className="admin-field">
                              <label
                                className="admin-label"
                                htmlFor={`req-label-${req.id}`}
                              >
                                Label
                              </label>
                              <input
                                id={`req-label-${req.id}`}
                                className="admin-input"
                                value={req.label}
                                onChange={(event) =>
                                  updateRequirement(section.id, area.id, req.id, {
                                    label: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="admin-field">
                              <label
                                className="admin-label"
                                htmlFor={`req-type-${req.id}`}
                              >
                                Kind
                              </label>
                              <select
                                id={`req-type-${req.id}`}
                                className="admin-input"
                                value={req.type}
                                onChange={(event) =>
                                  updateRequirement(section.id, area.id, req.id, {
                                    type: event.target.value,
                                  })
                                }
                              >
                                {REQUIREMENT_TYPES.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="admin-requirement-card__footer">
                              <label className="admin-choice admin-choice--inline">
                                <input
                                  type="checkbox"
                                  checked={req.requiresConfirmation}
                                  onChange={(event) =>
                                    updateRequirement(section.id, area.id, req.id, {
                                      requiresConfirmation: event.target.checked,
                                    })
                                  }
                                />
                                <span>Volunteer must confirm</span>
                              </label>
                              <button
                                type="button"
                                className="admin-btn-text admin-btn-text--danger"
                                onClick={() => handleDeleteRequirement(req)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="admin-requirement-add">
                          <div className="admin-field admin-field--grow">
                            <label
                              className="admin-label"
                              htmlFor={`req-new-${area.id}`}
                            >
                              Add acknowledgement
                            </label>
                            <input
                              id={`req-new-${area.id}`}
                              className="admin-input"
                              placeholder="e.g. Completed safety training"
                              value={newRequirementLabels[area.id] ?? ''}
                              onChange={(event) =>
                                setNewRequirementLabels((current) => ({
                                  ...current,
                                  [area.id]: event.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="admin-field">
                            <label
                              className="admin-label"
                              htmlFor={`req-new-type-${area.id}`}
                            >
                              Kind
                            </label>
                            <select
                              id={`req-new-type-${area.id}`}
                              className="admin-input admin-input--compact"
                              value={newRequirementTypes[area.id] ?? 'custom'}
                              onChange={(event) =>
                                setNewRequirementTypes((current) => ({
                                  ...current,
                                  [area.id]: event.target.value,
                                }))
                              }
                            >
                              {REQUIREMENT_TYPES.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            className="admin-button admin-button--secondary admin-button--inline admin-requirement-add__btn"
                            onClick={() => handleAddRequirement(area.id)}
                          >
                            Add
                          </button>
                        </div>
                      </fieldset>

                      <div className="admin-area-footer">
                        <button
                          type="button"
                          className="admin-btn-text admin-btn-text--danger"
                          onClick={() => handleDeleteArea(area)}
                        >
                          Delete this serving area
                        </button>
                      </div>
                    </article>
                  ))}

                  <div className="admin-add-inline">
                    <div className="admin-field admin-field--grow">
                      <label
                        className="admin-label"
                        htmlFor={`area-new-${section.id}`}
                      >
                        Add serving area
                      </label>
                      <input
                        id={`area-new-${section.id}`}
                        className="admin-input"
                        placeholder="Area name"
                        value={newAreaNames[section.id] ?? ''}
                        onChange={(event) =>
                          setNewAreaNames((current) => ({
                            ...current,
                            [section.id]: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="admin-button admin-button--secondary admin-button--inline"
                      onClick={() => handleAddArea(section.id)}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="admin-add-inline admin-add-inline--section">
              <div className="admin-field admin-field--grow">
                <label className="admin-label" htmlFor="section-new">
                  Add section
                </label>
                <input
                  id="section-new"
                  className="admin-input"
                  placeholder="Section heading"
                  value={newSectionTitle}
                  onChange={(event) => setNewSectionTitle(event.target.value)}
                />
              </div>
              <button
                type="button"
                className="admin-button admin-button--secondary admin-button--inline"
                onClick={handleAddSection}
              >
                Add
              </button>
            </div>
          </fieldset>

          <div className="admin-save-bar admin-save-bar--bottom">{actionBar}</div>
        </form>
      ) : null}
    </AdminLayout>
  )
}
