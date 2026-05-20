const defaultBaseUrl = 'http://localhost:8787'

export function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_URL ?? defaultBaseUrl
  return url.replace(/\/$/, '')
}

export class ApiError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

async function parseJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    throw new ApiError('The server returned an invalid response.', 'INVALID_RESPONSE')
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  })

  const body = await parseJsonResponse(response)

  if (!body.success) {
    const message = body.error?.message ?? 'Something went wrong.'
    const code = body.error?.code
    throw new ApiError(message, code)
  }

  return body.data
}

export function fetchServingAreas() {
  return apiRequest('/api/serving-areas')
}

export function createVolunteerSubmission(payload) {
  return apiRequest('/api/volunteer-submissions', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
