import { frequencyOptions } from '../../constants/enums'

const frequencyValues = new Set(frequencyOptions.map((option) => option.value))

export function getAreaDetail(form, areaId) {
  return form.interestByAreaId[areaId] ?? emptyInterestState()
}

export function emptyInterestState() {
  return {
    usesAreaSpecificFrequency: false,
    areaSpecificFrequency: '',
    experienceLevel: '',
    interestNotes: ''
  }
}

export function buildSubmissionPayload(form, servingAreas) {
  const selectedIds = [...form.selectedServingAreaIds]
  const interests = selectedIds.map((servingAreaId) => {
    const detail = form.interestByAreaId[servingAreaId] ?? emptyInterestState()
    return {
      servingAreaId,
      usesAreaSpecificFrequency: detail.usesAreaSpecificFrequency,
      areaSpecificFrequency: detail.usesAreaSpecificFrequency
        ? detail.areaSpecificFrequency
        : null,
      experienceLevel: detail.experienceLevel || null,
      interestNotes: detail.interestNotes.trim() || null
    }
  })

  const requirementConfirmations = []

  for (const area of servingAreas) {
    if (!form.selectedServingAreaIds.has(area.id)) continue

    for (const requirement of area.requirements) {
      if (!requirement.requiresConfirmation) continue
      const key = confirmationKey(area.id, requirement.id)
      if (form.confirmations[key]) {
        requirementConfirmations.push({
          servingAreaId: area.id,
          requirementId: requirement.id,
          confirmed: true
        })
      }
    }
  }

  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    preferredContactMethod: form.preferredContactMethod,
    overallFrequency: form.overallFrequency,
    availability: [...form.availability],
    openToSpecialEvents: form.openToSpecialEvents,
    experienceNotes: form.experienceNotes.trim() || null,
    additionalNotes: form.additionalNotes.trim() || null,
    interests,
    requirementConfirmations
  }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const phoneRequiredPreferredContactMethods = new Set(['text', 'phone'])

export function isValidEmail(value) {
  return emailPattern.test(value.trim())
}

export function validateVolunteerForm(form, servingAreas) {
  const errors = {}

  if (!form.firstName.trim()) errors.firstName = 'First name is required.'
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.'
  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!form.preferredContactMethod) {
    errors.preferredContactMethod = 'Please choose a preferred contact method.'
  }
  if (
    phoneRequiredPreferredContactMethods.has(form.preferredContactMethod) &&
    !form.phone.trim()
  ) {
    errors.phone =
      'Phone number is required when you prefer to be contacted by phone or text.'
  }
  if (!form.overallFrequency) {
    errors.overallFrequency = 'Please choose your overall serving frequency.'
  }
  if (form.selectedServingAreaIds.size === 0) {
    errors.servingAreas = 'Please select at least one serving area.'
  }

  for (const servingAreaId of form.selectedServingAreaIds) {
    const detail = form.interestByAreaId[servingAreaId] ?? emptyInterestState()
    if (detail.usesAreaSpecificFrequency) {
      if (!frequencyValues.has(detail.areaSpecificFrequency)) {
        errors[`areaFrequency-${servingAreaId}`] =
          'Please choose a frequency limit for this area.'
      }
    }
  }

  for (const area of servingAreas) {
    if (!form.selectedServingAreaIds.has(area.id)) continue

    for (const requirement of area.requirements) {
      if (!requirement.isMandatory || !requirement.requiresConfirmation) continue
      const key = confirmationKey(area.id, requirement.id)
      if (!form.confirmations[key]) {
        errors[`confirmation-${area.id}-${requirement.id}`] =
          `Please check “I understand and agree” for ${area.name}.`
      }
    }
  }

  return errors
}

/** First field id to scroll to when validation fails. */
export function firstErrorScrollTarget(errors) {
  const order = [
    'form-summary',
    'firstName',
    'lastName',
    'contact-section',
    'email',
    'phone',
    'preferredContactMethod',
    'overallFrequency',
    'serving-areas-section'
  ]

  for (const key of order) {
    if (errors[key]) return key
  }

  for (const key of Object.keys(errors)) {
    const confirmationMatch = key.match(/^confirmation-(\d+)-(\d+)$/)
    if (confirmationMatch) {
      return `serve-area-${confirmationMatch[1]}`
    }
    const frequencyMatch = key.match(/^areaFrequency-(\d+)$/)
    if (frequencyMatch) {
      return `serve-area-${frequencyMatch[1]}`
    }
  }

  return 'form-summary'
}

export function confirmationKey(servingAreaId, requirementId) {
  return `${servingAreaId}:${requirementId}`
}

export function isServingAreaOpenForIntake(area) {
  const status = area.recruitmentStatus ?? 'open'
  return status !== 'closed'
}

export function filterSectionsForVolunteerIntake(sections) {
  return (sections ?? [])
    .map((section) => ({
      ...section,
      servingAreas: (section.servingAreas ?? []).filter(isServingAreaOpenForIntake),
    }))
    .filter((section) => section.servingAreas.length > 0)
}

export function collectOpenServingAreaIds(sections) {
  const ids = new Set()
  for (const section of sections ?? []) {
    for (const area of section.servingAreas ?? []) {
      if (isServingAreaOpenForIntake(area)) {
        ids.add(area.id)
      }
    }
  }
  return ids
}

export function submissionDetailToFormState(detail) {
  const submission = detail.submission
  const selectedServingAreaIds = new Set()
  const interestByAreaId = {}

  for (const interest of detail.interests ?? []) {
    selectedServingAreaIds.add(interest.servingAreaId)
    interestByAreaId[interest.servingAreaId] = {
      usesAreaSpecificFrequency: interest.usesAreaSpecificFrequency,
      areaSpecificFrequency: interest.areaSpecificFrequency ?? '',
      experienceLevel: interest.experienceLevel ?? '',
      interestNotes: interest.interestNotes ?? '',
    }
  }

  const confirmations = {}
  for (const row of detail.requirementConfirmations ?? []) {
    if (row.confirmed) {
      confirmations[confirmationKey(row.servingAreaId, row.requirementId)] = true
    }
  }

  return {
    firstName: submission.firstName ?? '',
    lastName: submission.lastName ?? '',
    email: submission.email ?? '',
    phone: submission.phone ?? '',
    preferredContactMethod: submission.preferredContactMethod ?? '',
    overallFrequency: submission.overallFrequency ?? '',
    availability: new Set(submission.availability ?? []),
    openToSpecialEvents: Boolean(submission.openToSpecialEvents),
    experienceNotes: submission.experienceNotes ?? '',
    additionalNotes: submission.additionalNotes ?? '',
    selectedServingAreaIds,
    interestByAreaId,
    confirmations,
  }
}

export function restrictFormStateToOpenAreas(formState, openAreaIds) {
  const selectedServingAreaIds = new Set()
  const interestByAreaId = { ...formState.interestByAreaId }
  const confirmations = { ...formState.confirmations }

  for (const areaId of formState.selectedServingAreaIds) {
    if (!openAreaIds.has(areaId)) {
      delete interestByAreaId[areaId]
      for (const key of Object.keys(confirmations)) {
        if (key.startsWith(`${areaId}:`)) {
          delete confirmations[key]
        }
      }
      continue
    }
    selectedServingAreaIds.add(areaId)
  }

  return {
    ...formState,
    selectedServingAreaIds,
    interestByAreaId,
    confirmations,
  }
}

export function groupServingAreasByCategory(servingAreas) {
  const groups = new Map()

  for (const area of servingAreas) {
    const category = area.category ?? 'general'
    if (!groups.has(category)) {
      groups.set(category, [])
    }
    groups.get(category).push(area)
  }

  return groups
}
