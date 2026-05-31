import { getAdminToken, getDemoAdminToken } from './token'

function isDemoAdminPathname(pathname) {
  return typeof pathname === 'string' && pathname.startsWith('/demo/admin')
}

/** @typedef {'real' | 'demo'} ApiAuthScope */

export function apiAuthScopeForPathname(pathname) {
  return isDemoAdminPathname(pathname) ? 'demo' : 'real'
}

export function getActiveAdminToken(pathname = typeof window !== 'undefined' ? window.location.pathname : '') {
  return apiAuthScopeForPathname(pathname) === 'demo'
    ? getDemoAdminToken()
    : getAdminToken()
}

export function getApiAuthScope() {
  return apiAuthScopeForPathname(
    typeof window !== 'undefined' ? window.location.pathname : '',
  )
}
