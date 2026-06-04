import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, resetPasswordWithToken } from '../api/client'
import { clearAdminToken } from '../auth/token'
import PageShell from '../components/PageShell'
import '../styles/admin.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!tokenFromUrl.trim()) {
      setError('This reset link is missing a token. Request a new link from sign in.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      await resetPasswordWithToken(tokenFromUrl.trim(), newPassword)
      clearAdminToken()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to reset password. The link may have expired.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="Reset password" className="admin-auth-page" showHomeLink={false}>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <p className="lede">Choose a new password for your ServeWell staff account.</p>
        <label className="admin-label" htmlFor="reset-password">
          New password
        </label>
        <input
          id="reset-password"
          className="admin-input"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          minLength={8}
        />
        <label className="admin-label" htmlFor="reset-password-confirm">
          Confirm password
        </label>
        <input
          id="reset-password-confirm"
          className="admin-input"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={8}
        />
        {error ? <p className="admin-error">{error}</p> : null}
        <button
          type="submit"
          className={`admin-button${submitting ? ' admin-button--busy' : ''}`}
          disabled={submitting || !tokenFromUrl}
        >
          {submitting ? 'Saving…' : 'Update password'}
        </button>
        <p className="admin-form-footer">
          <Link to="/login">Back to sign in</Link>
          {' · '}
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      </form>
    </PageShell>
  )
}
