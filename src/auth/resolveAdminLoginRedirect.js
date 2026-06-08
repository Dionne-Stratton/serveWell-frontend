import { demoAdminPath } from '../utils/organizationPaths'

/**
 * Where to send staff after an expired or invalid admin session, based on current URL.
 */
export function resolveAdminLoginPathFromPathname(pathname) {
  if (typeof pathname !== 'string' || !pathname) {
    return '/login'
  }

  if (pathname.startsWith('/demo/admin')) {
    return demoAdminPath()
  }

  const orgAdminMatch = pathname.match(/^\/([^/]+)\/admin(?:\/|$)/)
  if (orgAdminMatch?.[1]) {
    return `/${encodeURIComponent(orgAdminMatch[1])}/admin/login`
  }

  return '/login'
}
