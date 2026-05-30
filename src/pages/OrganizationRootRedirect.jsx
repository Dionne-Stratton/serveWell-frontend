import { Navigate, useParams } from 'react-router-dom'
import { useAdminAuth } from '../auth/useAdminAuth'
import { adminDashboardPath } from '../utils/organizationPaths'

export default function OrganizationRootRedirect() {
  const { organizationSlug } = useParams()
  const { admin, organization, loading } = useAdminAuth()

  if (loading) {
    return null
  }

  if (admin && organization?.slug) {
    return <Navigate to={adminDashboardPath(organization.slug)} replace />
  }

  if (admin && organizationSlug) {
    return <Navigate to={adminDashboardPath(organizationSlug)} replace />
  }

  return <Navigate to="/" replace />
}
