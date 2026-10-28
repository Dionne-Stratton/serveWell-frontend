import { Link } from 'react-router-dom'
import MarketingLayout from '../components/MarketingLayout'
import { demoAdminPath } from '../utils/organizationPaths'

export default function LandingPage() {
  return (
    <MarketingLayout title="ServeWell">
      <header className="marketing-hero">
        <p className="marketing-eyebrow">Volunteer coordination for churches and organizations</p>
        <h1>Help people find their place to serve.</h1>
        <p className="marketing-lede">Gather volunteer interests, follow up with people, and bring your serving schedules together. ServeWell helps your church or organization move from “I’d like to help” to a connected, organized team.</p>
        <div className="marketing-actions">
          <Link className="button marketing-button-primary" to="/signup">Sign up your church or organization</Link>
          <Link className="button button--secondary" to={demoAdminPath()}>Try the demo</Link>
        </div>
        <p className="marketing-hero-note">Explore the demo without creating an organization account.</p>
      </header>

      <section className="marketing-section" aria-labelledby="landing-how">
        <h2 id="landing-how">Less to keep track of. More room to connect.</h2>
        <div className="marketing-features">
          <div><h3>Welcome willing volunteers</h3><p>Give people a simple form to share where they’d like to serve and when they’re available.</p></div>
          <div><h3>Follow up with confidence</h3><p>Keep responses, staff notes, and next steps together as you help people find the right fit.</p></div>
          <div><h3>Plan your serving teams</h3><p>Create schedule templates, fill serving roles, and review your team’s assignments before publishing.</p></div>
        </div>
        <Link className="marketing-text-link" to="/about">Learn more about ServeWell</Link>
      </section>

      <section className="marketing-section marketing-demo" aria-labelledby="landing-demo">
        <h2 id="landing-demo">See how it could work for your church or organization</h2>
        <p>Take a look around the demo dashboard, explore volunteer responses and scheduling, or try the volunteer form. Start with a look inside before setting up your own workspace.</p>
        <div className="marketing-actions">
          <Link className="button marketing-button-primary" to={demoAdminPath()}>Explore the demo</Link>
          <Link className="button button--secondary" to="/about#demo">What can I try?</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
