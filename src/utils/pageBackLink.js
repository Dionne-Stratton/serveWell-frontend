import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'

export function serveWellHomeBackLink() {
  return { to: '/', label: 'ServeWell home' }
}

/** Back link for admin surfaces (demo sandbox vs real church). */
export function resolveAdminPageBackLink(pathname, organizationSlug, organization) {
  if (pathname.startsWith('/demo/admin')) {
    return serveWellHomeBackLink()
  }

  const slug = organizationSlug ?? organization?.slug

  if (slug && slug !== DEMO_ORGANIZATION_SLUG) {
    return serveWellHomeBackLink()
  }

  return null
}
