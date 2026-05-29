/** Suggest a URL slug from a church or organization display name. */
export function suggestOrganizationSlug(name) {
  if (typeof name !== 'string') {
    return ''
  }

  return name
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48)
}
