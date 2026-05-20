const STORAGE_KEY = 'servewell_admin_token'

export function getAdminToken() {
  return localStorage.getItem(STORAGE_KEY)
}

export function setAdminToken(token) {
  localStorage.setItem(STORAGE_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(STORAGE_KEY)
}
