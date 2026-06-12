const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function normalizeStartTime(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const trimmed = value.trim()

  if (TIME_PATTERN.test(trimmed)) {
    return trimmed
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i)

  if (!match) {
    return null
  }

  let hour = Number(match[1])
  const minute = match[2]
  const meridiem = match[3]?.toUpperCase()

  if (meridiem === 'PM' && hour < 12) {
    hour += 12
  } else if (meridiem === 'AM' && hour === 12) {
    hour = 0
  }

  if (hour > 23) {
    return null
  }

  return `${String(hour).padStart(2, '0')}:${minute}`
}
