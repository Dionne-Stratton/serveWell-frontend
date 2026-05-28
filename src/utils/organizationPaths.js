import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'

/** Demo sandbox home (not the same page as `/${DEMO_ORGANIZATION_SLUG}` org landing). */
export const DEMO_HUB_PATH = '/demo'

export function demoVolunteerPath() {
  return '/demo/volunteer'
}

export function demoAdminLoginPath() {
  return '/demo/admin/login'
}

export function demoAdminPath() {
  return '/demo/admin'
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

export function adminLoginPath(organizationSlug) {
  if (!organizationSlug || organizationSlug === DEMO_ORGANIZATION_SLUG) {
    return demoAdminPath()
  }
  return organizationAdminLoginPath(organizationSlug)
}
