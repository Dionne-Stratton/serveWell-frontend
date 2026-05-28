import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import {
  demoAdminPath,
  demoVolunteerPath,
} from '../utils/organizationPaths'

export default function DemoHomePage() {
  return (
    <PageShell title="Demo organization" showHomeLink={false}>
      <p className="lede">
        A simple place for people to share serving interest and for church staff to
        review submissions.
      </p>
      <div className="action-cards">
        <section className="action-card">
          <h2>Volunteer form</h2>
          <p>For anyone who wants to express interest in serving.</p>
          <Link className="button button--secondary" to={demoVolunteerPath()}>
            Open volunteer form
          </Link>
        </section>
        <section className="action-card">
          <h2>Admin</h2>
          <p>For staff to review submissions and update follow-up status.</p>
          <Link className="button button--secondary" to={demoAdminPath()}>
            Admin dashboard
          </Link>
        </section>
      </div>
    </PageShell>
  )
}
