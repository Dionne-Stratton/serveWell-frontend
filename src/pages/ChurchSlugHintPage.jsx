import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, requestChurchSlugHint } from '../api/client'
import PageShell from '../components/PageShell'
import '../styles/admin.css'

export default function ChurchSlugHintPage() {
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
      const data = await requestChurchSlugHint(email.trim())
      setMessage(
        data.message ??
          'If an account exists for that email, we sent a reminder with your church name and URL slug.',
      )
      setEmail('')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to send a reminder. Try again later.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Church URL slug reminder"
      className="admin-auth-page"
      showHomeLink={false}
    >
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <p className="lede">
          Enter the email you use for staff sign-in. If you have an account, we will
          email your church name and the URL slug to enter on the sign-in page.
        </p>
        <label className="admin-label" htmlFor="hint-email">
          Email
        </label>
        <input
          id="hint-email"
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
          {submitting ? 'Sending…' : 'Email me my church slug'}
        </button>
        <p className="admin-form-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </PageShell>
  )
}
