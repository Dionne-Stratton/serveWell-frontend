import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

export default function AdminDashboardPage() {
  return (
    <PageShell title="Admin dashboard">
      <p className="placeholder">
        Submission list, filters, and search (Phase 9). Auth protection will be added
        in Phase 7.
      </p>
      <p>
        <Link to="/admin/submissions/1">Sample submission detail (id: 1)</Link>
      </p>
    </PageShell>
  )
}
