import { useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../auth/useAdminAuth'
import PageShell from '../PageShell'
import '../../styles/admin.css'

function isDemoAdminRoute(pathname) {
  return pathname.startsWith('/demo/admin')
}

export default function AdminLayout({ title, children }) {
  const { admin, logout } = useAdminAuth()
  const { pathname } = useLocation()
  const showStaffBar = !isDemoAdminRoute(pathname)

  return (
    <PageShell title={title} className="admin-page">
      {showStaffBar ? (
        <div className="admin-bar">
          <p className="admin-bar__user">
            Signed in as <strong>{admin?.email ?? 'Admin'}</strong>
          </p>
          <button
            type="button"
            className="admin-bar__logout button button--secondary"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      ) : null}
      {children}
    </PageShell>
  )
}
