import { Link } from 'react-router-dom'
import MarketingLayout from '../components/MarketingLayout'
import SupportEmailContact from '../components/SupportEmailContact'

export default function DonatePage() {
  return (
    <MarketingLayout title="Support ServeWell">
      <header className="marketing-hero">
        <p className="marketing-eyebrow">Donate</p>
        <h1>Help ServeWell keep growing.</h1>
        <p className="marketing-lede">ServeWell exists to make it easier for churches and organizations to connect willing people with meaningful places to serve. If it has helped your team, you’ll soon have a way to support the work behind it.</p>
      </header>

      <section className="marketing-section marketing-demo" aria-labelledby="donate-coming">
        <h2 id="donate-coming">Donation options are coming soon</h2>
        <p>We’re still setting up a way to contribute. Once it’s ready, you’ll be able to make a voluntary contribution to help support ServeWell’s operation and continued development.</p>
        <p>Contributing is optional. You don’t need to donate to use ServeWell during beta, and donations aren’t required for the ongoing free access promised to organizations that join during beta.</p>
        <Link className="marketing-text-link" to="/pricing">Read about beta access and pricing</Link>
      </section>

      <section className="marketing-section" aria-labelledby="donate-feedback">
        <h2 id="donate-feedback">Your feedback helps, too</h2>
        <p>Trying ServeWell and sharing your experience is a valuable way to help it grow. Tell us about the features you need, any bugs you find, or anything that could work better for your team.</p>
        <p>Send feedback or questions to <SupportEmailContact />. Thank you for being part of ServeWell’s early days.</p>
        <div className="marketing-actions">
          <Link className="button marketing-button-primary" to="/signup">Sign up your church or organization</Link>
          <Link className="button button--secondary" to="/demo">Try the demo</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
