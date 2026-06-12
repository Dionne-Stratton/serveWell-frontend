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
  adminFormSetupPath,
  demoVolunteerPath,
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

export default function AdminFormsListPage({
  organizationSlug: organizationSlugProp,
}) {
  const { organizationSlug: organizationSlugParam } = useParams()
  const { organization } = useAdminAuth()
  const organizationSlug =
    organizationSlugProp ?? organizationSlugParam ?? organization?.slug
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

  const activeForms = forms.filter((form) => form.isActive !== false)
  const inactiveForms = forms.filter((form) => form.isActive === false)

  function renderFormCard(form, { inactiveSection = false } = {}) {
    const publicUrl = publicVolunteerFormUrl(organizationSlug, form.slug)
    const volunteerViewPath = isDemoOrg
      ? demoVolunteerPath()
      : `/${organizationSlug}/forms/${form.slug}`
    const linkCopied = copiedFormId === form.id
    const cardClassName = inactiveSection
      ? 'admin-form-card admin-form-card--inactive'
      : 'admin-form-card'

    return (
      <article key={form.id} className={cardClassName}>
        <header className="admin-form-card__header">
          <h3 className="admin-form-card__title">{form.name}</h3>
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
          {isDemoOrg ? (
            <Link
              className={cardButtonClass}
              to={adminFormSetupPath(organizationSlug, form.slug)}
            >
              View setup
            </Link>
          ) : (
            <>
              <Link
                className={cardButtonClass}
                to={organizationAdminFormEditPath(organizationSlug, form.slug)}
              >
                Edit
              </Link>
              <button
                type="button"
                className={cardButtonClass}
                onClick={() => handleSetFormActive(form, !form.isActive)}
              >
                {form.isActive !== false ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                className={deleteButtonClass}
                onClick={() => handleDelete(form)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </article>
    )
  }

  return (
    <AdminLayout>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Forms</h1>
          <p className="admin-page-subtitle">
            Active forms accept new volunteer submissions. Inactive forms keep their link but turn
            submissions off.
          </p>
        </div>
      </header>

      {isDemoOrg ? (
        <p className="admin-muted admin-forms-list__demo-note">
          Demo: you can open the volunteer form and view how this form is set up. Editing is
          disabled here.
        </p>
      ) : null}

      {loading ? <p className="admin-loading">Loading forms…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error ? (
        <>
          <section className="admin-schedules-hub-section" aria-labelledby="active-forms-heading">
            <div className="admin-schedules-hub-section__header">
              <h2 id="active-forms-heading" className="admin-schedules-hub-section__title">
                Active Forms
              </h2>
              {!isDemoOrg ? (
                <Link
                  className="admin-button admin-button--inline"
                  to={organizationAdminFormNewPath(organizationSlug)}
                >
                  Add new form
                </Link>
              ) : null}
            </div>
            <p className="admin-help admin-schedules-hub-section__lead">
              These forms are live for volunteers. Share the link on your website or in
              announcements.
            </p>

            {activeForms.length === 0 ? (
              <div className="admin-empty-state">
                <p>
                  {forms.length === 0
                    ? 'No volunteer forms yet. Add a form to start collecting sign-ups.'
                    : 'No active forms. Activate a form below or add a new one.'}
                </p>
              </div>
            ) : (
              <div className="admin-form-card-list">
                {activeForms.map((form) => renderFormCard(form))}
              </div>
            )}
          </section>

          <section className="admin-schedules-hub-section" aria-labelledby="inactive-forms-heading">
            <div className="admin-schedules-hub-section__header">
              <h2 id="inactive-forms-heading" className="admin-schedules-hub-section__title">
                Inactive Forms
              </h2>
            </div>
            <p className="admin-help admin-schedules-hub-section__lead">
              Deactivated forms do not accept new submissions. Existing volunteer records are
              unchanged.
            </p>

            {inactiveForms.length === 0 ? (
              <div className="admin-empty-state">
                <p>No inactive forms.</p>
              </div>
            ) : (
              <div className="admin-form-card-list">
                {inactiveForms.map((form) => renderFormCard(form, { inactiveSection: true }))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </AdminLayout>
  )
}
