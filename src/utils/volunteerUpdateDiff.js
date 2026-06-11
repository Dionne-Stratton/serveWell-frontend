import {
  formatAvailabilityList,
  formatBlackoutDateRange,
  labelExperience,
  labelFrequency,
  labelPreferredContact,
} from '../constants/labels'

function displayText(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  return String(value)
}

function sameText(a, b) {
  return displayText(a) === displayText(b)
}

function formatBlackoutList(rows) {
  if (!rows?.length) {
    return 'None'
  }

  return rows
    .map((row) => {
      const range = formatBlackoutDateRange(row.startDate, row.endDate)
      const note = row.note?.trim()
      return note ? `${range} — ${note}` : range
    })
    .join('; ')
}

function interestSummary(interest) {
  if (!interest) {
    return '—'
  }

  const parts = [interest.servingAreaName || `Area #${interest.servingAreaId}`]

  if (interest.usesAreaSpecificFrequency && interest.areaSpecificFrequency) {
    parts.push(`Limit: ${labelFrequency(interest.areaSpecificFrequency)}`)
  }

  if (interest.experienceLevel) {
    parts.push(`Experience: ${labelExperience(interest.experienceLevel)}`)
  }

  if (interest.interestNotes?.trim()) {
    parts.push(`Notes: ${interest.interestNotes.trim()}`)
  }

  return parts.join(' · ')
}

function interestMap(interests) {
  const map = new Map()
  for (const row of interests ?? []) {
    map.set(row.servingAreaId, row)
  }
  return map
}

function confirmationKey(row) {
  return `${row.servingAreaId}:${row.requirementId}`
}

function confirmationMap(rows) {
  const map = new Map()
  for (const row of rows ?? []) {
    map.set(confirmationKey(row), row)
  }
  return map
}

function formatConfirmation(row) {
  if (!row) {
    return '—'
  }

  const status = row.confirmed ? 'Confirmed' : 'Not confirmed'
  return `${row.servingAreaName}: ${row.label} (${status})`
}

function pushChange(changes, section, label, before, after) {
  if (sameText(before, after)) {
    return
  }

  changes.push({
    section,
    label,
    before: displayText(before),
    after: displayText(after),
  })
}

function snapshotFromDetail(detail) {
  const submission = detail.submission
  return {
    firstName: submission.firstName,
    lastName: submission.lastName,
    email: submission.email,
    phone: submission.phone,
    preferredContactMethod: submission.preferredContactMethod,
    overallFrequency: submission.overallFrequency,
    availability: submission.availability ?? [],
    openToSpecialEvents: submission.openToSpecialEvents,
    experienceNotes: submission.experienceNotes,
    additionalNotes: submission.additionalNotes,
    blackoutDates: (detail.blackoutDates ?? []).map((row) => ({
      startDate: row.startDate,
      endDate: row.endDate,
      note: row.note,
    })),
    interests: detail.interests ?? [],
    requirementConfirmations: detail.requirementConfirmations ?? [],
  }
}

export function buildVolunteerUpdateDiff(beforeSnapshot, detail) {
  if (!beforeSnapshot || !detail?.submission) {
    return []
  }

  const after = snapshotFromDetail(detail)
  const changes = []

  pushChange(changes, 'Contact', 'First name', beforeSnapshot.firstName, after.firstName)
  pushChange(changes, 'Contact', 'Last name', beforeSnapshot.lastName, after.lastName)
  pushChange(changes, 'Contact', 'Email', beforeSnapshot.email, after.email)
  pushChange(changes, 'Contact', 'Phone', beforeSnapshot.phone, after.phone)
  pushChange(
    changes,
    'Contact',
    'Preferred contact',
    labelPreferredContact(beforeSnapshot.preferredContactMethod),
    labelPreferredContact(after.preferredContactMethod),
  )

  pushChange(
    changes,
    'Serving preferences',
    'Overall frequency',
    labelFrequency(beforeSnapshot.overallFrequency),
    labelFrequency(after.overallFrequency),
  )
  pushChange(
    changes,
    'Serving preferences',
    'Open to special events',
    beforeSnapshot.openToSpecialEvents ? 'Yes' : 'No',
    after.openToSpecialEvents ? 'Yes' : 'No',
  )

  pushChange(
    changes,
    'Availability',
    'General availability',
    formatAvailabilityList(beforeSnapshot.availability),
    formatAvailabilityList(after.availability),
  )

  pushChange(
    changes,
    'Blackout dates',
    'Blackout dates',
    formatBlackoutList(beforeSnapshot.blackoutDates),
    formatBlackoutList(after.blackoutDates),
  )

  const beforeInterests = interestMap(beforeSnapshot.interests)
  const afterInterests = interestMap(after.interests)
  const areaIds = new Set([...beforeInterests.keys(), ...afterInterests.keys()])

  for (const areaId of [...areaIds].sort((a, b) => a - b)) {
    const beforeRow = beforeInterests.get(areaId)
    const afterRow = afterInterests.get(areaId)
    const label = afterRow?.servingAreaName ?? beforeRow?.servingAreaName ?? `Area #${areaId}`

    if (!beforeRow && afterRow) {
      changes.push({
        section: 'Serving areas',
        label: `${label} (added)`,
        before: 'Not selected',
        after: interestSummary(afterRow),
      })
      continue
    }

    if (beforeRow && !afterRow) {
      changes.push({
        section: 'Serving areas',
        label: `${label} (removed)`,
        before: interestSummary(beforeRow),
        after: 'Not selected',
      })
      continue
    }

    if (!beforeRow || !afterRow) {
      continue
    }

    const beforeLimit = beforeRow.usesAreaSpecificFrequency
      ? labelFrequency(beforeRow.areaSpecificFrequency)
      : 'Same as overall'
    const afterLimit = afterRow.usesAreaSpecificFrequency
      ? labelFrequency(afterRow.areaSpecificFrequency)
      : 'Same as overall'

    pushChange(changes, 'Serving areas', `${label} — frequency limit`, beforeLimit, afterLimit)
    pushChange(
      changes,
      'Serving areas',
      `${label} — experience`,
      labelExperience(beforeRow.experienceLevel),
      labelExperience(afterRow.experienceLevel),
    )
    pushChange(
      changes,
      'Serving areas',
      `${label} — notes`,
      beforeRow.interestNotes,
      afterRow.interestNotes,
    )
  }

  pushChange(changes, 'Notes', 'Experience notes', beforeSnapshot.experienceNotes, after.experienceNotes)
  pushChange(
    changes,
    'Notes',
    'Additional notes',
    beforeSnapshot.additionalNotes,
    after.additionalNotes,
  )

  const beforeConfirmations = confirmationMap(beforeSnapshot.requirementConfirmations)
  const afterConfirmations = confirmationMap(after.requirementConfirmations)
  const confirmationKeys = new Set([
    ...beforeConfirmations.keys(),
    ...afterConfirmations.keys(),
  ])

  for (const key of [...confirmationKeys].sort()) {
    const beforeRow = beforeConfirmations.get(key)
    const afterRow = afterConfirmations.get(key)
    const label = afterRow?.label ?? beforeRow?.label ?? 'Requirement'

    pushChange(
      changes,
      'Requirement confirmations',
      label,
      formatConfirmation(beforeRow),
      formatConfirmation(afterRow),
    )
  }

  return changes
}

export function groupVolunteerUpdateChanges(changes) {
  const order = [
    'Contact',
    'Serving preferences',
    'Availability',
    'Blackout dates',
    'Serving areas',
    'Notes',
    'Requirement confirmations',
  ]

  const grouped = new Map()

  for (const change of changes) {
    const list = grouped.get(change.section) ?? []
    list.push(change)
    grouped.set(change.section, list)
  }

  return order
    .filter((section) => grouped.has(section))
    .map((section) => ({
      section,
      items: grouped.get(section),
    }))
}
