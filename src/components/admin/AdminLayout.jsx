import { useLocation, useParams } from 'react-router-dom'
import { useAdminAuth } from '../../auth/useAdminAuth'
import PageShell from '../PageShell'
import AdminNav from './AdminNav'
import { resolveAdminPageBackLink } from '../../utils/pageBackLink'
import '../../styles/admin.css'

function isDemoAdminRoute(pathname) {
  return pathname.startsWith('/demo/admin')
}

function isAdminAppRoute(pathname) {
  return isDemoAdminRoute(pathname) || /\/admin(\/|$)/.test(pathname)
}

export default function AdminLayout({ title, children }) {
  const { admin, logout, organization } = useAdminAuth()
  const { pathname } = useLocation()
  const { organizationSlug } = useParams()
  const showStaffBar = !isDemoAdminRoute(pathname)
  const showAdminNav = isAdminAppRoute(pathname)
  const backLink = resolveAdminPageBackLink(pathname, organizationSlug, organization)

  return (
    <PageShell
      title={title}
      className="admin-page"
      backLink={backLink}
      headerEnd={
        showStaffBar ? (
          <div className="admin-top-account">
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
        ) : null
      }
    >
      {showAdminNav ? (
        <div className="admin-bar admin-bar--nav">
          <AdminNav />
        </div>
      ) : null}
      {children}
    </PageShell>
  )
}
