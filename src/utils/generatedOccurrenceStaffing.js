export function getOccurrenceStaffingProgress(requirements) {
  if (!requirements?.length) {
    return {
      areasFullyStaffed: 0,
      areasTotal: 0,
      fullyStaffed: false,
      hasNeeds: false,
    }
  }

  const areasTotal = requirements.length
  let areasFullyStaffed = 0

  for (const req of requirements) {
    if ((req.assignedCount ?? 0) >= (req.neededCount ?? 0)) {
      areasFullyStaffed += 1
    }
  }

  return {
    areasFullyStaffed,
    areasTotal,
    fullyStaffed: areasFullyStaffed === areasTotal,
    hasNeeds: true,
  }
}

export function occurrenceStaffingSummaryLabel(progress) {
  if (!progress.hasNeeds) {
    return 'No staffing needs'
  }

  if (progress.fullyStaffed) {
    return 'Fully covered'
  }

  return `${progress.areasFullyStaffed}/${progress.areasTotal} areas covered`
}
