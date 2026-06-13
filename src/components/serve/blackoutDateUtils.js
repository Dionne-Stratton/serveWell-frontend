const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Local calendar date as YYYY-MM-DD (matches `<input type="date">`). */
export function todayIsoDateLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Latest of ISO date strings (YYYY-MM-DD). */
export function latestIsoDate(...values) {
  const present = values.map((v) => v?.trim()).filter(Boolean)
  if (present.length === 0) {
    return ''
  }
  return present.sort().at(-1)
}

/** Last calendar day of month (1–12) as YYYY-MM-DD. */
export function monthEndIsoDateLocal(year, month) {
  const lastDay = new Date(year, month, 0).getDate()
  const m = String(month).padStart(2, '0')
  const d = String(lastDay).padStart(2, '0')
  return `${year}-${m}-${d}`
}

/** Validate one start/end range (same rules as blackout dates on the public form). */
export function validateSingleDateRange(startDate, endDate, { disallowPastDates = true } = {}) {
  const start = startDate?.trim() ?? ''
  const end = endDate?.trim() ?? ''

  if (!start || !end) {
    return 'Start and end dates are required.'
  }

  const errors = {}
  validateBlackoutDates([{ startDate: start, endDate: end, note: '' }], errors, 'range', {
    disallowPastDates,
  })

  return Object.values(errors)[0] ?? ''
}

export function emptyBlackoutDateRow() {
  return { startDate: '', endDate: '', note: '' }
}

/** Apply start date change; clears end if it would fall before the new start. */
export function applyBlackoutStartChange(row, startDate, { disallowPastDates = true } = {}) {
  if (disallowPastDates) {
    const today = todayIsoDateLocal()
    if (startDate && startDate < today) {
      return row
    }
  }

  const next = { ...row, startDate }
  const end = next.endDate?.trim() ?? ''
  if (end && startDate && startDate > end) {
    next.endDate = ''
  }
  return next
}

/** Apply end date change; ignores values before start when start is set. */
export function applyBlackoutEndChange(row, endDate, { disallowPastDates = true } = {}) {
  const start = row.startDate?.trim() ?? ''
  const today = todayIsoDateLocal()
  const minEnd = disallowPastDates ? latestIsoDate(start, today) : start

  if (endDate && minEnd && endDate < minEnd) {
    return row
  }
  return { ...row, endDate }
}

export function normalizeBlackoutDatesForPayload(rows) {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map((row) => ({
      startDate: row.startDate?.trim() ?? '',
      endDate: row.endDate?.trim() ?? '',
      note: row.note?.trim() ?? '',
    }))
    .filter((row) => row.startDate || row.endDate || row.note)
    .map((row) => ({
      startDate: row.startDate,
      endDate: row.endDate || null,
      note: row.note || null,
    }))
}

export function validateBlackoutDates(
  rows,
  errors,
  errorKey = 'blackoutDates',
  { disallowPastDates = true } = {},
) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return
  }

  const today = disallowPastDates ? todayIsoDateLocal() : null

  rows.forEach((row, index) => {
    const start = row.startDate?.trim() ?? ''
    const end = row.endDate?.trim() ?? ''
    const note = row.note?.trim() ?? ''

    if (!start && !end && !note) {
      return
    }

    if (!start) {
      errors[`${errorKey}-${index}-start`] = 'Start date is required.'
      return
    }

    if (!ISO_DATE_PATTERN.test(start) || !isValidCalendarDate(start)) {
      errors[`${errorKey}-${index}-start`] = 'Enter a valid start date.'
      return
    }

    if (disallowPastDates && start < today) {
      errors[`${errorKey}-${index}-start`] = 'Start date cannot be in the past.'
    }

    const effectiveEnd = end || start

    if (end && (!ISO_DATE_PATTERN.test(end) || !isValidCalendarDate(end))) {
      errors[`${errorKey}-${index}-end`] = 'Enter a valid end date.'
    } else {
      if (disallowPastDates && end && end < today) {
        errors[`${errorKey}-${index}-end`] = 'End date cannot be in the past.'
      }
      if (end && effectiveEnd < start) {
        errors[`${errorKey}-${index}-end`] = 'End date cannot be before start date.'
        errors[`${errorKey}-${index}-start`] = 'Start date cannot be after end date.'
      }
    }
  })
}

function isValidCalendarDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}
