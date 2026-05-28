export const DEMO_ORGANIZATION_SLUG = 'demo'
export const DEMO_FORM_SLUG = 'general-serving'

/** Used only for silent demo dashboard sign-in (not shown in the UI). */
export const DEMO_ADMIN_EMAIL =
  import.meta.env.VITE_DEMO_ADMIN_EMAIL ?? 'church@example.com'
export const DEMO_ADMIN_PASSWORD =
  import.meta.env.VITE_DEMO_ADMIN_PASSWORD ?? 'temporary-password'
