import { Link } from 'react-router-dom'
import MarketingLayout from '../components/MarketingLayout'
import { demoAdminPath } from '../utils/organizationPaths'

export default function AboutPage() {
  return (
    <MarketingLayout title="About ServeWell">
      <header className="marketing-hero">
        <p className="marketing-eyebrow">About ServeWell</p>
        <h1>Willing hearts. Meaningful places to serve.</h1>
        <p className="marketing-lede">Helping people find their place in ministry starts with getting to know them. ServeWell helps churches carry that conversation from “I’d like to help” to a place on the team.</p>
      </header>

      <section className="marketing-section" aria-labelledby="about-why">
        <h2 id="about-why">When someone says, “I’d love to help”</h2>
        <p>Someone wants to serve, but they’re not sure where they fit. A ministry leader needs help, but doesn’t yet know who is interested or available. In between are conversations, forms, follow-ups, and schedules that need to come together.</p>
        <p>That’s the challenge ServeWell is designed to address: making it easier to connect people who want to help with the ministries that need them. It gives church staff a place to gather serving interests, get to know potential volunteers, and plan the next steps.</p>
      </section>

      <section className="marketing-section" aria-labelledby="about-how">
        <h2 id="about-how">From the first introduction to the serving schedule</h2>
        <ol className="marketing-steps">
          <li><h3>Make it easy to raise a hand</h3><p>Share a volunteer form where people can tell you about their interests, experience, and availability. Tailor forms to the serving opportunities in your church.</p></li>
          <li><h3>Keep the conversation moving</h3><p>Review responses, keep staff notes, and track each person’s progress as you follow up. Keep the details together so a willing volunteer doesn’t get lost between conversations.</p></li>
          <li><h3>Bring the team together</h3><p>Build reusable schedule templates, define the roles that need to be filled, and create schedules with volunteer assignments. Review the plan, make adjustments, and publish it when you’re ready.</p></li>
        </ol>
        <p>For churches using Planning Center, ServeWell also offers a connection for bringing volunteer information into the tools your team already uses.</p>
      </section>

      <section id="demo" className="marketing-section marketing-demo" aria-labelledby="about-demo">
        <p className="marketing-eyebrow">Take a look around</p>
        <h2 id="about-demo">See both sides of ServeWell</h2>
        <p>You don’t need to create a church account to explore the demo. Open the staff dashboard to see how volunteer responses, forms, and schedules are organized, or start with the volunteer form to see the experience someone in your church would have.</p>
        <ul className="marketing-demo-list">
          <li>Explore the dashboard and volunteer responses.</li>
          <li>Preview the volunteer form and see how it is set up.</li>
          <li>Browse the scheduling tools and see how serving roles come together.</li>
        </ul>
        <p className="marketing-note">Some demo features are limited: form editing is disabled, and Planning Center connections are available through a church workspace. If you try submitting the demo form, use sample information rather than anyone’s private details.</p>
        <div className="marketing-actions">
          <Link className="button marketing-button-primary" to={demoAdminPath()}>Explore the staff demo</Link>
          <Link className="button button--secondary" to="/demo/volunteer">Try the volunteer form</Link>
        </div>
      </section>

      <section className="marketing-section marketing-start" aria-labelledby="about-start">
        <h2 id="about-start">Help your people take their next step</h2>
        <p>When you’re ready, create a workspace for your church and start building the forms and schedules that fit your ministries.</p>
        <Link className="button marketing-button-primary" to="/signup">Sign up your church</Link>
      </section>
    </MarketingLayout>
  )
}
