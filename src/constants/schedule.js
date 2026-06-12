export const scheduleTypeOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'special_event', label: 'Special event' },
]

export function labelScheduleType(value) {
  return scheduleTypeOptions.find((option) => option.value === value)?.label ?? value ?? '—'
}

export const dayOfWeekOptions = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
]

export function labelDayOfWeek(value) {
  return dayOfWeekOptions.find((option) => option.value === value)?.label ?? value ?? '—'
}

export function formatScheduleTime(time24) {
  if (!time24) {
    return '—'
  }

  const [hourPart, minutePart] = time24.split(':')
  const hour = Number(hourPart)
  const minute = minutePart ?? '00'

  if (Number.isNaN(hour)) {
    return time24
  }

  const meridiem = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minute} ${meridiem}`
}
