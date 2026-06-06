import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, requestPasswordReset } from '../api/client'
import PageShell from '../components/PageShell'
import '../styles/admin.css'

export default function ForgotPasswordPage() {
  const [organizationSlug, setOrganizationSlug] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      const data = await requestPasswordReset(email.trim())
      setMessage(data.message ?? 'Check your email for reset instructions.')
      setEmail('')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to send reset instructions. Try again later.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="Forgot password" className="admin-auth-page" showHomeLink={false}>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <p className="lede">
          Enter the email you use to sign in. We will send a reset link if an account
          exists.
        </p>
        <label className="admin-label" htmlFor="forgot-org-slug">
          Church URL slug
        </label>
        <input
          id="forgot-org-slug"
          className="admin-input"
          type="text"
          value={organizationSlug}
          onChange={(event) => setOrganizationSlug(event.target.value)}
          required
        />
        <label className="admin-label" htmlFor="forgot-email">
          Email
        </label>
        <input
          id="forgot-email"
          className="admin-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {error ? <p className="admin-error">{error}</p> : null}
        {message ? <p className="admin-success">{message}</p> : null}
        <button
          type="submit"
          className={`admin-button${submitting ? ' admin-button--busy' : ''}`}
          disabled={submitting || !email.trim()}
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
        <p className="admin-form-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </PageShell>
  )
}
