import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

export default function LandingPage() {
  return (
    <PageShell title="ServeWell" showHomeLink={false}>
      <p className="lede">
        ServeWell helps churches connect people with meaningful serving opportunities.
        This site is under construction; explore the working demo below.
      </p>
      <div className="action-cards">
        <section className="action-card">
          <h2>Product demo</h2>
          <p>Volunteer intake and admin tools used in development.</p>
          <Link className="button button--secondary" to="/demo">
            Open demo
          </Link>
        </section>
      </div>
    </PageShell>
  )
}
