export function organizationLandingPath(organizationSlug) {
  return `/${organizationSlug}`
}

export function organizationVolunteerPath(organizationSlug) {
  return `/${organizationSlug}/volunteer`
}

export function organizationAdminLoginPath(organizationSlug) {
  return `/${organizationSlug}/admin/login`
}

export function organizationAdminPath(organizationSlug) {
  return `/${organizationSlug}/admin`
}

export function organizationAdminSubmissionPath(organizationSlug, submissionId) {
  return `/${organizationSlug}/admin/submissions/${submissionId}`
}
