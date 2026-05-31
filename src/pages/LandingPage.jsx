import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { demoAdminPath } from '../utils/organizationPaths'

export default function LandingPage() {
  return (
    <PageShell title="ServeWell" titleLogo showHomeLink={false}>
      <p className="lede">
        ServeWell helps churches connect people with meaningful serving opportunities.
        Create a workspace for your church or explore the product demo.
      </p>
      <div className="action-cards">
        <section className="action-card">
          <h2>Get started</h2>
          <p>Create your church workspace and admin account.</p>
          <Link className="button button--secondary" to="/signup">
            Sign up your church
          </Link>
        </section>
        <section className="action-card">
          <h2>Product demo</h2>
          <p>Volunteer intake and admin tools used in development.</p>
          <Link className="button button--secondary" to={demoAdminPath()}>
            Open demo
          </Link>
        </section>
      </div>
      <p className="landing-signin">
        Already registered? <Link to="/login">Staff sign in</Link>
      </p>
    </PageShell>
  )
}
