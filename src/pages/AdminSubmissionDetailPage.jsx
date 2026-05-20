import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'

export default function AdminSubmissionDetailPage() {
  const { id } = useParams()

  return (
    <PageShell title="Submission detail">
      <p className="placeholder">
        Full submission view and status updates (Phase 9). Submission id:{' '}
        <strong>{id}</strong>
      </p>
      <p>
        <Link to="/admin">Back to dashboard</Link>
      </p>
    </PageShell>
  )
}
