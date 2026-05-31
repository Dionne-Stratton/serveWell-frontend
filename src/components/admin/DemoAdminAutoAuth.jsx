import { useEffect, useState } from 'react'
import { adminLogin, ApiError } from '../../api/client'
import { setDemoAdminToken } from '../../auth/token'
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from '../../constants/demo'
import PageShell from '../PageShell'
import { serveWellHomeBackLink } from '../../utils/pageBackLink'
import '../../styles/admin.css'

/**
 * Demo admin uses its own API token so it never replaces a real church sign-in.
 */
export default function DemoAdminAutoAuth({ children }) {
  const [ready, setReady] = useState(false)
  const [autoError, setAutoError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function ensureDemoAccess() {
      setAutoError('')
      try {
        const data = await adminLogin({
          email: DEMO_ADMIN_EMAIL,
          password: DEMO_ADMIN_PASSWORD,
        })
        if (cancelled) {
          return
        }
        setDemoAdminToken(data.token)
        setReady(true)
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

    ensureDemoAccess()

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready && !autoError) {
    return (
      <PageShell title="Demo dashboard" showHomeLink={false}>
        <p className="admin-loading">Opening demo dashboard…</p>
      </PageShell>
    )
  }

  if (!ready) {
    return (
      <PageShell title="Demo dashboard" backLink={serveWellHomeBackLink()}>
        <p className="serve-load-error">{autoError}</p>
      </PageShell>
    )
  }

  return children
}
