import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'
import { DEMO_HUB_PATH } from './organizationPaths'

export function demoHomeBackLink() {
  return { to: DEMO_HUB_PATH, label: '← Demo home' }
}

export function serveWellHomeBackLink() {
  return { to: '/', label: 'ServeWell home' }
}

/** @deprecated Use serveWellHomeBackLink — org root no longer has a public landing page. */
export function organizationHomeBackLink() {
  return serveWellHomeBackLink()
}

/** Back link for admin surfaces (demo sandbox vs real church). */
export function resolveAdminPageBackLink(pathname, organizationSlug, organization) {
  if (pathname.startsWith('/demo/admin')) {
    return demoHomeBackLink()
  }

  const slug = organizationSlug ?? organization?.slug

  if (slug && slug !== DEMO_ORGANIZATION_SLUG) {
    return serveWellHomeBackLink()
  }

  return null
}
