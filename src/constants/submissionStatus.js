export const LEGACY_REQUIREMENTS_PENDING_STATUSES = [
  'background_check_needed',
  'background_check_pending',
  'training_needed',
]

export const REQUIREMENTS_PENDING_STATUS = 'requirements_pending'

const LEGACY_ADDED_TO_PLANNING_CENTER = 'added_to_planning_center'

export function normalizeSubmissionStatus(value) {
  if (!value) {
    return value
  }
  if (LEGACY_REQUIREMENTS_PENDING_STATUSES.includes(value)) {
    return REQUIREMENTS_PENDING_STATUS
  }
  if (value === LEGACY_ADDED_TO_PLANNING_CENTER) {
    return 'approved_ready_to_schedule'
  }
  return value
}
