import { NavLink, useParams } from 'react-router-dom'
import { DEMO_ORGANIZATION_SLUG } from '../../constants/demo'
import {
  adminDashboardPath,
  organizationAdminFormsPath,
} from '../../utils/organizationPaths'

function navClassName({ isActive }) {
  return isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link'
}

export default function AdminNav() {
  const { organizationSlug } = useParams()

  if (!organizationSlug || organizationSlug === DEMO_ORGANIZATION_SLUG) {
    return null
  }

  return (
    <nav className="admin-nav" aria-label="Admin">
      <NavLink to={adminDashboardPath(organizationSlug)} className={navClassName} end>
        Dashboard
      </NavLink>
      <NavLink to={organizationAdminFormsPath(organizationSlug)} className={navClassName}>
        Forms
      </NavLink>
    </nav>
  )
}
