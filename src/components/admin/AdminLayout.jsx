import { Link, useLocation, useParams } from 'react-router-dom'
import { useAdminAuth } from '../../auth/useAdminAuth'
import PageShell from '../PageShell'
import AdminNav from './AdminNav'
import {
  adminProfilePath,
  resolveAdminOrganizationSlug,
} from '../../utils/organizationPaths'
import { resolveAdminPageBackLink } from '../../utils/pageBackLink'
import '../../styles/admin.css'

function isDemoAdminRoute(pathname) {
  return pathname.startsWith('/demo/admin')
}

function isAdminAppRoute(pathname) {
  return isDemoAdminRoute(pathname) || /\/admin(\/|$)/.test(pathname)
}

export default function AdminLayout({ children }) {
  const { admin, organization, logout } = useAdminAuth()
  const { pathname } = useLocation()
  const { organizationSlug: organizationSlugParam } = useParams()
  const isDemoAdmin = isDemoAdminRoute(pathname)
  const showAdminNav = isAdminAppRoute(pathname)
  const navSlug = resolveAdminOrganizationSlug(
    pathname,
    organizationSlugParam,
    organization?.slug,
  )
  const backLink = resolveAdminPageBackLink(pathname, organizationSlugParam, organization)
  const profilePath = navSlug ? adminProfilePath(navSlug) : null
  const profileLabel = admin?.displayName?.trim() || admin?.email || 'Account'
  const churchTitle = organization?.name?.trim() || null

  const headerAccount = (
    <div className="admin-top-account">
      {profilePath ? (
        <Link
          to={profilePath}
          className="admin-profile-link"
          aria-label={`Your account (${profileLabel})`}
          title={profileLabel}
        >
          <span className="admin-profile-link__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
              <path
                fill="currentColor"
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
          </span>
        </Link>
      ) : null}
      {isDemoAdmin ? (
        <span className="admin-bar__user admin-bar__user--compact">
          <strong>Demo</strong>
        </span>
      ) : (
        <button
          type="button"
          className="admin-bar__logout button button--secondary"
          onClick={logout}
        >
          Log out
        </button>
      )}
    </div>
  )

  return (
    <PageShell
      title={churchTitle}
      className="admin-page"
      backLink={backLink}
      headerEnd={headerAccount}
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
