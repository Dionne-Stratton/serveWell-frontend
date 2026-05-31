import { Link, useParams } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout'
import { adminDashboardPath } from '../utils/organizationPaths'

export default function AdminPlanningCenterIntegrationPage() {
  const { organizationSlug } = useParams()

  return (
    <AdminLayout title="Planning Center">
      <p className="admin-back">
        <Link to={adminDashboardPath(organizationSlug)}>← Back to dashboard</Link>
      </p>
      <p className="admin-muted">Planning Center is not connected yet.</p>
    </AdminLayout>
  )
}
