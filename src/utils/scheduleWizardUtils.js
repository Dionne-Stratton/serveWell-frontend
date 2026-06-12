let nextTempId = 1

export function newTempId(prefix = 'tmp') {
  nextTempId += 1
  return `${prefix}-${nextTempId}`
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

export function emptyRequirement() {
  return {
    clientId: newTempId('req'),
    servingAreaId: '',
    customName: '',
    neededCount: '1',
  }
}

export function servingAreaRefFromRequirement(row) {
  if (row.servingAreaId) {
    return { servingAreaId: Number(row.servingAreaId), customName: null }
  }

  const customName = row.customName?.trim()
  if (customName) {
    return { servingAreaId: null, customName }
  }

  return null
}

export function connectedAreaOptions(selectedServingAreaIds, customAreaNames) {
  const options = []

  for (const id of selectedServingAreaIds) {
    options.push({ kind: 'linked', servingAreaId: id, customName: null })
  }

  for (const name of customAreaNames) {
    const trimmed = name.trim()
    if (trimmed) {
      options.push({ kind: 'custom', servingAreaId: null, customName: trimmed })
    }
  }

  return options
}

export function buildCreateSchedulePayload(state, catalogForms) {
  const nameByServingAreaId = new Map()

  for (const form of catalogForms ?? []) {
    for (const area of form.servingAreas ?? []) {
      nameByServingAreaId.set(area.id, area.name)
    }
  }

  const servingAreas = [
    ...[...state.selectedServingAreaIds].map((servingAreaId) => ({ servingAreaId })),
    ...state.customAreaNames
      .map((customName) => customName.trim())
      .filter(Boolean)
      .map((customName) => ({ customName })),
  ]

  const rhythms = state.rhythms.map((rhythm) => ({
    name: rhythm.name.trim(),
    dayOfWeek: rhythm.dayOfWeek,
    startTime: rhythm.startTime,
    requirements: rhythm.requirements
      .map((row) => {
        const ref = servingAreaRefFromRequirement(row)
        if (!ref) {
          return null
        }

        return {
          servingAreaId: ref.servingAreaId,
          customName: ref.customName,
          neededCount: Number(row.neededCount),
        }
      })
      .filter(Boolean),
  }))

  return {
    name: state.name.trim(),
    scheduleType: 'monthly',
    servingAreas,
    rhythms,
    nameByServingAreaId,
  }
}

export function validateWizardStep(step, state) {
  const errors = {}

  if (step === 1) {
    if (!state.name.trim()) {
      errors.name = 'Schedule name is required.'
    }
  }

  if (step === 2) {
    const hasLinked = state.selectedServingAreaIds.size > 0
    const hasCustom = state.customAreaNames.some((name) => name.trim())
    if (!hasLinked && !hasCustom) {
      errors.servingAreas = 'Select at least one serving area or add a custom name.'
    }
  }

  if (step === 3) {
    if (state.rhythms.length === 0) {
      errors.rhythms = 'Add at least one event.'
      return errors
    }

    state.rhythms.forEach((rhythm, index) => {
      if (!rhythm.name.trim()) {
        errors[`rhythm-${index}-name`] = 'Name is required.'
      }
      if (!rhythm.dayOfWeek) {
        errors[`rhythm-${index}-day`] = 'Day is required.'
      }
      if (!rhythm.startTime) {
        errors[`rhythm-${index}-time`] = 'Start time is required.'
      }
    })
  }

  if (step === 4) {
    state.rhythms.forEach((rhythm, rhythmIndex) => {
      rhythm.requirements.forEach((row, rowIndex) => {
        const ref = servingAreaRefFromRequirement(row)
        if (!ref) {
          errors[`req-${rhythmIndex}-${rowIndex}-area`] = 'Choose a serving area.'
        }

        const count = Number(row.neededCount)
        if (!Number.isInteger(count) || count < 1) {
          errors[`req-${rhythmIndex}-${rowIndex}-count`] = 'Enter a whole number of at least 1.'
        }
      })
    })
  }

  return errors
}

export function areaOptionLabel(option, nameByServingAreaId) {
  if (option.customName) {
    return `${option.customName} (custom)`
  }

  return nameByServingAreaId.get(option.servingAreaId) ?? `Area #${option.servingAreaId}`
}

export function requirementAreaValue(row) {
  if (row.servingAreaId) {
    return `id:${row.servingAreaId}`
  }

  const custom = row.customName?.trim()
  return custom ? `custom:${encodeURIComponent(custom)}` : ''
}

export function applyRequirementAreaValue(row, value) {
  if (value.startsWith('id:')) {
    return {
      ...row,
      servingAreaId: value.slice(3),
      customName: '',
    }
  }

  if (value.startsWith('custom:')) {
    try {
      const customName = decodeURIComponent(value.slice(7))
      return {
        ...row,
        servingAreaId: '',
        customName,
      }
    } catch {
      return row
    }
  }

  return row
}
