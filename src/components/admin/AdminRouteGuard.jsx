import { useParams } from 'react-router-dom'
import RequireAdmin from './RequireAdmin'

export default function AdminRouteGuard({ children, organizationSlug: organizationSlugProp }) {
  const { organizationSlug: organizationSlugParam } = useParams()
  const organizationSlug = organizationSlugProp ?? organizationSlugParam
  return <RequireAdmin organizationSlug={organizationSlug}>{children}</RequireAdmin>
}
