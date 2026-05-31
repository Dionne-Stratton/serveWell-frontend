export function normalizeVolunteerNeedStatus(area) {
  if (area.recruitmentStatus) {
    return area.recruitmentStatus
  }
  return area.isActive === false ? 'closed' : 'open'
}

export function isVolunteerNeedClosed(status) {
  return status === 'closed'
}
