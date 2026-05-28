import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { useAdminAuth } from '../../auth/useAdminAuth'
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_ORGANIZATION_SLUG,
} from '../../constants/demo'
import PageShell from '../PageShell'
import { demoHomeBackLink } from '../../utils/pageBackLink'
import AdminRouteGuard from './AdminRouteGuard'
import '../../styles/admin.css'

/**
 * Demo sandbox admin: sign in automatically so testers never see a login form.
 * Real churches still use /:slug/admin/login.
 */
export default function DemoAdminAutoAuth({ children }) {
  const { admin, loading, login } = useAdminAuth()
  const [autoError, setAutoError] = useState('')

  useEffect(() => {
    if (loading || admin) {
      return undefined
    }

    let cancelled = false

    async function signInForDemo() {
      setAutoError('')
      try {
        await login(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)
      } catch (err) {
        if (!cancelled) {
          setAutoError(
            err instanceof ApiError
              ? err.message
              : 'Unable to open the demo dashboard. Is the API running?',
          )
        }
      }
    }

    signInForDemo()

    return () => {
      cancelled = true
    }
  }, [admin, loading, login])

  if (loading || (!admin && !autoError)) {
    return (
      <PageShell title="Demo dashboard" showHomeLink={false}>
        <p className="admin-loading">Opening demo dashboard…</p>
      </PageShell>
    )
  }

  if (!admin) {
    return (
      <PageShell title="Demo dashboard" backLink={demoHomeBackLink()}>
        <p className="serve-load-error">{autoError}</p>
      </PageShell>
    )
  }

  return (
    <AdminRouteGuard organizationSlug={DEMO_ORGANIZATION_SLUG}>
      {children}
    </AdminRouteGuard>
  )
}
