import {
  availabilityOptions,
  experienceLevelOptions,
  frequencyOptions,
  preferredContactMethodOptions,
  submissionStatusOptions,
} from './enums'
import { normalizeSubmissionStatus } from './submissionStatus'

function labelFromOptions(options, value) {
  if (!value) return '—'
  return options.find((option) => option.value === value)?.label ?? value
}

export function labelPreferredContact(value) {
  return labelFromOptions(preferredContactMethodOptions, value)
}

export function labelFrequency(value) {
  return labelFromOptions(frequencyOptions, value)
}

export function labelAvailability(value) {
  return labelFromOptions(availabilityOptions, value)
}

export function labelExperience(value) {
  return labelFromOptions(experienceLevelOptions, value)
}

export function labelSubmissionStatus(value) {
  return labelFromOptions(submissionStatusOptions, normalizeSubmissionStatus(value))
}

export function formatAvailabilityList(keys) {
  if (!keys?.length) return '—'
  return keys.map((key) => labelAvailability(key)).join(', ')
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
