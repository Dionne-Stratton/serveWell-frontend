import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ApiError,
  deleteAdminForm,
  getAdminForms,
} from '../api/client'
import { useAdminAuth } from '../auth/useAdminAuth'
import AdminLayout from '../components/admin/AdminLayout'
import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'
import {
  organizationAdminFormEditPath,
  organizationAdminFormNewPath,
} from '../utils/organizationPaths'
import { publicVolunteerFormUrl } from '../utils/publicSiteUrl'
import '../styles/admin.css'

export default function AdminFormsListPage() {
  const { organizationSlug } = useParams()
  const { organization } = useAdminAuth()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const data = await getAdminForms()
        if (!cancelled) {
          setForms(data.forms ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Unable to load forms.',
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

  async function handleCopy(form, url) {
    try {
      await navigator.clipboard.writeText(url)
      setCopyMessage(`Copied link for “${form.name}”.`)
      setTimeout(() => setCopyMessage(''), 3000)
    } catch {
      setCopyMessage('Could not copy to clipboard.')
    }
  }

  async function handleDelete(form) {
    const url = publicVolunteerFormUrl(organizationSlug, form.slug)
    const confirmed = window.confirm(
      `Delete “${form.name}” permanently?\n\nIf this link is on your church website, it will stop working:\n${url}\n\nVolunteer submissions you already received will stay in your dashboard.\n\nThis cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteAdminForm(form.id)
      setForms((current) => current.filter((item) => item.id !== form.id))
    } catch (err) {
      window.alert(
        err instanceof ApiError ? err.message : 'Unable to delete this form.',
      )
    }
  }

  const isDemoOrg =
    organizationSlug === DEMO_ORGANIZATION_SLUG ||
    organization?.slug === DEMO_ORGANIZATION_SLUG

  return (
    <AdminLayout title="Volunteer forms">
      {!isDemoOrg ? (
        <p className="admin-inline-actions">
          <Link
            className="admin-button admin-button--inline"
            to={organizationAdminFormNewPath(organizationSlug)}
          >
            New form
          </Link>
        </p>
      ) : null}
      {copyMessage ? <p className="admin-success">{copyMessage}</p> : null}
      {loading ? <p className="admin-loading">Loading forms…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error ? (
        <div className="admin-form-card-list">
          {forms.length === 0 ? (
            <p className="admin-muted">No volunteer forms yet.</p>
          ) : (
            forms.map((form) => {
              const publicUrl = publicVolunteerFormUrl(organizationSlug, form.slug)
              const volunteerViewPath = `/${organizationSlug}/forms/${form.slug}`

              return (
                <article key={form.id} className="admin-form-card">
                  <header className="admin-form-card__header">
                    <h2 className="admin-form-card__title">{form.name}</h2>
                    {!form.isActive ? (
                      <span className="admin-form-card__badge">Inactive</span>
                    ) : null}
                  </header>

                  <div className="admin-form-card__url">
                    <span className="admin-form-card__url-text">{publicUrl}</span>
                    <button
                      type="button"
                      className="admin-button admin-button--secondary admin-button--inline"
                      onClick={() => handleCopy(form, publicUrl)}
                    >
                      Copy link
                    </button>
                  </div>

                  <div className="admin-form-card__actions">
                    <a
                      className="admin-button admin-button--secondary admin-button--inline"
                      href={volunteerViewPath}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                    <Link
                      className="admin-button admin-button--secondary admin-button--inline"
                      to={organizationAdminFormEditPath(organizationSlug, form.slug)}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="admin-button admin-button--danger-inline"
                      onClick={() => handleDelete(form)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      ) : null}
    </AdminLayout>
  )
}
