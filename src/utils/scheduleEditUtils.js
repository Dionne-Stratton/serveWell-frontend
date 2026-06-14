import { normalizeStartTime } from './scheduleEditValidation'

let nextTempId = 1

export function newTempId(prefix = 'tmp') {
  nextTempId += 1
  return `${prefix}-${nextTempId}`
}

export function servingAreaKey(servingAreaId, customName) {
  if (servingAreaId) {
    return `id:${servingAreaId}`
  }

  const trimmed = customName?.trim()
  if (trimmed) {
    return `custom:${trimmed.toLowerCase()}`
  }

  return null
}

export function rhythmFromDetail(rhythm) {
  return {
    clientId: newTempId('rhythm'),
    id: rhythm.id ?? null,
    name: rhythm.name ?? '',
    dayOfWeek: rhythm.dayOfWeek ?? 'sunday',
    startTime: rhythm.startTime ?? '09:00',
    requirements: (rhythm.requirements ?? []).map((row) => ({
      clientId: newTempId('req'),
      scheduleServingAreaId: String(row.scheduleServingAreaId),
      neededCount: String(row.neededCount),
    })),
  }
}

export function servingAreasFromDetail(servingAreas) {
  return (servingAreas ?? []).map((row) => ({
    id: row.id,
    servingAreaId: row.servingAreaId,
    customName: row.customName,
    displayName: row.displayName,
  }))
}

export function emptyRhythm() {
  return {
    clientId: newTempId('rhythm'),
    name: '',
    dayOfWeek: 'sunday',
    startTime: '09:00',
    requirements: [],
  }
}

export function emptyStaffingRow() {
  return {
    clientId: newTempId('req'),
    scheduleServingAreaId: '',
    neededCount: '1',
  }
}

export function buildServingAreasPutPayload(localAreas) {
  return {
    servingAreas: localAreas.map((row) => ({
      servingAreaId: row.servingAreaId ?? null,
      customName: row.customName?.trim() ? row.customName.trim() : null,
    })),
  }
}

export function buildRhythmsPutPayload(localRhythms) {
  return {
    rhythms: localRhythms.map((rhythm) => ({
      ...(Number.isInteger(rhythm.id) && rhythm.id > 0 ? { id: rhythm.id } : {}),
      name: rhythm.name.trim(),
      dayOfWeek: rhythm.dayOfWeek,
      startTime: rhythm.startTime,
      requirements: rhythm.requirements
        .map((row) => ({
          scheduleServingAreaId: Number(row.scheduleServingAreaId),
          neededCount: Number(row.neededCount),
        }))
        .filter(
          (row) =>
            Number.isInteger(row.scheduleServingAreaId) &&
            row.scheduleServingAreaId > 0 &&
            Number.isInteger(row.neededCount) &&
            row.neededCount >= 1,
        ),
    })),
  }
}

export function validateServingAreasLocal(localAreas) {
  if (!localAreas.length) {
    return 'Connect at least one serving area.'
  }

  return ''
}

export function validateRhythmsLocal(localRhythms, connectedAreaIds) {
  if (!localRhythms.length) {
    return 'Add at least one event.'
  }

  for (const rhythm of localRhythms) {
    if (!rhythm.name.trim()) {
      return 'Each event needs a name.'
    }

    if (!rhythm.dayOfWeek) {
      return 'Each event needs a day of week.'
    }

    const normalizedTime = normalizeStartTime(rhythm.startTime)
    if (!normalizedTime) {
      return 'Each event needs a valid start time.'
    }

    for (const row of rhythm.requirements) {
      const areaId = Number(row.scheduleServingAreaId)
      if (!Number.isInteger(areaId) || areaId < 1 || !connectedAreaIds.has(areaId)) {
        return 'Each staffing row must use a serving area connected to this schedule.'
      }

      const count = Number(row.neededCount)
      if (!Number.isInteger(count) || count < 1) {
        return 'Needed count must be a whole number of at least 1.'
      }
    }
  }

  return ''
}

export function isServingAreaUsedInRhythms(scheduleServingAreaId, localRhythms) {
  const id = Number(scheduleServingAreaId)
  if (!Number.isInteger(id)) {
    return false
  }

  for (const rhythm of localRhythms) {
    for (const row of rhythm.requirements) {
      if (Number(row.scheduleServingAreaId) === id) {
        return true
      }
    }
  }

  return false
}

export function catalogAreaById(catalogForms) {
  const map = new Map()
  for (const form of catalogForms ?? []) {
    for (const area of form.servingAreas ?? []) {
      map.set(area.id, { ...area, formName: form.name })
    }
  }
  return map
}

export function linkedAreasNotYetConnected(catalogForms, localAreas) {
  const connectedIds = new Set(
    localAreas.map((row) => row.servingAreaId).filter((id) => id != null),
  )
  const options = []

  for (const form of catalogForms ?? []) {
    for (const area of form.servingAreas ?? []) {
      if (!connectedIds.has(area.id)) {
        options.push({
          servingAreaId: area.id,
          displayName: area.name,
          formName: form.name,
        })
      }
    }
  }

  return options
}
