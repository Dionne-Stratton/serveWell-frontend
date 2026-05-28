import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../auth/useAdminAuth'
import {
  adminDashboardPath,
  adminLoginPath,
} from '../../utils/organizationPaths'
import PageShell from '../PageShell'
import '../../styles/admin.css'

export default function RequireAdmin({ children, organizationSlug }) {
  const { admin, organization, loading } = useAdminAuth()
  const location = useLocation()

  const loginPath = adminLoginPath(organizationSlug)

  if (loading) {
    return <p className="admin-loading">Checking your session…</p>
  }

  if (!admin) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  if (organizationSlug && organization?.slug && organization.slug !== organizationSlug) {
    return (
      <PageShell title="Admin access" showHomeLink>
        <p className="lede">
          You are signed in for {organization.name}, not this organization&apos;s dashboard.
        </p>
        <p>
          <Link
            className="button button--secondary"
            to={adminDashboardPath(organization.slug)}
          >
            Go to {organization.name} admin
          </Link>
        </p>
      </PageShell>
    )
  }

  return children
}
