import { clearAdminToken, clearDemoAdminToken } from './token'
import { resolveAdminLoginPathFromPathname } from './resolveAdminLoginRedirect'
import { apiAuthScopeForPathname } from './apiAuthScope'

export const ADMIN_SESSION_EXPIRED_EVENT = 'servewell:admin-session-expired'

export function notifyAdminSessionExpired(pathname = typeof window !== 'undefined' ? window.location.pathname : '') {
  if (apiAuthScopeForPathname(pathname) === 'demo') {
    clearDemoAdminToken()
  } else {
    clearAdminToken()
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(ADMIN_SESSION_EXPIRED_EVENT, {
        detail: { loginPath: resolveAdminLoginPathFromPathname(pathname) },
      }),
    )
  }
}

export function isAdminSessionExpiredError(error) {
  return error?.name === 'ApiError' && error?.code === 'SESSION_EXPIRED'
}
