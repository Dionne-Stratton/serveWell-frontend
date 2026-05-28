import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'
import { DEMO_HUB_PATH, organizationLandingPath } from './organizationPaths'

export function demoHomeBackLink() {
  return { to: DEMO_HUB_PATH, label: '← Demo home' }
}

export function organizationHomeBackLink(organizationSlug, organizationName) {
  const labelName = organizationName?.trim() || 'Organization'
  return {
    to: organizationLandingPath(organizationSlug),
    label: `← ${labelName}`,
  }
}

/** Back link for admin surfaces (demo sandbox vs real church). */
export function resolveAdminPageBackLink(pathname, organizationSlug, organization) {
  if (pathname.startsWith('/demo/admin')) {
    return demoHomeBackLink()
  }

  const slug = organizationSlug ?? organization?.slug

  if (slug && slug !== DEMO_ORGANIZATION_SLUG) {
    return organizationHomeBackLink(slug, organization?.name)
  }

  return null
}
