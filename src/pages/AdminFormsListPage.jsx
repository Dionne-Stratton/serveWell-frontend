import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ApiError,
  deleteAdminForm,
  getAdminForms,
  patchAdminForm,
} from '../api/client'
import { useAdminAuth } from '../auth/useAdminAuth'
import AdminLayout from '../components/admin/AdminLayout'
import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'
import {
  organizationAdminFormEditPath,
  organizationAdminFormNewPath,
} from '../utils/organizationPaths'
import { publicVolunteerFormUrl } from '../utils/publicSiteUrl'
import styles from './AdminFormsListPage.module.css'
import softBtn from '../styles/adminSoftButtons.module.css'
import '../styles/admin.css'

const COPY_FEEDBACK_MS = 2000

function CopyLinkIcon() {
  return (
    <svg
      className="admin-copy-link-btn__icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CopiedIcon() {
  return (
    <svg
      className="admin-copy-link-btn__icon admin-copy-link-btn__icon--check"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg
      className={styles.externalLinkIcon}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

export default function AdminFormsListPage() {
  const { organizationSlug } = useParams()
  const { organization } = useAdminAuth()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedFormId, setCopiedFormId] = useState(null)

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
      setCopiedFormId(form.id)
      setTimeout(() => {
        setCopiedFormId((current) => (current === form.id ? null : current))
      }, COPY_FEEDBACK_MS)
    } catch {
      window.alert('Could not copy to clipboard.')
    }
  }

  async function handleSetFormActive(form, nextActive) {
    const url = publicVolunteerFormUrl(organizationSlug, form.slug)

    if (nextActive) {
      const confirmed = window.confirm(
        `Activate “${form.name}”?\n\nThis link will accept new volunteer submissions again:\n${url}`,
      )
      if (!confirmed) return
    } else {
      const confirmed = window.confirm(
        `Deactivate “${form.name}”?\n\nIf this link is on your church website, visitors will see that the form is not accepting submissions:\n${url}\n\nYou can turn the form back on here or from Edit. Submissions you already received stay in Volunteers.`,
      )
      if (!confirmed) return
    }

    try {
      const data = await patchAdminForm(form.id, { isActive: nextActive })
      const updated = data.form
      setForms((current) =>
        current.map((item) => (item.id === form.id ? { ...item, ...updated } : item)),
      )
    } catch (err) {
      window.alert(
        err instanceof ApiError
          ? err.message
          : nextActive
            ? 'Unable to activate this form.'
            : 'Unable to deactivate this form.',
      )
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

  const cardButtonClass = softBtn.softBtn
  const deleteButtonClass = softBtn.softBtnDanger

  return (
    <AdminLayout title="Volunteer forms">
      {!isDemoOrg ? (
        <p className="admin-inline-actions">
          <Link
            className={softBtn.saveBtn}
            to={organizationAdminFormNewPath(organizationSlug)}
          >
            + Add New
          </Link>
        </p>
      ) : null}
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
              const linkCopied = copiedFormId === form.id

              return (
                <article key={form.id} className="admin-form-card">
                  <header className="admin-form-card__header">
                    <h2 className="admin-form-card__title">{form.name}</h2>
                    {!form.isActive ? (
                      <span className="admin-form-card__badge">Inactive</span>
                    ) : null}
                  </header>

                  <p className="admin-form-card__url">
                    <span className="admin-form-card__url-line">
                      <span className="admin-form-card__url-text">{publicUrl}</span>
                      <button
                        type="button"
                        className="admin-copy-link-btn"
                        aria-label={linkCopied ? 'Copied' : 'Copy link'}
                        title={linkCopied ? 'Copied' : 'Copy link'}
                        onClick={() => handleCopy(form, publicUrl)}
                      >
                        {linkCopied ? <CopiedIcon /> : <CopyLinkIcon />}
                      </button>
                    </span>
                  </p>

                  <div className={styles.actions}>
                    <a
                      className={`${cardButtonClass} ${styles.viewLink}`}
                      href={volunteerViewPath}
                      target="_blank"
                      rel="noreferrer"
                      title="Opens in new tab"
                    >
                      View
                      <ExternalLinkIcon />
                    </a>
                    <Link
                      className={cardButtonClass}
                      to={organizationAdminFormEditPath(organizationSlug, form.slug)}
                    >
                      Edit
                    </Link>
                    {!isDemoOrg ? (
                      <button
                        type="button"
                        className={cardButtonClass}
                        onClick={() => handleSetFormActive(form, !form.isActive)}
                      >
                        {form.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : null}
                    {!isDemoOrg ? (
                      <button
                        type="button"
                        className={deleteButtonClass}
                        onClick={() => handleDelete(form)}
                      >
                        Delete
                      </button>
                    ) : null}
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
