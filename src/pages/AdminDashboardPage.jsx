import { Link } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout'

export default function AdminDashboardPage() {
  return (
    <AdminLayout title="Admin dashboard">
      <p className="placeholder">
        Submission list, filters, and search (Phase 9). You are signed in; volunteer data
        will load here next.
      </p>
      <p>
        <Link to="/admin/submissions/1">Sample submission detail (id: 1)</Link>
      </p>
    </AdminLayout>
  )
}
