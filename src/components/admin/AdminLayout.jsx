import { useAdminAuth } from '../../auth/useAdminAuth'
import PageShell from '../PageShell'
import '../../styles/admin.css'

export default function AdminLayout({ title, children }) {
  const { admin, logout } = useAdminAuth()

  return (
    <PageShell title={title}>
      <div className="admin-bar">
        <p className="admin-bar__user">
          Signed in as <strong>{admin?.email ?? 'Admin'}</strong>
        </p>
        <button type="button" className="admin-bar__logout button button--secondary" onClick={logout}>
          Log out
        </button>
      </div>
      {children}
    </PageShell>
  )
}
