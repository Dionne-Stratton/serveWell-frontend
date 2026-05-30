import { useMemo, useRef, useState } from 'react'
import { ApiError, submitVolunteerForm } from '../../api/client'
import {
  availabilityOptions,
  frequencyOptions,
  preferredContactMethodOptions,
  servingAreaCategoryLabels
} from '../../constants/enums'
import RequiredMark from './RequiredMark'
import ServingAreaInlineDetail from './ServingAreaInlineDetail'
import {
  buildSubmissionPayload,
  confirmationKey,
  emptyInterestState,
  firstErrorScrollTarget,
  getAreaDetail,
  groupServingAreasByCategory,
  validateVolunteerForm
} from './volunteerFormUtils'

function initialFormState() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContactMethod: '',
    overallFrequency: '',
    availability: new Set(),
    openToSpecialEvents: false,
    experienceNotes: '',
    additionalNotes: '',
    selectedServingAreaIds: new Set(),
    interestByAreaId: {},
    confirmations: {}
  }
}

function scrollToElement(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

export default function VolunteerForm({
  servingAreas,
  sections = null,
  organizationSlug,
  formSlug,
  previewOnly = false,
  introText,
}) {
  const [form, setForm] = useState(initialFormState)
  const [fieldErrors, setFieldErrors] = useState({})
  const [validationSummary, setValidationSummary] = useState([])
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const statusRef = useRef(null)

  const groupedAreas = useMemo(() => {
    if (sections?.length) {
      return sections.map((section) => [section.title, section.servingAreas])
    }
    return groupServingAreasByCategory(servingAreas)
  }, [sections, servingAreas])

  const introCopy =
    introText?.trim() ||
    "Thank you for wanting to serve. Share a little about yourself and where you'd like to help — we'll follow up with you soon."

  function showValidationFailures(errors) {
    const messages = [...new Set(Object.values(errors))]
    setFieldErrors(errors)
    setValidationSummary(messages)
    const targetId = firstErrorScrollTarget(errors)
    requestAnimationFrame(() => {
      scrollToElement(targetId === 'form-summary' ? 'form-validation-summary' : targetId)
    })
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[field]
      if (field === 'email' || field === 'phone') delete next.contact
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
          ...patch
        }
      }
    }))
  }

  function toggleConfirmation(areaId, requirementId, checked) {
    const key = confirmationKey(areaId, requirementId)
    setForm((current) => ({
      ...current,
      confirmations: { ...current.confirmations, [key]: checked }
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

    if (previewOnly) {
      return
    }
    setSubmitError('')
    setValidationSummary([])

    const errors = validateVolunteerForm(form, servingAreas)
    if (Object.keys(errors).length > 0) {
      showValidationFailures(errors)
      return
    }

    setSubmitting(true)
    requestAnimationFrame(() => {
      statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })

    try {
      const payload = buildSubmissionPayload(form, servingAreas)
      const data = await submitVolunteerForm(organizationSlug, formSlug, payload)
      setSuccessMessage(
        data.message ??
          'Thank you! Your interest has been submitted. Someone from the church will follow up with you soon.'
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to submit right now. Please try again in a moment.'
      setSubmitError(message)
      setValidationSummary([message])
      requestAnimationFrame(() => scrollToElement('form-validation-summary'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmitAnother() {
    setForm(initialFormState())
    setFieldErrors({})
    setSubmitError('')
    setValidationSummary([])
    setSuccessMessage('')
  }

  if (successMessage) {
    return (
      <div className="serve-success" role="status">
        <p className="serve-success__message">{successMessage}</p>
        <button type="button" className="serve-button" onClick={handleSubmitAnother}>
          Submit another response
        </button>
      </div>
    )
  }

  return (
    <form className="serve-form" onSubmit={handleSubmit} noValidate>
      {validationSummary.length > 0 ? (
        <div
          id="form-validation-summary"
          className="serve-validation-summary"
          role="alert"
          tabIndex={-1}
        >
          <p className="serve-validation-summary__title">
            Please fix the following before submitting:
          </p>
          <ul>
            {validationSummary.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="serve-form__intro">{introCopy}</p>
      <p className="serve-required-legend">
        <span className="serve-asterisk">*</span> Required field
      </p>

      <fieldset className="serve-fieldset">
        <legend className="serve-fieldset__legend">Your name</legend>
        <div className="serve-field-row serve-field-row--split">
          <div className="serve-field">
            <label className="serve-label" htmlFor="firstName">
              First name
              <RequiredMark />
            </label>
            <input
              id="firstName"
              className="serve-input"
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
            />
            {fieldErrors.firstName ? (
              <p className="serve-field-error">{fieldErrors.firstName}</p>
            ) : null}
          </div>
          <div className="serve-field">
            <label className="serve-label" htmlFor="lastName">
              Last name
              <RequiredMark />
            </label>
            <input
              id="lastName"
              className="serve-input"
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
            />
            {fieldErrors.lastName ? (
              <p className="serve-field-error">{fieldErrors.lastName}</p>
            ) : null}
          </div>
        </div>
      </fieldset>

      <fieldset className="serve-fieldset" id="contact-section">
        <legend className="serve-fieldset__legend">
          Contact
          <RequiredMark />
        </legend>
        <p className="serve-help">Provide an email, a phone number, or both.</p>
        {fieldErrors.contact ? <p className="serve-field-error">{fieldErrors.contact}</p> : null}
        <div className="serve-field">
          <label className="serve-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="serve-input"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
          {fieldErrors.email ? <p className="serve-field-error">{fieldErrors.email}</p> : null}
        </div>
        <div className="serve-field">
          <label className="serve-label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            className="serve-input"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />
        </div>
        <div className="serve-field" id="preferredContactMethod">
          <span className="serve-label">
            Preferred contact method
            <RequiredMark />
          </span>
          <div className="serve-radio-group">
            {preferredContactMethodOptions.map((option) => (
              <label key={option.value} className="serve-choice">
                <input
                  type="radio"
                  name="preferredContactMethod"
                  value={option.value}
                  checked={form.preferredContactMethod === option.value}
                  onChange={() => updateField('preferredContactMethod', option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {fieldErrors.preferredContactMethod ? (
            <p className="serve-field-error">{fieldErrors.preferredContactMethod}</p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="serve-fieldset">
        <legend className="serve-fieldset__legend" id="overallFrequency">
          Overall serving frequency
          <RequiredMark />
        </legend>
        <p className="serve-help">
          How often are you generally willing to serve across the areas you choose?
        </p>
        <div className="serve-radio-group serve-radio-group--stacked">
          {frequencyOptions.map((option) => (
            <label key={option.value} className="serve-choice">
              <input
                type="radio"
                name="overallFrequency"
                value={option.value}
                checked={form.overallFrequency === option.value}
                onChange={() => updateField('overallFrequency', option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {fieldErrors.overallFrequency ? (
          <p className="serve-field-error">{fieldErrors.overallFrequency}</p>
        ) : null}
      </fieldset>

      <fieldset className="serve-fieldset">
        <legend className="serve-fieldset__legend">General availability</legend>
        <p className="serve-help">Select any times that usually work for you (optional).</p>
        <div className="serve-checkbox-group">
          {availabilityOptions.map((option) => (
            <label key={option.value} className="serve-choice">
              <input
                type="checkbox"
                checked={form.availability.has(option.value)}
                onChange={() => toggleAvailability(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="serve-fieldset" id="serving-areas-section">
        <legend className="serve-fieldset__legend">
          Serving areas
          <RequiredMark />
        </legend>
        <p className="serve-help">
          Choose one or more areas. Options for each area appear directly below it.
        </p>
        {fieldErrors.servingAreas ? (
          <p className="serve-field-error">{fieldErrors.servingAreas}</p>
        ) : null}
        {groupedAreas.map(([groupTitle, areas]) => (
          <div key={groupTitle} className="serve-area-group">
            <h3 className="serve-area-group__title">
              {sections?.length ? groupTitle : (servingAreaCategoryLabels[groupTitle] ?? groupTitle)}
            </h3>
            <ul className="serve-area-list">
              {areas.map((area) => {
                const isSelected = form.selectedServingAreaIds.has(area.id)
                return (
                  <li key={area.id} className="serve-area-item">
                    <label className="serve-choice serve-choice--area">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleServingArea(area)}
                      />
                      <span>
                        <strong>{area.name}</strong>
                        {area.description ? (
                          <span className="serve-area-list__desc"> — {area.description}</span>
                        ) : null}
                      </span>
                    </label>
                    {isSelected ? (
                      <ServingAreaInlineDetail
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
      </fieldset>

      <fieldset className="serve-fieldset">
        <legend className="serve-fieldset__legend">Special events</legend>
        <label className="serve-choice">
          <input
            type="checkbox"
            checked={form.openToSpecialEvents}
            onChange={(event) => updateField('openToSpecialEvents', event.target.checked)}
          />
          <span>I&apos;m open to helping with special events when needed</span>
        </label>
        <p className="serve-help">
          Special events may be in addition to your normal serving rhythm. We&apos;ll always ask
          before scheduling you.
        </p>
      </fieldset>

      <fieldset className="serve-fieldset">
        <legend className="serve-fieldset__legend">Additional notes</legend>
        <div className="serve-field">
          <label className="serve-label" htmlFor="experienceNotes">
            Experience notes (optional)
          </label>
          <textarea
            id="experienceNotes"
            className="serve-input serve-input--textarea"
            rows={3}
            value={form.experienceNotes}
            onChange={(event) => updateField('experienceNotes', event.target.value)}
          />
        </div>
        <div className="serve-field">
          <label className="serve-label" htmlFor="additionalNotes">
            Anything else we should know (optional)
          </label>
          <textarea
            id="additionalNotes"
            className="serve-input serve-input--textarea"
            rows={3}
            value={form.additionalNotes}
            onChange={(event) => updateField('additionalNotes', event.target.value)}
          />
        </div>
      </fieldset>

      <div className="serve-submit-bar" ref={statusRef}>
        {previewOnly ? (
          <p className="serve-demo-notice" role="status">
            This form is for demo purposes only. You can explore the fields, but responses are not
            saved. Sample submissions are available in the demo admin dashboard.
          </p>
        ) : null}
        {submitting ? (
          <p className="serve-status serve-status--loading" role="status" aria-live="polite">
            Submitting your response…
          </p>
        ) : null}
        {submitError ? <p className="serve-form-error">{submitError}</p> : null}
        <button
          type="submit"
          className={`serve-button${submitting ? ' serve-button--busy' : ''}`}
          disabled={previewOnly || submitting}
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
