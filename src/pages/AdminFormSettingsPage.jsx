import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, getAdminForms, patchAdminForm } from '../api/client'
import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'
import AdminLayout from '../components/admin/AdminLayout'
import {
  adminDashboardPath,
  organizationVolunteerPath,
} from '../utils/organizationPaths'
import '../styles/admin.css'

const DEFAULT_INTRO =
  "Thank you for wanting to serve. Share a little about yourself and where you'd like to help — we'll follow up with you soon."

const DEFAULT_SUCCESS =
  'Thank you! Your interest has been submitted. Someone from the church will follow up with you soon.'

export default function AdminFormSettingsPage() {
  const { organizationSlug } = useParams()
  const [formId, setFormId] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [introText, setIntroText] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const data = await getAdminForms()
        const forms = data.forms ?? []
        const target = forms.find((f) => f.isDefault) ?? forms[0]

        if (!target) {
          if (!cancelled) {
            setError('No volunteer form exists for this organization yet.')
          }
          return
        }

        if (!cancelled) {
          setFormId(target.id)
          setName(target.name ?? '')
          setDescription(target.description ?? '')
          setIntroText(target.introText ?? '')
          setSuccessMessage(target.successMessage ?? '')
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Unable to load form settings.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (organizationSlug === DEMO_ORGANIZATION_SLUG) {
    return (
      <AdminLayout>
        <p className="admin-error">The demo form is read-only.</p>
        <p>
          <Link to={adminDashboardPath(organizationSlug)}>← Back to dashboard</Link>
        </p>
      </AdminLayout>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!formId) {
      return
    }

    setSaveError('')
    setSaveSuccess('')
    setSubmitting(true)

    try {
      await patchAdminForm(formId, {
        name: name.trim(),
        description: description.trim() || null,
        introText: introText.trim() || null,
        successMessage: successMessage.trim() || null,
      })
      setSaveSuccess('Form settings saved.')
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : 'Unable to save form settings.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <p className="admin-back">
        <Link to={adminDashboardPath(organizationSlug)}>← Back to dashboard</Link>
      </p>
      {organizationSlug ? (
        <p className="admin-help">
          Public form:{' '}
          <Link to={organizationVolunteerPath(organizationSlug)}>
            /{organizationSlug}/volunteer
          </Link>
        </p>
      ) : null}

      {loading ? <p className="admin-loading">Loading form…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error && formId ? (
        <form className="admin-login-form admin-signup-form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label className="admin-label" htmlFor="form-name">
              Form title
            </label>
            <input
              id="form-name"
              className="admin-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="form-description">
              Short description (optional)
            </label>
            <input
              id="form-description"
              className="admin-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="form-intro">
              Intro text (shown at top of form)
            </label>
            <textarea
              id="form-intro"
              className="admin-textarea"
              rows={4}
              value={introText}
              onChange={(event) => setIntroText(event.target.value)}
              placeholder={DEFAULT_INTRO}
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="form-success">
              Thank-you message (after submit)
            </label>
            <textarea
              id="form-success"
              className="admin-textarea"
              rows={4}
              value={successMessage}
              onChange={(event) => setSuccessMessage(event.target.value)}
              placeholder={DEFAULT_SUCCESS}
            />
          </div>

          {saveError ? <p className="admin-error">{saveError}</p> : null}
          {saveSuccess ? <p className="admin-save-success">{saveSuccess}</p> : null}

          <button
            type="submit"
            className={`admin-button${submitting ? ' admin-button--busy' : ''}`}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save form settings'}
          </button>
        </form>
      ) : null}
    </AdminLayout>
  )
}
