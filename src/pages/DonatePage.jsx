import { Link } from 'react-router-dom'
import MarketingLayout from '../components/MarketingLayout'
import SupportEmailContact from '../components/SupportEmailContact'
import { PAYPAL_SUPPORT_URL } from '../constants/donations'

export default function DonatePage() {
  return (
    <MarketingLayout title="Support ServeWell">
      <header className="marketing-hero">
        <p className="marketing-eyebrow">Donate</p>
        <h1>Help ServeWell keep growing.</h1>
        <p className="marketing-lede">ServeWell helps churches and organizations connect willing people with meaningful places to serve. If it’s useful to your team, a voluntary contribution helps support the time and care that go into keeping it running and making it better.</p>
      </header>

      <section className="marketing-section" aria-labelledby="donate-purpose">
        <h2 id="donate-purpose">What your contribution supports</h2>
        <p>Behind ServeWell are hours spent building useful tools, listening to feedback, and helping people when something isn’t working. Your contribution helps support that ongoing work, including:</p>
        <ul className="marketing-demo-list">
          <li>Development time spent building and improving features.</li>
          <li>Troubleshooting, fixing bugs, and responding to support questions.</li>
          <li>Hosting and the services needed to keep ServeWell available.</li>
          <li>Ongoing maintenance as the needs of churches and organizations grow.</li>
        </ul>
        <p>Contributions support the person developing and maintaining ServeWell as well as the costs of operating it.</p>
      </section>

      <section className="marketing-section marketing-demo" aria-labelledby="donate-contribute">
        <h2 id="donate-contribute">Support the work behind ServeWell</h2>
        <p>ServeWell is not a nonprofit or tax-exempt charitable organization. Contributions support its development and operation and are not tax-deductible charitable donations for U.S. federal income tax purposes.</p>
        <p>Contributing is entirely optional. You don’t need to contribute to use ServeWell during beta, and contributions aren’t required for the ongoing free access promised to organizations that join during beta.</p>
        <div className="marketing-actions">
          {PAYPAL_SUPPORT_URL ? (
            <a className="button marketing-button-primary" href={PAYPAL_SUPPORT_URL} target="_blank" rel="noopener noreferrer">Support ServeWell with PayPal (opens in a new tab)</a>
          ) : (
            <button className="button marketing-button-primary" type="button" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>PayPal contributions coming soon</button>
          )}
        </div>
        <p className="marketing-note" style={{ marginTop: '1rem' }}>
          {PAYPAL_SUPPORT_URL
            ? 'Continue to PayPal to make your contribution.'
            : 'We’re finishing the PayPal setup. Contributions aren’t available on this page just yet.'}
        </p>
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
