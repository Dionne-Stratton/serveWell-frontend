import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import SupportEmailContact from './SupportEmailContact'
import { demoAdminPath } from '../utils/organizationPaths'
import '../styles/marketing.css'

export default function MarketingLayout({ title, children }) {
  const { pathname, hash } = useLocation()
  const mainRef = useRef(null)

  useEffect(() => {
    document.title = title === 'ServeWell' ? 'ServeWell | Connect people with places to serve' : `${title} | ServeWell`
    mainRef.current?.focus({ preventScroll: true })
    const section = hash ? document.getElementById(hash.slice(1)) : null
    if (section) section.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash, title])

  return (
    <div className="marketing-site">
      <a className="marketing-skip" href="#marketing-main">Skip to content</a>
      <header className="marketing-header">
        <Link to="/" className="marketing-brand" aria-label="ServeWell home">
          <img src="/logo.png" alt="" width={40} height={40} />
          <span>ServeWell</span>
        </Link>
        <nav className="marketing-nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <Link to={demoAdminPath()}>Try the demo</Link>
          <Link to="/login">Staff sign in</Link>
        </nav>
      </header>
      <main id="marketing-main" className="marketing-main" ref={mainRef} tabIndex={-1}>{children}</main>
      <footer className="marketing-footer">
        <p>Questions or suggestions? <SupportEmailContact /></p>
        <p>Already have a workspace? <Link to="/login">Staff sign in</Link></p>
      </footer>
    </div>
  )
}
