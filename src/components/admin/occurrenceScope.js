/**
 * @param {'all' | 'general' | { areaId: number }} scope
 */
export function resolveOccurrenceItemScope(scope) {
  if (scope === 'all') {
    return {
      filterNote: () => true,
      filterResource: () => true,
      fixedScheduleServingAreaId: undefined,
      showServingAreaPicker: true,
    }
  }

  if (scope === 'general') {
    return {
      filterNote: (note) => !note.scheduleServingAreaId,
      filterResource: (resource) => !resource.scheduleServingAreaId,
      fixedScheduleServingAreaId: null,
      showServingAreaPicker: false,
    }
  }

  const areaId = scope.areaId

  return {
    filterNote: (note) => note.scheduleServingAreaId === areaId,
    filterResource: (resource) => resource.scheduleServingAreaId === areaId,
    fixedScheduleServingAreaId: areaId,
    showServingAreaPicker: false,
  }
}

export function requirementNeedsVolunteers(requirement) {
  return (requirement.assignedCount ?? 0) < (requirement.neededCount ?? 0)
}

export function requirementStaffingStatus(requirement) {
  const needed = requirement.neededCount ?? 0
  const assigned = requirement.assignedCount ?? 0

  if (needed < 1) {
    return 'none'
  }

  return assigned >= needed ? 'complete' : 'incomplete'
}

export function defaultServingAreaCardExpanded(requirement) {
  return requirementNeedsVolunteers(requirement)
}

export function servingAreaOptionsFromRequirements(requirements) {
  const seen = new Set()
  const options = []

  for (const req of requirements ?? []) {
    const id = req.scheduleServingAreaId
    if (!id || seen.has(id)) {
      continue
    }
    seen.add(id)
    options.push({
      id,
      displayName: req.displayName?.trim() || `Area ${id}`,
    })
  }

  return options.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
  )
}
