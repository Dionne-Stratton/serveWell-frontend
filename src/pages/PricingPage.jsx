import { Link } from 'react-router-dom'
import MarketingLayout from '../components/MarketingLayout'
import SupportEmailContact from '../components/SupportEmailContact'

export default function PricingPage() {
  return (
    <MarketingLayout title="Pricing">
      <header className="marketing-hero">
        <p className="marketing-eyebrow">Pricing</p>
        <h1>Free during beta. A thank-you that lasts beyond it.</h1>
        <p className="marketing-lede">ServeWell is currently in beta, and any church or organization can sign up and use it for free. Your experience and feedback will help shape what comes next.</p>
        <div className="marketing-actions">
          <Link className="button marketing-button-primary" to="/signup">Sign up your church or organization</Link>
          <Link className="button button--secondary" to="/demo">Try the demo</Link>
        </div>
      </header>

      <section className="marketing-section marketing-demo" aria-labelledby="pricing-beta">
        <p className="marketing-eyebrow">For organizations joining during beta</p>
        <h2 id="pricing-beta">Keep using your beta features for free</h2>
        <p>Organizations that join during beta can continue using the features included at the end of beta for free, even after paid plans are introduced. That ongoing free access is our thank-you for helping ServeWell grow.</p>
        <p>This includes the features in place when beta ends. New features introduced afterward may be offered as optional paid additions.</p>
      </section>

      <section className="marketing-section" aria-labelledby="pricing-future">
        <h2 id="pricing-future">What will future plans look like?</h2>
        <p>Future pricing, plan options, and which features will be free for organizations joining after beta haven’t been decided yet. We’re taking time to learn how churches and organizations use ServeWell and what they need before setting those details.</p>
        <p>There isn’t a set beta end date to share yet. The ongoing free-access promise above applies to organizations that join during beta.</p>
      </section>

      <section className="marketing-section" aria-labelledby="pricing-feedback">
        <h2 id="pricing-feedback">Help us make ServeWell more useful</h2>
        <p>Tell us what works well, what feels confusing, and what would make serving easier for your team. Feature requests, bug reports, and questions are all welcome.</p>
        <p>Email <SupportEmailContact /> with your feedback or any problems you encounter. If something isn’t working, a description of what you were trying to do and what happened will help us look into it.</p>
      </section>

      <section className="marketing-section" aria-labelledby="pricing-support">
        <h2 id="pricing-support">Want to support the work?</h2>
        <p>If ServeWell is useful to your organization and you’d like to help support its continued development, voluntary contributions will be welcome. Donation options are coming soon, and contributing is optional.</p>
        <Link className="marketing-text-link" to="/donate">Learn about supporting ServeWell</Link>
      </section>
    </MarketingLayout>
  )
}
