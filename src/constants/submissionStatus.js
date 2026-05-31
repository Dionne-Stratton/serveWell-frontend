export const LEGACY_REQUIREMENTS_PENDING_STATUSES = [
  'background_check_needed',
  'background_check_pending',
  'training_needed',
]

export const REQUIREMENTS_PENDING_STATUS = 'requirements_pending'

export function normalizeSubmissionStatus(value) {
  if (!value) {
    return value
  }
  return LEGACY_REQUIREMENTS_PENDING_STATUSES.includes(value)
    ? REQUIREMENTS_PENDING_STATUS
    : value
}
