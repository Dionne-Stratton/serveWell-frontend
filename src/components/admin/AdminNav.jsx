import { NavLink, useLocation, useParams } from 'react-router-dom'
import { DEMO_ORGANIZATION_SLUG } from '../../constants/demo'
import {
  adminDashboardPath,
  adminVolunteersPath,
  organizationAdminFormsPath,
} from '../../utils/organizationPaths'

function navClassName({ isActive }) {
  return isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link'
}

function resolveNavOrganizationSlug(organizationSlug, pathname) {
  if (organizationSlug && organizationSlug !== DEMO_ORGANIZATION_SLUG) {
    return organizationSlug
  }

  if (pathname.startsWith('/demo/admin')) {
    return DEMO_ORGANIZATION_SLUG
  }

  return organizationSlug ?? null
}

export default function AdminNav() {
  const { organizationSlug } = useParams()
  const { pathname } = useLocation()
  const slug = resolveNavOrganizationSlug(organizationSlug, pathname)

  if (!slug) {
    return null
  }

  const isDemo = slug === DEMO_ORGANIZATION_SLUG

  return (
    <nav className="admin-nav" aria-label="Admin">
      <NavLink to={adminDashboardPath(slug)} className={navClassName} end>
        Dashboard
      </NavLink>
      <NavLink to={adminVolunteersPath(slug)} className={navClassName}>
        Volunteers
      </NavLink>
      {!isDemo ? (
        <NavLink to={organizationAdminFormsPath(slug)} className={navClassName}>
          Forms
        </NavLink>
      ) : null}
    </nav>
  )
}
