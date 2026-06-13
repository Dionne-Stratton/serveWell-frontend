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

/** User-facing calendar dates (US English). Storage/API stay YYYY-MM-DD. */
export const US_DATE_LOCALE = 'en-US'

export function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(US_DATE_LOCALE)
  } catch {
    return iso
  }
}

export function formatDateOnly(isoDate) {
  if (!isoDate) return '—'
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(US_DATE_LOCALE, { dateStyle: 'medium' })
}

export function formatBlackoutDateRange(startDate, endDate) {
  const startLabel = formatDateOnly(startDate)
  if (!endDate || endDate === startDate) {
    return startLabel
  }
  return `${startLabel} – ${formatDateOnly(endDate)}`
}

/** Compact US range for suggested names, e.g. Jun 15–19, 2026 */
export function formatCompactUsDateRange(startDate, endDate) {
  if (!startDate) {
    return ''
  }

  if (!endDate || endDate === startDate) {
    return formatDateOnly(startDate)
  }

  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return formatBlackoutDateRange(startDate, endDate)
  }

  if (sy === ey && sm === em) {
    const monthLabel = start.toLocaleDateString(US_DATE_LOCALE, { month: 'short' })
    return `${monthLabel} ${sd}–${ed}, ${sy}`
  }

  return formatBlackoutDateRange(startDate, endDate)
}

/** Default name when creating a generated schedule from a template. */
export function suggestGeneratedScheduleName(
  templateName,
  scheduleType,
  { startDate, endDate, month, year } = {},
) {
  if (scheduleType === 'monthly' && month && year) {
    const label = new Date(year, month - 1, 1).toLocaleDateString(US_DATE_LOCALE, {
      month: 'long',
      year: 'numeric',
    })
    return `${label} Schedule`
  }

  const template = templateName?.trim()
  if (scheduleType === 'special_event' && template && startDate && endDate) {
    return `${template} — ${formatCompactUsDateRange(startDate, endDate)}`
  }

  if (template && startDate && endDate) {
    return `${template} — ${formatCompactUsDateRange(startDate, endDate)}`
  }

  return ''
}

/** @deprecated Use stored generated schedule name for display. */
export function formatGeneratedScheduleTitle(
  templateName,
  scheduleType,
  startDate,
  endDate,
) {
  const name = templateName?.trim() || 'Schedule'

  if (scheduleType === 'monthly' && startDate) {
    const [year, month] = startDate.split('-').map(Number)
    const label = new Date(year, month - 1, 1).toLocaleDateString(US_DATE_LOCALE, {
      month: 'long',
      year: 'numeric',
    })
    return `${name} — ${label}`
  }

  if (startDate && endDate) {
    return `${name} — ${formatBlackoutDateRange(startDate, endDate)}`
  }

  return name
}
