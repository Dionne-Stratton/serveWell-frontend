import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'

/** @deprecated Former demo hub; `/demo` redirects to demo admin. */
export const DEMO_HUB_PATH = '/demo/admin'

export function demoVolunteerPath() {
  return '/demo/volunteer'
}

export function demoAdminLoginPath() {
  return '/demo/admin/login'
}

export function demoAdminPath() {
  return '/demo/admin'
}

export function demoAdminVolunteersPath() {
  return '/demo/admin/volunteers'
}

export function demoAdminFormsPath() {
  return '/demo/admin/forms'
}

export function demoAdminFormViewPath(formSlug) {
  return `/demo/admin/forms/${encodeURIComponent(formSlug)}`
}

export function demoAdminSubmissionPath(submissionId) {
  return `/demo/admin/submissions/${submissionId}`
}

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

export function organizationAdminVolunteersPath(organizationSlug) {
  return `/${organizationSlug}/admin/volunteers`
}

export function organizationPlanningCenterIntegrationPath(organizationSlug) {
  return `/${organizationSlug}/admin/integrations/planning-center`
}

export function organizationAdminFormsPath(organizationSlug) {
  return `/${organizationSlug}/admin/forms`
}

export function organizationAdminFormNewPath(organizationSlug) {
  return `/${organizationSlug}/admin/forms/new`
}

export function organizationAdminFormEditPath(organizationSlug, formSlug) {
  return `/${organizationSlug}/admin/forms/${encodeURIComponent(formSlug)}/edit`
}

export function adminFormsPath(organizationSlug) {
  if (!organizationSlug || organizationSlug === DEMO_ORGANIZATION_SLUG) {
    return demoAdminFormsPath()
  }
  return organizationAdminFormsPath(organizationSlug)
}

/** Demo: read-only setup view. Real orgs: full edit page. */
export function adminFormSetupPath(organizationSlug, formSlug) {
  if (!organizationSlug || organizationSlug === DEMO_ORGANIZATION_SLUG) {
    return demoAdminFormViewPath(formSlug)
  }
  return organizationAdminFormEditPath(organizationSlug, formSlug)
}

export function organizationPublicFormPath(organizationSlug, formSlug) {
  return `/${organizationSlug}/forms/${formSlug}`
}

export function organizationAdminFormSettingsPath(organizationSlug) {
  return organizationAdminFormsPath(organizationSlug)
}

export function organizationAdminSubmissionPath(organizationSlug, submissionId) {
  return `/${organizationSlug}/admin/submissions/${submissionId}`
}

/** Admin list/detail links from dashboard (demo hub or org-scoped routes). */
export function adminSubmissionDetailPath(organizationSlug, submissionId) {
  if (!organizationSlug || organizationSlug === DEMO_ORGANIZATION_SLUG) {
    return demoAdminSubmissionPath(submissionId)
  }
  return organizationAdminSubmissionPath(organizationSlug, submissionId)
}

export function adminDashboardPath(organizationSlug) {
  if (!organizationSlug || organizationSlug === DEMO_ORGANIZATION_SLUG) {
    return demoAdminPath()
  }
  return organizationAdminPath(organizationSlug)
}

export function adminVolunteersPath(organizationSlug) {
  if (!organizationSlug || organizationSlug === DEMO_ORGANIZATION_SLUG) {
    return demoAdminVolunteersPath()
  }
  return organizationAdminVolunteersPath(organizationSlug)
}

export function adminVolunteersFilteredPath(organizationSlug, status) {
  const base = adminVolunteersPath(organizationSlug)
  if (!status) {
    return base
  }
  return `${base}?status=${encodeURIComponent(status)}`
}

export function adminLoginPath(organizationSlug) {
  if (!organizationSlug || organizationSlug === DEMO_ORGANIZATION_SLUG) {
    return demoAdminPath()
  }
  return organizationAdminLoginPath(organizationSlug)
}

/** Org slug for admin UI links and API context on the current route. */
export function resolveAdminOrganizationSlug(pathname, paramSlug, authOrganizationSlug) {
  if (pathname.startsWith('/demo/admin')) {
    return DEMO_ORGANIZATION_SLUG
  }
  return paramSlug ?? authOrganizationSlug ?? null
}
