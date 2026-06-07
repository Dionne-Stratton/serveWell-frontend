import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/client'
import {
  availabilityOptions,
  frequencyOptions,
  preferredContactMethodOptions,
  servingAreaCategoryLabels,
} from '../../constants/enums'
import AdminServingAreaInlineDetail from './AdminServingAreaInlineDetail'
import {
  buildSubmissionPayload,
  confirmationKey,
  emptyInterestState,
  firstErrorScrollTarget,
  getAreaDetail,
  groupServingAreasByCategory,
  validateVolunteerForm,
} from '../serve/volunteerFormUtils'

export const ADMIN_VOLUNTEER_EDIT_FORM_ID = 'admin-volunteer-submission-edit'

function RequiredMark() {
  return (
    <span className="admin-label-required" aria-hidden>
      {' '}
      *
    </span>
  )
}

function scrollToElement(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function EditSection({ title, children, id }) {
  return (
    <section className="admin-detail-section admin-volunteer-edit__section" id={id}>
      <h2 className="admin-detail-section__title">
        <span>{title}</span>
      </h2>
      {children}
    </section>
  )
}

export default function AdminVolunteerSubmissionEditForm({
  sections,
  servingAreas,
  initialFormState,
  onSave,
  onBusyChange,
}) {
  const [form, setForm] = useState(initialFormState)
  const [fieldErrors, setFieldErrors] = useState({})
  const [validationSummary, setValidationSummary] = useState([])
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(initialFormState)
  }, [initialFormState])

  useEffect(() => {
    onBusyChange?.(submitting)
  }, [submitting, onBusyChange])

  const groupedAreas = useMemo(() => {
    if (sections?.length) {
      return sections.map((section) => [section.title, section.servingAreas])
    }
    return groupServingAreasByCategory(servingAreas)
  }, [sections, servingAreas])

  function showValidationFailures(errors) {
    const messages = [...new Set(Object.values(errors))]
    setFieldErrors(errors)
    setValidationSummary(messages)
    const targetId = firstErrorScrollTarget(errors)
    requestAnimationFrame(() => {
      scrollToElement(targetId === 'form-summary' ? 'admin-edit-validation-summary' : targetId)
    })
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[field]
      if (field === 'email') delete next.email
      if (field === 'phone') delete next.phone
      return next
    })
    setValidationSummary([])
  }

  function toggleAvailability(value) {
    setForm((current) => {
      const availability = new Set(current.availability)
      if (availability.has(value)) availability.delete(value)
      else availability.add(value)
      return { ...current, availability }
    })
  }

  function toggleServingArea(area) {
    setForm((current) => {
      const selectedServingAreaIds = new Set(current.selectedServingAreaIds)
      const interestByAreaId = { ...current.interestByAreaId }
      const confirmations = { ...current.confirmations }

      if (selectedServingAreaIds.has(area.id)) {
        selectedServingAreaIds.delete(area.id)
        delete interestByAreaId[area.id]
        for (const requirement of area.requirements) {
          delete confirmations[confirmationKey(area.id, requirement.id)]
        }
      } else {
        selectedServingAreaIds.add(area.id)
        interestByAreaId[area.id] = emptyInterestState()
      }

      return { ...current, selectedServingAreaIds, interestByAreaId, confirmations }
    })
    setFieldErrors((current) => {
      const next = { ...current }
      delete next.servingAreas
      return next
    })
    setValidationSummary([])
  }

  function updateInterest(areaId, patch) {
    setForm((current) => ({
      ...current,
      interestByAreaId: {
        ...current.interestByAreaId,
        [areaId]: {
          ...(current.interestByAreaId[areaId] ?? emptyInterestState()),
          ...patch,
        },
      },
    }))
  }

  function toggleConfirmation(areaId, requirementId, checked) {
    const key = confirmationKey(areaId, requirementId)
    setForm((current) => ({
      ...current,
      confirmations: { ...current.confirmations, [key]: checked },
    }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[`confirmation-${areaId}-${requirementId}`]
      return next
    })
    setValidationSummary([])
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')
    setValidationSummary([])

    const errors = validateVolunteerForm(form, servingAreas)
    if (Object.keys(errors).length > 0) {
      showValidationFailures(errors)
      return
    }

    setSubmitting(true)

    try {
      const payload = buildSubmissionPayload(form, servingAreas)
      await onSave(payload)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to save changes right now. Please try again in a moment.'
      setSubmitError(message)
      setValidationSummary([message])
      requestAnimationFrame(() => scrollToElement('admin-edit-validation-summary'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      id={ADMIN_VOLUNTEER_EDIT_FORM_ID}
      className="admin-volunteer-edit"
      onSubmit={handleSubmit}
      noValidate
    >
      {validationSummary.length > 0 ? (
        <div
          id="admin-edit-validation-summary"
          className="admin-validation-summary"
          role="alert"
          tabIndex={-1}
        >
          <p className="admin-validation-summary__title">Please fix the following before saving:</p>
          <ul>
            {validationSummary.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {submitError ? <p className="admin-error">{submitError}</p> : null}

      <EditSection title="Contact" id="contact-section">
        <div className="admin-field-row">
          <div className="admin-field admin-field--grow">
            <label className="admin-label" htmlFor="firstName">
              First name
              <RequiredMark />
            </label>
            <input
              id="firstName"
              className="admin-input"
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
            />
            {fieldErrors.firstName ? (
              <p className="admin-error-inline">{fieldErrors.firstName}</p>
            ) : null}
          </div>
          <div className="admin-field admin-field--grow">
            <label className="admin-label" htmlFor="lastName">
              Last name
              <RequiredMark />
            </label>
            <input
              id="lastName"
              className="admin-input"
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
            />
            {fieldErrors.lastName ? (
              <p className="admin-error-inline">{fieldErrors.lastName}</p>
            ) : null}
          </div>
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="email">
            Email
            <RequiredMark />
          </label>
          <input
            id="email"
            className="admin-input"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
          {fieldErrors.email ? <p className="admin-error-inline">{fieldErrors.email}</p> : null}
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="phone">
            Phone
          </label>
          <p className="admin-help">Optional unless phone or text is the preferred contact method.</p>
          <input
            id="phone"
            className="admin-input"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />
          {fieldErrors.phone ? <p className="admin-error-inline">{fieldErrors.phone}</p> : null}
        </div>
        <div className="admin-field" id="preferredContactMethod">
          <label className="admin-label" htmlFor="preferredContactMethodSelect">
            Preferred contact method
            <RequiredMark />
          </label>
          <select
            id="preferredContactMethodSelect"
            className="admin-input admin-input--select"
            value={form.preferredContactMethod}
            onChange={(event) => updateField('preferredContactMethod', event.target.value)}
          >
            <option value="">Select…</option>
            {preferredContactMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.preferredContactMethod ? (
            <p className="admin-error-inline">{fieldErrors.preferredContactMethod}</p>
          ) : null}
        </div>
      </EditSection>

      <EditSection title="Serving preferences" id="overallFrequency">
        <div className="admin-field">
          <label className="admin-label" htmlFor="overallFrequencySelect">
            Overall serving frequency
            <RequiredMark />
          </label>
          <p className="admin-help">
            How often they are generally willing to serve across selected areas.
          </p>
          <select
            id="overallFrequencySelect"
            className="admin-input admin-input--select"
            value={form.overallFrequency}
            onChange={(event) => updateField('overallFrequency', event.target.value)}
          >
            <option value="">Select…</option>
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.overallFrequency ? (
            <p className="admin-error-inline">{fieldErrors.overallFrequency}</p>
          ) : null}
        </div>
        <div className="admin-field">
          <span className="admin-label">General availability</span>
          <p className="admin-help">Optional — times that usually work.</p>
          <div className="admin-checkbox-grid">
            {availabilityOptions.map((option) => (
              <label key={option.value} className="admin-choice admin-choice--inline">
                <input
                  type="checkbox"
                  checked={form.availability.has(option.value)}
                  onChange={() => toggleAvailability(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </EditSection>

      <EditSection title="Serving areas" id="serving-areas-section">
        <p className="admin-help">
          Select areas and set per-area options below each selection.
        </p>
        {fieldErrors.servingAreas ? (
          <p className="admin-error-inline">{fieldErrors.servingAreas}</p>
        ) : null}
        {groupedAreas.map(([groupTitle, areas]) => (
          <div key={groupTitle} className="admin-volunteer-edit__area-group">
            <h3 className="admin-volunteer-edit__area-group-title">
              {sections?.length
                ? groupTitle
                : (servingAreaCategoryLabels[groupTitle] ?? groupTitle)}
            </h3>
            <ul className="admin-volunteer-edit__area-list">
              {areas.map((area) => {
                const need = area.recruitmentStatus ?? 'open'
                const isSelected = form.selectedServingAreaIds.has(area.id)
                return (
                  <li
                    key={area.id}
                    id={`serving-area-${area.id}`}
                    className={`admin-volunteer-edit__area-item${need === 'needed' || need === 'urgent' ? ' admin-volunteer-edit__area-item--highlight' : ''}`}
                  >
                    <label className="admin-choice">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleServingArea(area)}
                      />
                      <span>
                        <strong>{area.name}</strong>
                        {area.description ? (
                          <span className="admin-muted"> — {area.description}</span>
                        ) : null}
                      </span>
                    </label>
                    {isSelected ? (
                      <AdminServingAreaInlineDetail
                        area={area}
                        detail={getAreaDetail(form, area.id)}
                        confirmations={form.confirmations}
                        fieldErrors={fieldErrors}
                        onUpdateInterest={updateInterest}
                        onToggleConfirmation={toggleConfirmation}
                      />
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </EditSection>

      <EditSection title="Special events">
        <label className="admin-choice">
          <input
            type="checkbox"
            checked={form.openToSpecialEvents}
            onChange={(event) => updateField('openToSpecialEvents', event.target.checked)}
          />
          <span>Open to helping with special events when needed</span>
        </label>
        <p className="admin-help admin-help--nested">
          Special events may be in addition to their normal serving rhythm.
        </p>
      </EditSection>

      <EditSection title="Notes">
        <div className="admin-field">
          <label className="admin-label" htmlFor="experienceNotes">
            Experience notes (optional)
          </label>
          <textarea
            id="experienceNotes"
            className="admin-textarea"
            rows={3}
            value={form.experienceNotes}
            onChange={(event) => updateField('experienceNotes', event.target.value)}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="additionalNotes">
            Anything else (optional)
          </label>
          <textarea
            id="additionalNotes"
            className="admin-textarea"
            rows={3}
            value={form.additionalNotes}
            onChange={(event) => updateField('additionalNotes', event.target.value)}
          />
        </div>
      </EditSection>
    </form>
  )
}
