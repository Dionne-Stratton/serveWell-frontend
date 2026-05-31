import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAdminAuth } from '../auth/useAdminAuth'
import PageShell from '../components/PageShell'
import { adminDashboardPath } from '../utils/organizationPaths'
import { suggestOrganizationSlug } from '../utils/organizationSlug'
import '../styles/admin.css'

const ORGANIZATION_TYPES = [
  { value: 'church', label: 'Church' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'other', label: 'Other' },
]

function RequiredMark() {
  return (
    <>
      {' '}
      <span className="admin-label-required" aria-hidden="true">
        *
      </span>
    </>
  )
}

export default function SignupPage() {
  const { register } = useAdminAuth()
  const navigate = useNavigate()

  const [organizationName, setOrganizationName] = useState('')
  const [organizationSlug, setOrganizationSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [organizationType, setOrganizationType] = useState('church')
  const [contactEmail, setContactEmail] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [adminDisplayName, setAdminDisplayName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleOrganizationNameChange(value) {
    setOrganizationName(value)
    if (!slugEdited) {
      setOrganizationSlug(suggestOrganizationSlug(value))
    }
  }

  function handleSlugChange(value) {
    setSlugEdited(true)
    setOrganizationSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (adminPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (adminPassword !== adminPasswordConfirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      const session = await register({
        organizationName: organizationName.trim(),
        organizationSlug: organizationSlug.trim(),
        organizationType,
        contactEmail: contactEmail.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        adminEmail: adminEmail.trim(),
        adminPassword,
        adminDisplayName: adminDisplayName.trim(),
      })

      const slug = session.organization?.slug
      if (!slug) {
        setError('Account created, but we could not open your dashboard.')
        return
      }

      navigate(adminDashboardPath(slug), { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to create your workspace. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Create your church workspace"
      className="admin-auth-page"
      backLink={{ to: '/', label: '← Home' }}
    >
      <form className="admin-login-form admin-signup-form" onSubmit={handleSubmit}>
        <p className="lede">
          Set up your organization and the first admin account. A default volunteer
          form is created automatically from the church template.
        </p>

        <fieldset className="admin-fieldset">
          <legend className="admin-fieldset__legend">Organization</legend>
          <div className="admin-field">
            <label className="admin-label" htmlFor="organization-name">
              Church or organization name
              <RequiredMark />
            </label>
            <input
              id="organization-name"
              className="admin-input"
              type="text"
              autoComplete="organization"
              value={organizationName}
              onChange={(event) => handleOrganizationNameChange(event.target.value)}
              required
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="organization-slug">
              Public URL slug
              <RequiredMark />
            </label>
            <input
              id="organization-slug"
              className="admin-input"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={organizationSlug}
              onChange={(event) => handleSlugChange(event.target.value)}
              required
            />
            <p className="admin-help">
              Your pages will use servewellsystems.com/
              {organizationSlug || 'your-slug'}
              … (lowercase letters, numbers, hyphens).
            </p>
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="organization-type">
              Type
            </label>
            <select
              id="organization-type"
              className="admin-input"
              value={organizationType}
              onChange={(event) => setOrganizationType(event.target.value)}
            >
              {ORGANIZATION_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="contact-email">
              Organization contact email (optional)
            </label>
            <input
              id="contact-email"
              className="admin-input"
              type="email"
              autoComplete="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="website-url">
              Website (optional)
            </label>
            <input
              id="website-url"
              className="admin-input"
              type="url"
              autoComplete="url"
              placeholder="https://"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend className="admin-fieldset__legend">Admin account</legend>
          <div className="admin-field">
            <label className="admin-label" htmlFor="admin-display-name">
              Your name
              <RequiredMark />
            </label>
            <input
              id="admin-display-name"
              className="admin-input"
              type="text"
              autoComplete="name"
              value={adminDisplayName}
              onChange={(event) => setAdminDisplayName(event.target.value)}
              required
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="signup-admin-email">
              Work email
              <RequiredMark />
            </label>
            <input
              id="signup-admin-email"
              className="admin-input"
              type="email"
              autoComplete="username"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              required
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="signup-admin-password">
              Password
              <RequiredMark />
            </label>
            <input
              id="signup-admin-password"
              className="admin-input"
              type="password"
              autoComplete="new-password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="signup-admin-password-confirm">
              Confirm password
              <RequiredMark />
            </label>
            <input
              id="signup-admin-password-confirm"
              className="admin-input"
              type="password"
              autoComplete="new-password"
              value={adminPasswordConfirm}
              onChange={(event) => setAdminPasswordConfirm(event.target.value)}
              required
              minLength={8}
            />
          </div>
        </fieldset>

        {error ? <p className="admin-error">{error}</p> : null}
        <button
          type="submit"
          className={`admin-button${submitting ? ' admin-button--busy' : ''}`}
          disabled={submitting}
        >
          {submitting ? 'Creating workspace…' : 'Create workspace'}
        </button>
        <p className="admin-form-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </PageShell>
  )
}
