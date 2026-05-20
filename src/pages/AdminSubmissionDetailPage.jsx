import { Link, useParams } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout'

export default function AdminSubmissionDetailPage() {
  const { id } = useParams()

  return (
    <AdminLayout title="Submission detail">
      <p className="placeholder">
        Full submission view (Phase 9). Submission id: <strong>{id}</strong>
      </p>
      <p>
        <Link to="/admin">Back to dashboard</Link>
      </p>
    </AdminLayout>
  )
}
