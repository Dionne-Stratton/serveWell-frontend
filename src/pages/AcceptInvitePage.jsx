import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  acceptAdminInvite,
  ApiError,
  previewAdminInvite,
} from '../api/client'
import { setAdminToken } from '../auth/token'
import { useAdminAuth } from '../auth/useAdminAuth'
import { adminDashboardPath } from '../utils/organizationPaths'
import PageShell from '../components/PageShell'
import '../styles/admin.css'

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') ?? ''
  const { refreshSession } = useAdminAuth()
  const [invite, setInvite] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!tokenFromUrl.trim()) {
        setLoadError('This invitation link is missing a token.')
        setLoadingInvite(false)
        return
      }

      try {
        const data = await previewAdminInvite(tokenFromUrl.trim())
        if (!cancelled) {
          setInvite(data.invite ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : 'This invitation link is invalid or has expired.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingInvite(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [tokenFromUrl])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!tokenFromUrl.trim()) {
      setError('This invitation link is missing a token.')
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
      const data = await acceptAdminInvite(
        tokenFromUrl.trim(),
        newPassword,
        confirmPassword,
      )
      setAdminToken(data.token)
      await refreshSession()
      const slug = data.organization?.slug
      navigate(slug ? adminDashboardPath(slug) : '/login', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to accept invitation. The link may have expired.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="Accept invitation" className="admin-auth-page" showHomeLink={false}>
      {loadingInvite ? <p className="admin-loading">Loading invitation…</p> : null}
      {loadError ? <p className="admin-error">{loadError}</p> : null}

      {invite && !loadError ? (
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <p className="lede">
            You&apos;re joining <strong>{invite.organizationName}</strong> as an admin.
            Set a password for <strong>{invite.email}</strong>.
          </p>
          <label className="admin-label" htmlFor="invite-password">
            Password
          </label>
          <input
            id="invite-password"
            className="admin-input"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
          />
          <label className="admin-label" htmlFor="invite-password-confirm">
            Confirm password
          </label>
          <input
            id="invite-password-confirm"
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
            disabled={submitting}
          >
            {submitting ? 'Creating account…' : 'Join team'}
          </button>
          <p className="admin-form-footer">
            <Link to="/login">Staff sign in</Link>
          </p>
        </form>
      ) : null}
    </PageShell>
  )
}
