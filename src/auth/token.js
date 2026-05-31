const ADMIN_STORAGE_KEY = 'servewell_admin_token'
const DEMO_ADMIN_STORAGE_KEY = 'servewell_demo_admin_token'

export function getAdminToken() {
  return localStorage.getItem(ADMIN_STORAGE_KEY)
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_STORAGE_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_STORAGE_KEY)
}

export function getDemoAdminToken() {
  return localStorage.getItem(DEMO_ADMIN_STORAGE_KEY)
}

export function setDemoAdminToken(token) {
  localStorage.setItem(DEMO_ADMIN_STORAGE_KEY, token)
}

export function clearDemoAdminToken() {
  localStorage.removeItem(DEMO_ADMIN_STORAGE_KEY)
}
