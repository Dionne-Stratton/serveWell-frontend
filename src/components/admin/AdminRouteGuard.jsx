import { useParams } from 'react-router-dom'
import RequireAdmin from './RequireAdmin'

export default function AdminRouteGuard({ children }) {
  const { organizationSlug } = useParams()
  return <RequireAdmin organizationSlug={organizationSlug}>{children}</RequireAdmin>
}
