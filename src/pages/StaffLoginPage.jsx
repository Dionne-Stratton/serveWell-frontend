import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAdminAuth } from '../auth/useAdminAuth'
import PageShell from '../components/PageShell'
import { adminDashboardPath } from '../utils/organizationPaths'
import '../styles/admin.css'

export default function StaffLoginPage() {
  const { admin, organization, loading, login } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && admin && organization?.slug) {
      navigate(adminDashboardPath(organization.slug), { replace: true })
    }
  }, [admin, loading, navigate, organization?.slug])

  if (loading) {
    return (
      <PageShell title="Staff sign in" showHomeLink={false}>
        <p className="admin-loading">Checking your session…</p>
      </PageShell>
    )
  }

  if (admin && organization?.slug) {
    return <Navigate to={adminDashboardPath(organization.slug)} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const session = await login(email.trim(), password)
      const slug = session.organization?.slug
      if (!slug) {
        setError('Signed in, but your organization could not be loaded.')
        return
      }
      navigate(
        typeof location.state?.from === 'string'
          ? location.state.from
          : adminDashboardPath(slug),
        { replace: true },
      )
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to sign in. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="Staff sign in" backLink={{ to: '/', label: '← Home' }}>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <p className="lede">
          Sign in to your church&apos;s admin dashboard.
        </p>
        <div className="admin-field">
          <label className="admin-label" htmlFor="staff-email">
            Email
          </label>
          <input
            id="staff-email"
            className="admin-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="staff-password">
            Password
          </label>
          <input
            id="staff-password"
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <p className="admin-error">{error}</p> : null}
        <button
          type="submit"
          className={`admin-button${submitting ? ' admin-button--busy' : ''}`}
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="admin-form-footer">
          New to ServeWell?{' '}
          <Link to="/signup">Create your church workspace</Link>
        </p>
      </form>
    </PageShell>
  )
}
