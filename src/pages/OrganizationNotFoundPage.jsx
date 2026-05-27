import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

export default function OrganizationNotFoundPage({ organizationSlug }) {
  return (
    <PageShell title="Organization not found" showHomeLink>
      <p className="lede">
        {organizationSlug
          ? `We could not find an organization for “${organizationSlug}”.`
          : 'We could not find that organization.'}
      </p>
      <p>
        <Link className="button button--secondary" to="/">
          Back to ServeWell home
        </Link>
      </p>
    </PageShell>
  )
}
