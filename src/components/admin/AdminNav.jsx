import { NavLink, useLocation, useParams } from 'react-router-dom'
import { DEMO_ORGANIZATION_SLUG } from '../../constants/demo'
import {
  adminDashboardPath,
  adminVolunteersPath,
  adminFormsPath,
  adminTeamPath,
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

  return (
    <nav className="admin-nav" aria-label="Admin">
      <NavLink to={adminDashboardPath(slug)} className={navClassName} end>
        Dashboard
      </NavLink>
      <NavLink to={adminVolunteersPath(slug)} className={navClassName}>
        Volunteers
      </NavLink>
      <NavLink to={adminFormsPath(slug)} className={navClassName}>
        Forms
      </NavLink>
      {slug !== DEMO_ORGANIZATION_SLUG ? (
        <NavLink to={adminTeamPath(slug)} className={navClassName}>
          Team
        </NavLink>
      ) : null}
    </nav>
  )
}
