import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  createAdminForm,
  getPlanningCenterIntegration,
} from '../api/client'
import { useAdminAuth } from '../auth/useAdminAuth'
import AdminLayout from '../components/admin/AdminLayout'
import AdminToast from '../components/admin/AdminToast'
import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'
import {
  organizationAdminFormEditPath,
  organizationAdminFormsPath,
} from '../utils/organizationPaths'
import '../styles/admin.css'

const TEMPLATE_STANDARD = 'church_volunteer_default'
const TEMPLATE_BLANK = 'blank'

function slugFromName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export default function AdminFormCreatePage() {
  const { organizationSlug } = useParams()
  const navigate = useNavigate()
  const { organization } = useAdminAuth()
  const formsListPath = organizationAdminFormsPath(organizationSlug)

  const isDemoOrg =
    organizationSlug === DEMO_ORGANIZATION_SLUG ||
    organization?.slug === DEMO_ORGANIZATION_SLUG

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [templateKey, setTemplateKey] = useState(TEMPLATE_STANDARD)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [planningCenterConnected, setPlanningCenterConnected] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadIntegration() {
      try {
        const data = await getPlanningCenterIntegration()
        if (!cancelled) {
          setPlanningCenterConnected(data.integration?.status === 'connected')
        }
      } catch {
        if (!cancelled) {
          setPlanningCenterConnected(false)
        }
      }
    }

    if (!isDemoOrg) {
      loadIntegration()
    }

    return () => {
      cancelled = true
    }
  }, [isDemoOrg])

  function handleNameChange(event) {
    const nextName = event.target.value
    setName(nextName)
    if (!slugTouched) {
      setSlug(slugFromName(nextName))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedSlug = slug.trim().toLowerCase()

    if (!trimmedName || !trimmedSlug) {
      setError('Name and URL slug are required.')
      return
    }

    setSubmitting(true)

    try {
      const data = await createAdminForm({
        name: trimmedName,
        slug: trimmedSlug,
        templateKey,
      })
      const { form, planningCenter } = data

      if (planningCenter?.tabCreated && planningCenter.tabName) {
        setToastMessage(`Planning Center tab “${planningCenter.tabName}” created.`)
        window.setTimeout(() => {
          navigate(organizationAdminFormEditPath(organizationSlug, form.slug))
        }, 1200)
        return
      }

      navigate(organizationAdminFormEditPath(organizationSlug, form.slug))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create form.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isDemoOrg) {
    return (
      <AdminLayout title="New volunteer form">
        <p className="admin-back">
          <button
            type="button"
            className="admin-back-link"
            onClick={() => navigate(formsListPath)}
          >
            ← All forms
          </button>
        </p>
        <p className="admin-error">The demo organization cannot create forms.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="New volunteer form">
      <p className="admin-back">
        <button
          type="button"
          className="admin-back-link"
          onClick={() => navigate(formsListPath)}
        >
          ← All forms
        </button>
      </p>

      <form className="admin-form-editor" onSubmit={handleSubmit}>
        <div className="admin-field">
          <label className="admin-label" htmlFor="new-form-name">
            Form name
          </label>
          <input
            id="new-form-name"
            className="admin-input"
            value={name}
            onChange={handleNameChange}
            required
            autoFocus
          />
        </div>

        <div className="admin-field">
          <label className="admin-label" htmlFor="new-form-slug">
            URL slug
          </label>
          <input
            id="new-form-slug"
            className="admin-input"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true)
              setSlug(event.target.value)
            }}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Lowercase letters, numbers, and hyphens"
          />
        </div>

        <div className="admin-field">
          <label className="admin-label" htmlFor="new-form-template">
            Starting content
          </label>
          <select
            id="new-form-template"
            className="admin-input"
            value={templateKey}
            onChange={(event) => setTemplateKey(event.target.value)}
          >
            <option value={TEMPLATE_STANDARD}>Standard volunteer areas</option>
            <option value={TEMPLATE_BLANK}>Empty (add sections yourself)</option>
          </select>
        </div>

        {error ? <p className="admin-error">{error}</p> : null}

        {planningCenterConnected ? (
          <p className="admin-muted admin-help--nested">
            Planning Center is connected. Creating this form also adds a matching person
            profile tab named <strong>SW: …</strong> using this form&apos;s name.
          </p>
        ) : null}

        <div className="admin-save-bar">
          <button
            type="submit"
            className={`admin-button admin-button--inline${submitting ? ' admin-button--busy' : ''}`}
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create form'}
          </button>
          <button
            type="button"
            className="admin-button admin-button--secondary admin-button--inline"
            disabled={submitting}
            onClick={() => navigate(formsListPath)}
          >
            Cancel
          </button>
        </div>
      </form>

      <AdminToast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </AdminLayout>
  )
}
